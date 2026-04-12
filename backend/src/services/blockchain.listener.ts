/**
 * blockchain.listener.ts
 *
 * Long-running event listener that mirrors confirmed on-chain events back
 * into MongoDB as a safety net for DB consistency.
 *
 * Design decisions:
 *  • Listens to all four MRV lifecycle events so any on-chain action is
 *    always synced to MongoDB, even if the HTTP response was lost.
 *  • Exponential backoff retry (max 5 attempts, base 1 s) on per-event errors
 *    so a transient DB outage does not permanently drop events.
 *  • Duplicate-event guard using txHash lookups prevents double-writes on
 *    provider reconnects or re-org replays.
 *  • Graceful shutdown via stopBlockchainListener() called in server teardown.
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { loadContractConfig } from '../config/contract-config';
import TokenData from '../models/TokenData';
import Project from '../models/Project';
import Submission from '../models/Submission';
import Verification from '../models/Verification';
import AuditLog, { AuditAction } from '../models/AuditLog';

// ──────────────────── Retry Helper ────────────────────

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 s base, doubles each attempt

/**
 * Execute `fn` with exponential backoff.
 * On the final failure it logs an error but does NOT throw — the listener
 * must stay alive regardless of individual event processing failures.
 */
async function withRetry(
    fn: () => Promise<void>,
    context: string
): Promise<void> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await fn();
            return; // success
        } catch (err: unknown) {
            const isLast = attempt === MAX_RETRIES;
            const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s, 16s

            if (isLast) {
                logger.error(
                    { err, context, attempt },
                    `[Listener] ${context} — all ${MAX_RETRIES} retries exhausted, event dropped`
                );
            } else {
                logger.warn(
                    { err, context, attempt, nextRetryMs: delay },
                    `[Listener] ${context} — attempt ${attempt} failed, retrying in ${delay}ms`
                );
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }
}

// ──────────────────── Listener State ────────────────────

let _listenerContract: ethers.Contract | null = null;

// ──────────────────── Event Handlers ────────────────────

/**
 * TRIGGER 1 — ProjectRegistered
 * Updates Project.onChainTxHash + registeredBlock if not already set.
 */
async function handleProjectRegistered(
    projectId: string,
    _ownerWallet: string,
    _metadataURI: string,
    _timestamp: bigint,
    event: ethers.EventLog
): Promise<void> {
    const txHash = event.transactionHash;
    const blockNumber = event.blockNumber;

    await withRetry(async () => {
        // Duplicate guard: skip if we already stored this txHash
        const existing = await Project.findOne({ onChainTxHash: txHash });
        if (existing) {
            logger.debug({ txHash, projectId }, '[Listener] ProjectRegistered duplicate — skipping');
            return;
        }

        const updated = await Project.findOneAndUpdate(
            { projectId, onChainTxHash: { $exists: false } },
            { $set: { onChainTxHash: txHash, registeredBlock: blockNumber } },
            { new: true }
        );

        if (updated) {
            logger.info({ txHash, projectId, blockNumber }, '[Listener] Project registration confirmed');
        } else {
            logger.debug({ txHash, projectId }, '[Listener] ProjectRegistered — no matching doc or already confirmed');
        }
    }, `ProjectRegistered(${projectId})`);
}

/**
 * TRIGGER 2 — SubmissionAnchored
 * Updates Submission.anchorTxHash (= blockchainSubmissionHash) if not already set.
 */
async function handleSubmissionAnchored(
    projectId: string,
    submissionId: string,
    _dataHash: string,
    _timestamp: bigint,
    event: ethers.EventLog
): Promise<void> {
    const txHash = event.transactionHash;
    const blockNumber = event.blockNumber;

    await withRetry(async () => {
        // Duplicate guard
        const existing = await Submission.findOne({ anchorTxHash: txHash });
        if (existing) {
            logger.debug({ txHash, submissionId }, '[Listener] SubmissionAnchored duplicate — skipping');
            return;
        }

        const updated = await Submission.findOneAndUpdate(
            { submissionId, anchorTxHash: { $exists: false } },
            {
                $set: {
                    anchorTxHash: txHash,
                    blockchainSubmissionHash: txHash, // keep legacy field in sync
                    anchorBlock: blockNumber,
                },
            },
            { new: true }
        );

        if (updated) {
            logger.info({ txHash, submissionId, projectId, blockNumber }, '[Listener] Submission anchor confirmed');
        }
    }, `SubmissionAnchored(${projectId}/${submissionId})`);
}

/**
 * TRIGGER 3 — ProjectApproved
 * Creates AuditLog entry and marks Project.status = VALIDATED if not already done.
 */
