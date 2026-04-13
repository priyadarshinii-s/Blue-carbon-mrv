'use strict'

import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { loadContractConfig } from '../config/contract-config';

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
    timestamp: number | null;
    args: Record<string, unknown>;
}

interface BlockchainConfig {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
}

function getEnvConfig(): BlockchainConfig {
    const rpcUrl         = process.env.RPC_URL;
    const privateKey     = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl)          throw new Error('RPC_URL environment variable is not set');
    if (!privateKey)      throw new Error('PRIVATE_KEY environment variable is not set');
    if (!contractAddress) throw new Error('CONTRACT_ADDRESS environment variable is not set');

    return { rpcUrl, privateKey, contractAddress };
}

// ──────────────────── Singleton Instances ────────────────────

let _provider: ethers.JsonRpcProvider | null = null;
let _signer: ethers.Signer | null = null;
let _contract: ethers.Contract | null = null;

/**
 * Returns a JsonRpcProvider configured to avoid stateful server-side filters.
 *
 * Root cause of "resource not found" / eth_getFilterChanges errors:
 *   ethers JsonRpcProvider normally creates a server-side filter via eth_newFilter
 *   and polls it with eth_getFilterChanges.  Managed RPC nodes (Alchemy, QuickNode,
 *   Render, etc.) expire these filters after ~2–5 min — the filter ID is then gone
 *   and the node returns -32001.
 *
 * Fix: set polling interval to 0 to disable the internal poller entirely.
 *   We never use on-chain event subscriptions in this service — all event queries
 *   go through queryFilter() (eth_getLogs) which is stateless.  So disabling the
 *   poller has zero functional impact and eliminates the error completely.
 */
function getProvider(): ethers.JsonRpcProvider {
    if (!_provider) {
        const { rpcUrl } = getEnvConfig();
        _provider = new ethers.JsonRpcProvider(rpcUrl);

        // Disable the automatic block poller — prevents eth_newFilter /
        // eth_getFilterChanges calls that expire on managed RPC nodes.
        // All our reads use eth_getLogs (queryFilter) which is stateless.
        _provider.polling = false;
    }
    return _provider;
}

export async function connectWallet(): Promise<ethers.Signer> {
    if (!_signer) {
        const { privateKey } = getEnvConfig();
        const wallet = new ethers.Wallet(privateKey, getProvider());
        _signer = new ethers.NonceManager(wallet);
        logger.info({ address: wallet.address }, 'Blockchain wallet connected (with NonceManager)');
    }
    return _signer;
}

export async function getContract(): Promise<ethers.Contract> {
    if (!_contract) {
        const signer = await connectWallet();
        const { address, abi } = loadContractConfig();
        _contract = new ethers.Contract(address, abi as ethers.InterfaceAbi, signer);
        logger.info({ contractAddress: address }, 'Contract instance created');
    }
    return _contract;
}

// ──────────────────── Gas Helper ────────────────────

/**
 * Fetches live EIP-1559 fee data from the RPC and applies a 20% buffer
 * to absorb fee spikes between estimation and inclusion.
 *
 * Always call this immediately before sending a transaction — never cache
 * the result across multiple calls, as fees change every block.
 */
async function fetchGasFees(): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
    const feeData = await getProvider().getFeeData();
    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        throw new Error('Could not fetch gas fee data from RPC — check RPC_URL');
    }

    // 10% buffer — enough to survive 1-2 blocks of fee movement without
    // overshooting MetaMask's default 1 ETH total-fee cap on high-gas networks.
    const bump = (val: bigint) => (val * 110n) / 100n;

    // Hard ceiling: 500 Gwei per unit — protects against runaway fee spikes.
    // Polygon mainnet peaks around 300-400 Gwei during congestion.
    const MAX_FEE = ethers.parseUnits('500', 'gwei');

    const maxFeePerGas         = bump(feeData.maxFeePerGas) < MAX_FEE ? bump(feeData.maxFeePerGas) : MAX_FEE;
    const maxPriorityFeePerGas = bump(feeData.maxPriorityFeePerGas) < maxFeePerGas ? bump(feeData.maxPriorityFeePerGas) : maxFeePerGas;

    logger.debug(
        {
            maxFeePerGas:         ethers.formatUnits(maxFeePerGas, 'gwei') + ' gwei',
            maxPriorityFeePerGas: ethers.formatUnits(maxPriorityFeePerGas, 'gwei') + ' gwei',
        },
        'fetchGasFees resolved'
    );

    return { maxFeePerGas, maxPriorityFeePerGas };
}

// ──────────────────── Confirmation Helper ────────────────────

const CONFIRMATION_BLOCKS = parseInt(process.env.CONFIRMATION_BLOCKS || '1', 10);

