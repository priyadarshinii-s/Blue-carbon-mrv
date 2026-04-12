/**
 * blockchain.service.ts
 *
 * Singleton Ethers.js v6 service — single source of truth for all on-chain
 * interactions in the Blue Carbon MRV backend.
 *
 * Architecture decisions:
 *  • One wallet (PRIVATE_KEY env) signs every tx.  That wallet holds ADMIN_ROLE
 *    on the contract (granted during deploy).
 *  • Provider / wallet / contract are lazy-initialised and cached as module-level
 *    singletons — equivalent to NestJS Injectable({ scope: Scope.DEFAULT }).
 *  • DB writes NEVER happen here — controllers call tx.wait(1) inside this
 *    service and receive a typed result; the controller then updates MongoDB.
 *  • On-chain failures throw — the caller (controller) catches and decides
 *    whether to propagate or swallow (per the error-handling strategy).
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { loadContractConfig } from '../config/contract-config';

// ──────────────────── Return Types ────────────────────

export interface TxReceipt {
    txHash: string;
    blockNumber: number;
    gasUsed: string;
}

export interface MintResult extends TxReceipt {
    amountWei: string;
}

export interface OnChainEvent {
    eventName: string;
    txHash: string;
    blockNumber: number;
    timestamp: number | null;  // unix seconds — null for older blocks where timestamp isn't fetched
    args: Record<string, unknown>;
}

interface BlockchainConfig {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
}

// ──────────────────── Config ────────────────────

function getEnvConfig(): BlockchainConfig {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;

    // Contract address comes from env OR from contract-config.json (loaded below)
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl) throw new Error('RPC_URL environment variable is not set');
    if (!privateKey) throw new Error('PRIVATE_KEY environment variable is not set');
    if (!contractAddress) throw new Error('CONTRACT_ADDRESS environment variable is not set');

    return { rpcUrl, privateKey, contractAddress };
}

// ──────────────────── Singleton Instances ────────────────────

let _provider: ethers.JsonRpcProvider | null = null;
let _signer: ethers.Signer | null = null;
let _contract: ethers.Contract | null = null;

function getProvider(): ethers.JsonRpcProvider {
    if (!_provider) {
        const { rpcUrl } = getEnvConfig();
        _provider = new ethers.JsonRpcProvider(rpcUrl);
    }
    return _provider;
}

/**
 * Connect and return the admin wallet used for signing all transactions.
 * Exported for health-check and test use.
 */
/**
 * Connect and return the admin wallet used for signing all transactions.
 * Wrapped in NonceManager to prevent expected nonce errors with concurrent transactions.
 */
export async function connectWallet(): Promise<ethers.Signer> {
    if (!_signer) {
        const { privateKey } = getEnvConfig();
        const wallet = new ethers.Wallet(privateKey, getProvider());
        _signer = new ethers.NonceManager(wallet);
        logger.info({ address: wallet.address }, 'Blockchain wallet connected (with NonceManager)');
    }
    return _signer;
}

/**
 * Get a connected contract instance, loading ABI from contract-config.json
 * (written by the deploy script) with env-var + inline ABI fallback.
 */
export async function getContract(): Promise<ethers.Contract> {
    if (!_contract) {
        const signer = await connectWallet();
        const { address, abi } = loadContractConfig();
        _contract = new ethers.Contract(address, abi as ethers.InterfaceAbi, signer);
        logger.info({ contractAddress: address }, 'Contract instance created');
    }
    return _contract;
}

// ──────────────────── Confirmation Helper ────────────────────

/** Default confirmations to wait for — override via CONFIRMATION_BLOCKS env */
const CONFIRMATION_BLOCKS = parseInt(process.env.CONFIRMATION_BLOCKS || '1', 10);

async function waitForReceipt(tx: ethers.ContractTransactionResponse, context: string): Promise<ethers.TransactionReceipt> {
    const receipt = await tx.wait(CONFIRMATION_BLOCKS);
    if (!receipt) {
        throw new Error(`${context}: transaction receipt is null — tx may have been dropped (hash: ${tx.hash})`);
    }
    return receipt;
}

// ──────────────────── TRIGGER 1: Project Registration ────────────────────

/**
 * Register a new project on-chain after it has been created in MongoDB.
 * Calls `registerProject(projectId, ownerWallet, metadataURI)`.
 *
 * Idempotency: the contract reverts with ProjectAlreadyRegistered if called
 * twice — the caller should check `onChainTxHash` in MongoDB first.
 *
 * @param projectId   MRV project identifier (e.g. "PROJ-20240410-ABC123")
 * @param ownerWallet Ethereum address of the project owner
 * @param metadataURI IPFS URI containing project metadata (optional — pass '' if no IPFS)
 */