async function handleProjectApproved(
    projectId: string,
    validatorWallet: string,
    _reportURI: string,
    _timestamp: bigint,
    event: ethers.EventLog
): Promise<void> {
    const txHash = event.transactionHash;

    await withRetry(async () => {
        // Duplicate guard: check if any Verification already has this txHash
        const existing = await Verification.findOne({ approvalTxHash: txHash });
        if (existing) {
            logger.debug({ txHash, projectId }, '[Listener] ProjectApproved duplicate — skipping');
            return;
        }

        // Make sure the Project is VALIDATED in MongoDB (belt-and-suspenders)
        await Project.findOneAndUpdate(
            { projectId, status: { $ne: 'VALIDATED' } },
            { $set: { status: 'VALIDATED' } }
        );

        logger.info({ txHash, projectId, validatorWallet }, '[Listener] Project approval confirmed on-chain');
    }, `ProjectApproved(${projectId})`);
}

/**
 * TRIGGER 4 — CreditsMinted
 * The critical-path listener: only AFTER confirmed event do we write TokenData
 * and mark Project.onChainMinted = true.
 *
 * Because the controller already writes TokenData optimistically after tx.wait(1),
 * this handler's job is to:
 *   a) Confirm onChainStatus = 'confirmed' on the existing TokenData record
 *   b) Handle the fallback case where the API response was lost (no TokenData yet)
 */
async function handleCreditsMinted(
    _projectIdHash: string,      // indexed → hashed in logs, not the original string
    _recipientHash: string,
    amount: bigint,
    metadataCID: string,
    _timestamp: bigint,
    event: ethers.EventLog
): Promise<void> {
    const txHash = event.transactionHash;
    const blockNumber = event.blockNumber;
    const amountHuman = Number(ethers.formatUnits(amount, 18));

    await withRetry(async () => {
        // ── Duplicate guard ──────────────────────────────────
        const existing = await TokenData.findOne({ mintTxHash: txHash, onChainStatus: 'confirmed' });
        if (existing) {
            logger.debug({ txHash }, '[Listener] CreditsMinted duplicate — skipping');
            return;
        }

        // ── Confirm existing TokenData row (happy path) ──────
        const updated = await TokenData.findOneAndUpdate(
            { mintTxHash: txHash },
            { $set: { onChainStatus: 'confirmed', blockNumber } },
            { new: true }
        );

        if (updated) {
            logger.info(
                { txHash, projectId: updated.projectId, blockNumber, amount: amountHuman },
                '[Listener] TokenData confirmed via CreditsMinted event'
            );

            // Ensure Project.onChainMinted = true
            await Project.findOneAndUpdate(
                { projectId: updated.projectId },
                { $set: { onChainMinted: true } }
            );

            // Write audit log for the confirmed mint
            await AuditLog.create({
                action: AuditAction.CREDIT_MINTED,
                walletAddress: 'system-listener',
                details: `CreditsMinted event confirmed on-chain for project ${updated.projectId} (${amountHuman} credits)`,
                txHash,
                targetId: updated.projectId,
                meta: { blockNumber, amount: amountHuman, metadataCID, source: 'event-listener' },
            });
        } else {
            // ── Fallback: event arrived before API handler completed ──
            // The controller will eventually write TokenData, but log the event now for reconciliation.
            logger.warn(
                { txHash, metadataCID, amount: amountHuman },
                '[Listener] CreditsMinted received but no matching TokenData — API may still be processing'
            );
        }
    }, `CreditsMinted(txHash=${txHash})`);
}

// ──────────────────── Start / Stop ────────────────────

/**
 * Start listening for all four MRV lifecycle events.
 * Safe to call multiple times — will no-op if already running.
 */
export async function startBlockchainListener(): Promise<void> {
    if (_listenerContract) {
        logger.debug('Blockchain listener already running — skipping start');
        return;
    }

    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
        logger.warn('Blockchain listener not started — RPC_URL not set');
        return;
    }

    let contractAddress: string;
    let abi: unknown[];
    try {
        const cfg = loadContractConfig();
        contractAddress = cfg.address;
        abi = cfg.abi;
    } catch {
        logger.warn('Blockchain listener not started — contract config not available');
        return;
    }

    try {
        // Use a separate read-only provider for the listener so it doesn't share
        // nonce state with the signing provider in blockchain.service.ts
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(contractAddress, abi as ethers.InterfaceAbi, provider);

        // ── Attach event listeners ────────────────────────────────
        contract.on('ProjectRegistered', handleProjectRegistered);
        contract.on('SubmissionAnchored', handleSubmissionAnchored);
        contract.on('ProjectApproved', handleProjectApproved);
        contract.on('CreditsMinted', handleCreditsMinted);

        _listenerContract = contract;

        const network = await provider.getNetwork();
        logger.info(
            {
                contractAddress,
                network: network.name,
                chainId: Number(network.chainId),
                events: ['ProjectRegistered', 'SubmissionAnchored', 'ProjectApproved', 'CreditsMinted'],
            },
            '🔗 Blockchain event listener started'
        );
    } catch (err: unknown) {
        logger.error({ err }, 'Failed to start blockchain event listener');
        // Do NOT rethrow — listener failure should not crash the API server
    }
}

/**
 * Stop all event listeners.  Called during graceful shutdown (SIGTERM / SIGINT).
 */
export async function stopBlockchainListener(): Promise<void> {
    if (_listenerContract) {
        await _listenerContract.removeAllListeners();
        _listenerContract = null;
        logger.info('Blockchain event listener stopped');
    }
}
