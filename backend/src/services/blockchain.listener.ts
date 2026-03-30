import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import TokenData from '../models/TokenData';
import Project from '../models/Project';

// ──────────────────── ABI for event parsing ────────────────────

const EVENT_ABI = [
    'event CreditsMinted(string indexed projectId, address indexed recipient, uint256 amount, string metadataCID, uint256 timestamp)',
];

let _listener: ethers.Contract | null = null;

/**
 * Start listening for CreditsMinted events and sync them back to MongoDB.
 * This acts as a safety net for DB consistency — even if the API response
 * is lost, the event listener will update the database.
 */
export async function startBlockchainListener(): Promise<void> {
    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !contractAddress) {
        logger.warn('Blockchain listener not started — RPC_URL or CONTRACT_ADDRESS not set');
        return;
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(contractAddress, EVENT_ABI, provider);

        // Listen for CreditsMinted events
        contract.on(
            'CreditsMinted',
            async (
                projectIdHash: string,
                recipientHash: string,
                amount: bigint,
                metadataCID: string,
                timestamp: bigint,
                event: ethers.EventLog
            ) => {
                try {
                    const amountHuman = Number(ethers.formatUnits(amount, 18));
                    const txHash = event.transactionHash;
                    const blockNumber = event.blockNumber;

                    logger.info(
                        {
                            projectIdHash,
                            amount: amountHuman,
                            metadataCID,
                            txHash,
                            blockNumber,
                        },
                        'CreditsMinted event received'
                    );

                    // Update any TokenData that matches this txHash to confirmed
                    const updated = await TokenData.findOneAndUpdate(
                        { mintTxHash: txHash },
                        {
                            $set: {
                                onChainStatus: 'confirmed',
                                blockNumber,
                            },
                        },
                        { new: true }
                    );

                    if (updated) {
                        logger.info(
                            { txHash, projectId: updated.projectId },
                            'TokenData confirmed via event listener'
                        );
                    } else {
                        // The event might arrive before the API handler saves the TokenData,
                        // or it might be from a direct contract call. Log but don't error.
                        logger.debug(
                            { txHash },
                            'CreditsMinted event received but no matching TokenData found — may be direct contract call'
                        );
                    }
                } catch (err: unknown) {
                    logger.error(
                        { err, projectIdHash },
                        'Error processing CreditsMinted event'
                    );
                }
            }
        );

        _listener = contract;

        const network = await provider.getNetwork();
        logger.info(
            {
                contractAddress,
                network: network.name,
                chainId: Number(network.chainId),
            },
            '🔗 Blockchain event listener started'
        );
    } catch (err: unknown) {
        logger.error({ err }, 'Failed to start blockchain event listener');
    }
}

/**
 * Stop the blockchain event listener
 */
export async function stopBlockchainListener(): Promise<void> {
    if (_listener) {
        await _listener.removeAllListeners();
        _listener = null;
        logger.info('Blockchain event listener stopped');
    }
}