export async function registerProjectOnChain(
    projectId: string,
    ownerWallet: string,
    metadataURI: string
): Promise<TxReceipt> {
    const contract = await getContract();
    const uri = metadataURI || `mrv://project/${projectId}`; // guaranteed non-empty

    logger.info({ projectId, ownerWallet, metadataURI: uri }, 'Registering project on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.registerProject(
        projectId,
        ownerWallet,
        uri
    );

    logger.info({ txHash: tx.hash, projectId }, 'registerProject tx broadcast');

    const receipt = await waitForReceipt(tx, 'registerProject');

    logger.info(
        { txHash: receipt.hash, blockNumber: receipt.blockNumber, projectId },
        'Project registered on-chain'
    );

    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
    };
}

// ──────────────────── TRIGGER 1b: Field Officer Assignment ────────────────────

/**
 * Record a field officer assignment on-chain.
 * Emits FieldOfficerAssigned event for explorer tracking.
 */
export async function assignFieldOfficerOnChain(
    projectId: string,
    fieldOfficerWallet: string
): Promise<TxReceipt> {
    const contract = await getContract();

    logger.info({ projectId, fieldOfficerWallet }, 'Recording field officer assignment on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.assignFieldOfficer(
        projectId,
        fieldOfficerWallet
    );

    logger.info({ txHash: tx.hash, projectId }, 'assignFieldOfficer tx broadcast');

    const receipt = await waitForReceipt(tx, 'assignFieldOfficer');

    logger.info(
        { txHash: receipt.hash, blockNumber: receipt.blockNumber, projectId },
        'Field officer assignment recorded on-chain'
    );

    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
    };
}

// ──────────────────── TRIGGER 1c: Validator Assignment ────────────────────

/**
 * Record a validator assignment on-chain.
 * Emits ValidatorAssigned event for explorer tracking.
 */
export async function assignValidatorOnChain(
    projectId: string,
    validatorWallet: string
): Promise<TxReceipt> {
    const contract = await getContract();

    logger.info({ projectId, validatorWallet }, 'Recording validator assignment on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.assignValidator(
        projectId,
        validatorWallet
    );

    logger.info({ txHash: tx.hash, projectId }, 'assignValidator tx broadcast');

    const receipt = await waitForReceipt(tx, 'assignValidator');

    logger.info(
        { txHash: receipt.hash, blockNumber: receipt.blockNumber, projectId },
        'Validator assignment recorded on-chain'
    );

    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
    };
}

// ──────────────────── TRIGGER 2: Submission Anchoring ────────────────────

/**
 * Anchor a field submission's data hash on-chain.
 * Calls `anchorSubmission(projectId, submissionId, keccak256(canonicalJSON))`.
 *
 * The `dataHash` should be computed by the caller as:
 *   ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(submissionData)))
 *
 * Idempotency: the contract reverts with SubmissionAlreadyAnchored if called
 * twice for the same (projectId, submissionId) pair.
 */
export async function anchorSubmissionOnChain(
    projectId: string,
    submissionId: string,
    dataHash: string   // hex bytes32, e.g. ethers.keccak256(...)
): Promise<TxReceipt> {
    const contract = await getContract();

    logger.info({ projectId, submissionId, dataHash }, 'Anchoring submission on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.anchorSubmission(
        projectId,
        submissionId,
        dataHash   // bytes32 — Ethers.js accepts a 0x-prefixed hex string
    );

    logger.info({ txHash: tx.hash, submissionId }, 'anchorSubmission tx broadcast');

    const receipt = await waitForReceipt(tx, 'anchorSubmission');

    logger.info(
        { txHash: receipt.hash, blockNumber: receipt.blockNumber, submissionId },
        'Submission anchored on-chain'
    );

    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
    };
}

// ──────────────────── TRIGGER 3: Validator Approval ────────────────────

/**
 * Record a validator's approval on-chain.
 * Calls `approveProject(projectId, validatorWallet, verificationReportURI)`.
 *
 * Idempotency: contract reverts with ProjectAlreadyApproved — caller checks
 * Verification doc's `approvalTxHash` before calling.
 *
 * @param verificationReportURI IPFS URI of the verification report (pass '' for placeholder)
 */