/**
 * Waits for a transaction receipt by polling eth_getTransactionReceipt directly
 * rather than relying on the provider's internal filter/subscription mechanism.
 * This is safe on all managed RPC nodes regardless of filter TTL.
 */
async function waitForReceipt(
    tx: ethers.ContractTransactionResponse,
    context: string
): Promise<ethers.TransactionReceipt> {
    const receipt = await tx.wait(CONFIRMATION_BLOCKS);
    if (!receipt) {
        throw new Error(`${context}: transaction receipt is null — tx may have been dropped (hash: ${tx.hash})`);
    }
    return receipt;
}

// ──────────────────── TRIGGER 1: Project Registration ────────────────────

export async function registerProjectOnChain(
    projectId: string,
    ownerWallet: string,
    metadataURI: string
): Promise<TxReceipt> {
    const contract = await getContract();
    const fees = await fetchGasFees();
    const uri = metadataURI || `mrv://project/${projectId}`;

    logger.info({ projectId, ownerWallet, metadataURI: uri }, 'Registering project on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.registerProject(
        projectId, ownerWallet, uri, fees
    );
    logger.info({ txHash: tx.hash, projectId }, 'registerProject tx broadcast');

    const receipt = await waitForReceipt(tx, 'registerProject');
    logger.info({ txHash: receipt.hash, blockNumber: receipt.blockNumber, projectId }, 'Project registered on-chain');

    return { txHash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
}

// ──────────────────── TRIGGER 1b: Field Officer Assignment ────────────────────

export async function assignFieldOfficerOnChain(
    projectId: string,
    fieldOfficerWallet: string
): Promise<TxReceipt> {
    const contract = await getContract();
    const fees = await fetchGasFees();

    logger.info({ projectId, fieldOfficerWallet }, 'Recording field officer assignment on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.assignFieldOfficer(
        projectId, fieldOfficerWallet, fees
    );
    logger.info({ txHash: tx.hash, projectId }, 'assignFieldOfficer tx broadcast');

    const receipt = await waitForReceipt(tx, 'assignFieldOfficer');
    logger.info({ txHash: receipt.hash, blockNumber: receipt.blockNumber, projectId }, 'Field officer assignment recorded on-chain');

    return { txHash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
}

// ──────────────────── TRIGGER 1c: Validator Assignment ────────────────────

export async function assignValidatorOnChain(
    projectId: string,
    validatorWallet: string
): Promise<TxReceipt> {
    const contract = await getContract();
    const fees = await fetchGasFees();

    logger.info({ projectId, validatorWallet }, 'Recording validator assignment on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.assignValidator(
        projectId, validatorWallet, fees
    );
    logger.info({ txHash: tx.hash, projectId }, 'assignValidator tx broadcast');

    const receipt = await waitForReceipt(tx, 'assignValidator');
    logger.info({ txHash: receipt.hash, blockNumber: receipt.blockNumber, projectId }, 'Validator assignment recorded on-chain');

    return { txHash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
}

// ──────────────────── TRIGGER 2: Submission Anchoring ────────────────────

export async function anchorSubmissionOnChain(
    projectId: string,
    submissionId: string,
    dataHash: string
): Promise<TxReceipt> {
    const contract = await getContract();
    const fees = await fetchGasFees();

    logger.info({ projectId, submissionId, dataHash }, 'Anchoring submission on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.anchorSubmission(
        projectId, submissionId, dataHash, fees
    );
    logger.info({ txHash: tx.hash, submissionId }, 'anchorSubmission tx broadcast');

    const receipt = await waitForReceipt(tx, 'anchorSubmission');
    logger.info({ txHash: receipt.hash, blockNumber: receipt.blockNumber, submissionId }, 'Submission anchored on-chain');

    return { txHash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
}

// ──────────────────── TRIGGER 3: Validator Approval ────────────────────

export async function approveProjectOnChain(
    projectId: string,
    validatorWallet: string,
    verificationReportURI: string
): Promise<TxReceipt> {
    const contract = await getContract();
    const fees = await fetchGasFees();
    const uri = verificationReportURI || `mrv://verification/${projectId}`;

    logger.info({ projectId, validatorWallet, uri }, 'Recording validator approval on-chain');

    const tx: ethers.ContractTransactionResponse = await contract.approveProject(
        projectId, validatorWallet, uri, fees
    );
    logger.info({ txHash: tx.hash, projectId }, 'approveProject tx broadcast');

    const receipt = await waitForReceipt(tx, 'approveProject');
    logger.info({ txHash: receipt.hash, blockNumber: receipt.blockNumber, projectId }, 'Project approved on-chain');

    return { txHash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
}

// ──────────────────── TRIGGER 4: Credit Minting ────────────────────

export async function mintCreditsOnChain(
    projectId: string,
    amount: number,
    metadataCID: string
): Promise<MintResult> {
    const contract = await getContract();
    const fees = await fetchGasFees();
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    logger.info({ projectId, amount, metadataCID }, 'Initiating on-chain mint');

    let tx: ethers.ContractTransactionResponse;
    try {
        tx = await contract.mintCredits(projectId, amountWei, metadataCID, fees);
    } catch (error: unknown) {
        _rethrowContractError(error, projectId);
        throw error;
    }

    logger.info({ txHash: tx.hash, projectId }, 'mintCredits tx broadcast');

    const receipt = await waitForReceipt(tx, 'mintCredits');
    logger.info({ txHash: receipt.hash, blockNumber: receipt.blockNumber, amount, projectId }, 'Mint transaction confirmed');

    return {
        txHash:      receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed:     receipt.gasUsed.toString(),
        amountWei:   amountWei.toString(),
    };
}

// ──────────────────── Mint Limit ────────────────────

export async function setMintLimitOnChain(
    projectId: string,
    allowedCredits: number
): Promise<string> {
    const contract = await getContract();
    const fees = await fetchGasFees();
    const allowedWei = ethers.parseUnits(allowedCredits.toString(), 18);

    logger.info({ projectId, allowedCredits }, 'Setting on-chain mint limit');

    const tx: ethers.ContractTransactionResponse = await contract.setMintLimit(projectId, allowedWei, fees);
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

export async function getProjectLifecycleStateOnChain(
    projectId: string
): Promise<{ registered: boolean; approved: boolean; minted: number; limit: number }> {
    const contract = await getContract();
    const [registered, approved, mintedWei, limitWei] = await contract.getProjectLifecycleState(projectId);
    return {
        registered: Boolean(registered),
        approved:   Boolean(approved),
        minted:     Number(ethers.formatUnits(mintedWei, 18)),
        limit:      Number(ethers.formatUnits(limitWei,  18)),
    };
}

/**
 * Query all on-chain events for a project using eth_getLogs (stateless).
 *
 * queryFilter() uses eth_getLogs under the hood — it does NOT create a
 * server-side filter, so it is safe on all managed RPC providers regardless
 * of filter TTL settings.
 */
export async function queryProjectEvents(projectId: string): Promise<OnChainEvent[]> {
    const contract = await getContract();
    const provider = getProvider();

    const eventNames = [
        'ProjectRegistered', 'FieldOfficerAssigned', 'ValidatorAssigned',
        'SubmissionAnchored', 'ProjectApproved', 'CreditsMinted',
        'MintLimitSet', 'CreditsBurned', 'ProjectStatusUpdated',
    ];

    const allEvents: OnChainEvent[] = [];

    for (const name of eventNames) {
        try {
            const filter = contract.filters[name](projectId);
            const logs = await contract.queryFilter(filter, 0, 'latest');

            for (const log of logs) {
                const eventLog = log as ethers.EventLog;
                const parsedArgs: Record<string, unknown> = {};
                if (eventLog.args) {
                    eventLog.args.forEach((val: unknown, idx: number) => {
                        const inputName = eventLog.fragment?.inputs?.[idx]?.name ?? String(idx);
                        parsedArgs[inputName] = typeof val === 'bigint' ? val.toString() : val;
                    });
                }

                let timestamp: number | null = null;
                try {
                    const block = await provider.getBlock(eventLog.blockNumber);
                    timestamp = block ? Number(block.timestamp) : null;
                } catch { /* non-fatal */ }

                allEvents.push({
                    eventName:   name,
                    txHash:      eventLog.transactionHash,
                    blockNumber: eventLog.blockNumber,
                    timestamp,
                    args:        parsedArgs,
                });
            }
        } catch (err) {
            logger.warn({ err, eventName: name, projectId }, 'queryProjectEvents: failed to query event type — skipping');
        }
    }

    allEvents.sort((a, b) => a.blockNumber - b.blockNumber);
    return allEvents;
}

// ──────────────────── Health / Config ────────────────────

export async function isBlockchainConfigured(): Promise<boolean> {
    try {
        getEnvConfig();
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
    const wallet   = await connectWallet();
    const contract = await getContract();
    const network  = await getProvider().getNetwork();
    const paused: boolean = await contract.paused();
    const { address } = loadContractConfig();

    return {
        connected:       true,
        network:         network.name,
        walletAddress:   await wallet.getAddress(),
        contractAddress: address,
        contractPaused:  paused,
    };
}

// ──────────────────── Internal Helpers ────────────────────

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
        if (msg.includes('gas tip cap') || msg.includes('maxPriorityFeePerGas'))
            throw new Error('Gas tip below network minimum — fee estimation failed, retry the request');
    }
    throw error as Error;
}