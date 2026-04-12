/**
 * contract-config.ts
 *
 * Loads the contract ABI + address from the JSON file written by the Hardhat
 * deploy script.  This is the single source of truth — swap the JSON to point
 * at a different network without touching any service code.
 *
 * Usage:
 *   import { loadContractConfig } from '../config/contract-config';
 *   const { address, abi } = loadContractConfig();
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export interface ContractConfig {
    address: string;
    abi: unknown[];
    network: string;
    chainId: number;
    deployedAt: string;
}

// Cached result — read fs only once per process lifetime
let _cached: ContractConfig | null = null;

/**
 * Returns the contract config, preferring the JSON file written by deploy.ts.
 * Falls back to environment variables (CONTRACT_ADDRESS + inline ABI) if the
 * file does not exist — preserving backward-compat with the existing setup.
 */
export function loadContractConfig(): ContractConfig {
    if (_cached) return _cached;

    const jsonPath = path.join(__dirname, 'contract-config.json');

    if (fs.existsSync(jsonPath)) {
        try {
            const raw = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(raw) as ContractConfig;

            if (!parsed.address || !Array.isArray(parsed.abi)) {
                throw new Error('contract-config.json is malformed — missing address or abi');
            }

            logger.info(
                { address: parsed.address, network: parsed.network, chainId: parsed.chainId },
                'Loaded contract config from contract-config.json'
            );

            _cached = parsed;
            return _cached;
        } catch (err) {
            logger.warn(
                { err, jsonPath },
                'Failed to parse contract-config.json — falling back to env vars'
            );
        }
    }

    // ── Fallback: env vars + inline ABI subset ────────────────────────────
    const address = process.env.CONTRACT_ADDRESS;
    if (!address) {
        throw new Error(
            'Contract not configured: neither contract-config.json nor CONTRACT_ADDRESS env var found.\n' +
            'Run the Hardhat deploy script first: cd contracts && npx hardhat run scripts/deploy.ts --network <network>'
        );
    }

    logger.warn(
        { address },
        'contract-config.json not found — using CONTRACT_ADDRESS env var with inline ABI fallback'
    );

    // Inline ABI fallback (human-readable format, matches blockchain.service.ts existing ABI)
    const fallbackAbi = [
        'function registerProject(string calldata projectId, address ownerWallet, string calldata metadataURI) external',
        'function anchorSubmission(string calldata projectId, string calldata submissionId, bytes32 dataHash) external',
        'function approveProject(string calldata projectId, address validatorWallet, string calldata verificationReportURI) external',
        'function mintCredits(string calldata projectId, uint256 amount, string calldata metadataCID) external',
        'function setMintLimit(string calldata projectId, uint256 allowedCredits) external',
        'function getMintedCredits(string calldata projectId) external view returns (uint256)',
        'function getAllowedCredits(string calldata projectId) external view returns (uint256)',
        'function validateMintLimit(string calldata projectId, uint256 amount) external view returns (bool)',
        'function isProjectRegistered(string calldata projectId) external view returns (bool)',
        'function isProjectApproved(string calldata projectId) external view returns (bool)',
        'function getAnchoredSubmissionHash(string calldata projectId, string calldata submissionId) external view returns (bytes32)',
        'function totalSupply() external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
        'function paused() external view returns (bool)',
        'event ProjectRegistered(string indexed projectId, address indexed ownerWallet, string metadataURI, uint256 timestamp)',
        'event SubmissionAnchored(string indexed projectId, string submissionId, bytes32 dataHash, uint256 timestamp)',
        'event ProjectApproved(string indexed projectId, address indexed validatorWallet, string verificationReportURI, uint256 timestamp)',
        'event CreditsMinted(string indexed projectId, address indexed recipient, uint256 amount, string metadataCID, uint256 timestamp)',
        'event MintLimitSet(string indexed projectId, uint256 allowedCredits)',
    ];

    _cached = {
        address,
        abi: fallbackAbi,
        network: 'unknown',
        chainId: 0,
        deployedAt: 'unknown',
    };

    return _cached;
}

/** Invalidate the cache (useful in tests) */
export function resetContractConfigCache(): void {
    _cached = null;
}