export async function approveProjectOnChain(
    projectId: string,
    validatorWallet: string,
    verificationReportURI: string
): Promise<TxReceipt> {
    const contract = await getContract();
    const uri = verificationReportURI || `mrv://verification/${projectId}`;

    logger.info({ projectId, validatorWallet, uri }, 'Recording validator approval on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.approveProject(
        projectId,
        validatorWallet,
        uri
    );

    logger.info({ txHash: tx.hash, projectId }, 'approveProject tx broadcast');

    const receipt = await waitForReceipt(tx, 'approveProject');

    logger.info(
        { txHash: receipt.hash, blockNumber: receipt.blockNumber, projectId },
        'Project approved on-chain'
    );

    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
    };
}

// ──────────────────── TRIGGER 4: Credit Minting ────────────────────

/**
 * Mint carbon credits on-chain for a specific project.
 * Calls `mintCredits(projectId, amountWei, metadataCID)`.
 *
 * Idempotency: contract uses (projectId + amount + CID) batch hash to prevent
 * duplicate minting.  Caller also checks `onChainMinted` flag in MongoDB.
 *
 * @param amount    Integer credits (human-readable), converted to 18-decimal wei internally
 * @param metadataCID IPFS CID of the credit metadata JSON
 */
export async function mintCreditsOnChain(
    projectId: string,
    amount: number,
    metadataCID: string
): Promise<MintResult> {
    const contract = await getContract();
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    logger.info({ projectId, amount, metadataCID }, 'Initiating on-chain mint');

    let tx: ethers.ContractTransactionResponse;
    try {
        tx = await contract.mintCredits(projectId, amountWei, metadataCID);
    } catch (error: unknown) {
        // Parse revert reasons before throw so callers get meaningful messages
        _rethrowContractError(error, projectId);
        throw error; // unreachable but satisfies TypeScript
    }

    logger.info({ txHash: tx.hash, projectId }, 'mintCredits tx broadcast');

    const receipt = await waitForReceipt(tx, 'mintCredits');

    logger.info(
        { txHash: receipt.hash, blockNumber: receipt.blockNumber, amount, projectId },
        'Mint transaction confirmed'
    );

    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        amountWei: amountWei.toString(),
    };
}

// ──────────────────── Mint Limit ────────────────────

/**
 * Set the on-chain mint limit for a project before minting.
 * Must be called with the total allowed credits, not incremental amount.
 */
export async function setMintLimitOnChain(
    projectId: string,
    allowedCredits: number
): Promise<string> {
    const contract = await getContract();
    const allowedWei = ethers.parseUnits(allowedCredits.toString(), 18);

    logger.info({ projectId, allowedCredits }, 'Setting on-chain mint limit');

    const tx: ethers.ContractTransactionResponse = await contract.setMintLimit(projectId, allowedWei);
    const receipt = await waitForReceipt(tx, 'setMintLimit');

    logger.info({ txHash: receipt.hash, projectId, allowedCredits }, 'Mint limit set on-chain');
    return receipt.hash;
}

// ──────────────────── Read-only Queries ────────────────────

export async function getMintedCredits(projectId: string): Promise<number> {
    const contract = await getContract();
    const mintedWei: bigint = await contract.getMintedCredits(projectId);
    return Number(ethers.formatUnits(mintedWei, 18));
}

export async function getTotalSupply(): Promise<number> {
    const contract = await getContract();
    const supplyWei: bigint = await contract.totalSupply();
    return Number(ethers.formatUnits(supplyWei, 18));
}

export async function isProjectRegisteredOnChain(projectId: string): Promise<boolean> {
    const contract = await getContract();
    return contract.isProjectRegistered(projectId) as Promise<boolean>;
}

export async function isProjectApprovedOnChain(projectId: string): Promise<boolean> {
    const contract = await getContract();
    return contract.isProjectApproved(projectId) as Promise<boolean>;
}

/**
 * Fetch the full on-chain lifecycle state for a project in one call.
 * Uses the getProjectLifecycleState() view added in the latest contract version.
 */
export async function getProjectLifecycleStateOnChain(
    projectId: string
): Promise<{ registered: boolean; approved: boolean; minted: number; limit: number }> {
    const contract = await getContract();
    const [registered, approved, mintedWei, limitWei] = await contract.getProjectLifecycleState(projectId);
    return {
        registered: Boolean(registered),
        approved: Boolean(approved),
        minted: Number(ethers.formatUnits(mintedWei, 18)),
        limit: Number(ethers.formatUnits(limitWei, 18)),
    };
}

