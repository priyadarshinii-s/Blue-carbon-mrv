import { ethers } from 'ethers';
import { logger } from '../utils/logger';

// ──────────────────── Types ────────────────────

interface MintResult {
    txHash: string;
    blockNumber: number;
    gasUsed: string;
}

interface BlockchainConfig {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
}

// ──────────────────── Contract ABI (subset of CarbonCreditToken) ────────────────────

const CARBON_CREDIT_ABI = [
    'function mintCredits(string calldata projectId, uint256 amount, string calldata metadataCID) external',
    'function setMintLimit(string calldata projectId, uint256 allowedCredits) external',
    'function getMintedCredits(string calldata projectId) external view returns (uint256)',
    'function getAllowedCredits(string calldata projectId) external view returns (uint256)',
    'function validateMintLimit(string calldata projectId, uint256 amount) external view returns (bool)',
    'function totalSupply() external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function paused() external view returns (bool)',
    'event CreditsMinted(string indexed projectId, address indexed recipient, uint256 amount, string metadataCID, uint256 timestamp)',
    'event MintLimitSet(string indexed projectId, uint256 allowedCredits)',
] as const;

// ──────────────────── Configuration ────────────────────

function getConfig(): BlockchainConfig {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl) {
        throw new Error('RPC_URL environment variable is not set');
    }
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is not set');
    }
    if (!contractAddress) {
        throw new Error('CONTRACT_ADDRESS environment variable is not set');
    }

    return { rpcUrl, privateKey, contractAddress };
}

// ──────────────────── Singleton Instances ────────────────────

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;
let _contract: ethers.Contract | null = null;

function getProvider(): ethers.JsonRpcProvider {
    if (!_provider) {
        const { rpcUrl } = getConfig();
        _provider = new ethers.JsonRpcProvider(rpcUrl);
    }
    return _provider;
}

// ──────────────────── Exported Functions ────────────────────

/**
 * Connect and return the admin wallet used for signing transactions
 */
export async function connectWallet(): Promise<ethers.Wallet> {
    if (!_wallet) {
        const { privateKey } = getConfig();
        const provider = getProvider();
        _wallet = new ethers.Wallet(privateKey, provider);
        logger.info({ address: _wallet.address }, 'Blockchain wallet connected');
    }
    return _wallet;
}

/**
 * Get a connected contract instance
 */
export async function getContract(): Promise<ethers.Contract> {
    if (!_contract) {
        const wallet = await connectWallet();
        const { contractAddress } = getConfig();
        _contract = new ethers.Contract(contractAddress, CARBON_CREDIT_ABI, wallet);
        logger.info({ contractAddress }, 'Contract instance created');
    }
    return _contract;
}

/**
 * Mint carbon credits on-chain for a specific project
 *
 * @param projectId - The MRV project identifier
 * @param amount - Number of credits to mint (integer, will be converted to 18-decimal wei)
 * @param metadataCID - IPFS CID containing the credit metadata
 * @returns Transaction hash and block number
 */
export async function mintCreditsOnChain(
    projectId: string,
    amount: number,
    metadataCID: string
): Promise<MintResult> {
    const contract = await getContract();

    // Convert integer credits to ERC-20 wei (18 decimals)
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    logger.info({ projectId, amount, metadataCID }, 'Initiating on-chain mint');

    try {
        const tx: ethers.ContractTransactionResponse = await contract.mintCredits(
            projectId,
            amountWei,
            metadataCID
        );

        logger.info({ txHash: tx.hash, projectId }, 'Mint transaction broadcast');

        // Wait for confirmation (1 block)
        const receipt = await tx.wait(1);
        if (!receipt) {
            throw new Error('Transaction receipt is null — tx may have been dropped');
        }

        logger.info(
            {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                projectId,
                amount,
            },
            'Mint transaction confirmed'
        );

        return {
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
        };
    } catch (error: unknown) {
        // Parse revert reasons from the contract
        if (error instanceof Error) {
            const errorMessage = error.message;

            if (errorMessage.includes('MintExceedsLimit')) {
                throw new Error(`Mint exceeds on-chain limit for project ${projectId}`);
            }
            if (errorMessage.includes('BatchAlreadyMinted')) {
                throw new Error(`Batch already minted for project ${projectId}`);
            }
            if (errorMessage.includes('AccessControlUnauthorizedAccount')) {
                throw new Error('Wallet does not have ADMIN_ROLE on the contract');
            }
            if (errorMessage.includes('EnforcedPause')) {
                throw new Error('Contract is paused — minting is temporarily disabled');
            }
            if (errorMessage.includes('insufficient funds')) {
                throw new Error('Insufficient ETH for gas fees');
            }
        }

        logger.error({ err: error, projectId, amount }, 'On-chain mint failed');
        throw error;
    }
}

/**
 * Set the mint limit for a project on-chain
 */
export async function setMintLimitOnChain(
    projectId: string,
    allowedCredits: number
): Promise<string> {
    const contract = await getContract();
    const allowedWei = ethers.parseUnits(allowedCredits.toString(), 18);

    logger.info({ projectId, allowedCredits }, 'Setting on-chain mint limit');

    const tx: ethers.ContractTransactionResponse = await contract.setMintLimit(
        projectId,
        allowedWei
    );
    const receipt = await tx.wait(1);

    if (!receipt) {
        throw new Error('setMintLimit transaction receipt is null');
    }

    logger.info({ txHash: receipt.hash, projectId, allowedCredits }, 'Mint limit set on-chain');
    return receipt.hash;
}

/**
 * Get the total minted credits for a project from on-chain state
 */
export async function getMintedCredits(projectId: string): Promise<number> {
    const contract = await getContract();
    const mintedWei: bigint = await contract.getMintedCredits(projectId);
    return Number(ethers.formatUnits(mintedWei, 18));
}

/**
 * Get total token supply across all projects
 */
export async function getTotalSupply(): Promise<number> {
    const contract = await getContract();
    const supplyWei: bigint = await contract.totalSupply();
    return Number(ethers.formatUnits(supplyWei, 18));
}

/**
 * Check if the blockchain service is properly configured and connected
 */
export async function isBlockchainConfigured(): Promise<boolean> {
    try {
        const { rpcUrl, privateKey, contractAddress } = getConfig();
        return !!(rpcUrl && privateKey && contractAddress);
    } catch {
        return false;
    }
}

/**
 * Health check — verify RPC connectivity and contract accessibility
 */
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

    return {
        connected: true,
        network: network.name,
        walletAddress: wallet.address,
        contractAddress: getConfig().contractAddress,
        contractPaused: paused,
    };
}