/**
 * Query all on-chain events related to a specific projectId.
 *
 * Searches from block 0 to 'latest' across all MRV lifecycle event types.
 * Returns events sorted by blockNumber ascending so they form a chronological audit trail.
 *
 * Note: For indexed string params ethers v6 hashes them — we filter by the keccak256
 * topic of the projectId string (which is what the contract stores for indexed strings).
 */
export async function queryProjectEvents(projectId: string): Promise<OnChainEvent[]> {
    const contract = await getContract();
    const provider = getProvider();

    // Ethers handles hashing of string indexed topics automatically
    const eventNames = [
        'ProjectRegistered',
        'FieldOfficerAssigned',
        'ValidatorAssigned',
        'SubmissionAnchored',
        'ProjectApproved',
        'CreditsMinted',
        'MintLimitSet',
        'CreditsBurned',
        'ProjectStatusUpdated',
    ];

    const allEvents: OnChainEvent[] = [];

    for (const name of eventNames) {
        try {
            // Build a filter for events where the first indexed topic == projectId
            const filter = contract.filters[name](projectId);
            const logs = await contract.queryFilter(filter, 0, 'latest');

            for (const log of logs) {
                const eventLog = log as ethers.EventLog;
                // Parse args into a plain object (drop numeric keys)
                const parsedArgs: Record<string, unknown> = {};
                if (eventLog.args) {
                    eventLog.args.forEach((val: unknown, idx: number) => {
                        const fragment = eventLog.fragment;
                        const inputName = fragment?.inputs?.[idx]?.name ?? String(idx);
                        // Convert BigInt → string to keep JSON-safe
                        parsedArgs[inputName] = typeof val === 'bigint' ? val.toString() : val;
                    });
                }

                // Fetch block timestamp (best-effort)
                let timestamp: number | null = null;
                try {
                    const block = await provider.getBlock(eventLog.blockNumber);
                    timestamp = block ? Number(block.timestamp) : null;
                } catch { /* non-fatal */ }

                allEvents.push({
                    eventName: name,
                    txHash: eventLog.transactionHash,
                    blockNumber: eventLog.blockNumber,
                    timestamp,
                    args: parsedArgs,
                });
            }
        } catch (err) {
            logger.warn({ err, eventName: name, projectId }, 'queryProjectEvents: failed to query event type — skipping');
        }
    }

    // Sort chronologically
    allEvents.sort((a, b) => a.blockNumber - b.blockNumber);
    return allEvents;
}

// ──────────────────── Health / Config ────────────────────

/**
 * Returns true if the minimum env vars are present — used for graceful degradation
 * (off-chain only mode when blockchain is not configured).
 */
export async function isBlockchainConfigured(): Promise<boolean> {
    try {
        getEnvConfig(); // throws if missing
        return true;
    } catch {
        return false;
    }
}

export async function blockchainHealthCheck(): Promise<{
    connected: boolean;
    network: string;
    walletAddress: string;
    contractAddress: string;
    contractPaused: boolean;
}> {
    const wallet = await connectWallet();
    const contract = await getContract();
    const network = await getProvider().getNetwork();
    const paused: boolean = await contract.paused();
    const { address } = loadContractConfig();

    return {
        connected: true,
        network: network.name,
        walletAddress: await wallet.getAddress(),
        contractAddress: address,
        contractPaused: paused,
    };
}

// ──────────────────── Internal Helpers ────────────────────

/** Parse common Solidity revert reasons into human-readable Error messages */
function _rethrowContractError(error: unknown, projectId: string): never {
    if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes('MintExceedsLimit'))
            throw new Error(`Mint exceeds on-chain limit for project ${projectId}`);
        if (msg.includes('BatchAlreadyMinted'))
            throw new Error(`Batch already minted for project ${projectId}`);
        if (msg.includes('ProjectAlreadyRegistered'))
            throw new Error(`Project ${projectId} already registered on-chain`);
        if (msg.includes('SubmissionAlreadyAnchored'))
            throw new Error(`Submission already anchored on-chain for project ${projectId}`);
        if (msg.includes('ProjectAlreadyApproved'))
            throw new Error(`Project ${projectId} already approved on-chain`);
        if (msg.includes('ProjectNotRegistered'))
            throw new Error(`Project ${projectId} not registered on-chain — register first`);
        if (msg.includes('AccessControlUnauthorizedAccount'))
            throw new Error('Wallet does not have the required role on the contract');
        if (msg.includes('EnforcedPause'))
            throw new Error('Contract is paused — operations temporarily disabled');
        if (msg.includes('insufficient funds'))
            throw new Error('Insufficient ETH for gas fees');
    }
    throw error as Error;
}
