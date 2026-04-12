/**
 * useContractActions.js
 *
 * Custom React hooks wrapping wagmi's useWriteContract + useWaitForTransactionReceipt
 * for each on-chain action in the MRV lifecycle.
 *
 * Each hook returns: { write, txHash, isLoading, isConfirming, isConfirmed, error }
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, keccak256, toHex, stringToBytes } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from '../config/contractABI';

/**
 * TRIGGER 1: Register a project on-chain.
 * Anyone can call this (no role required after contract update).
 */
export function useRegisterProject() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const writeAsync = async (projectId, ownerWallet, metadataURI) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'registerProject',
      args: [projectId, ownerWallet, metadataURI || `mrv://project/${projectId}`],
      chainId: CHAIN_ID,
    });
  };

  return { writeAsync, txHash, isLoading: isPending, isConfirming, isConfirmed, error, reset };
}

/**
 * TRIGGER 2: Anchor a field submission hash on-chain.
 * Requires FIELD_OFFICER_ROLE or ADMIN_ROLE.
 */
export function useAnchorSubmission() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const writeAsync = async (projectId, submissionId, dataHash) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'anchorSubmission',
      args: [projectId, submissionId, dataHash],
      chainId: CHAIN_ID,
    });
  };

  return { writeAsync, txHash, isLoading: isPending, isConfirming, isConfirmed, error, reset };
}

/**
 * TRIGGER 3: Approve a project on-chain (validator).
 * Requires VALIDATOR_ROLE or ADMIN_ROLE.
 */
export function useApproveProject() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const writeAsync = async (projectId, validatorWallet, verificationReportURI) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'approveProject',
      args: [projectId, validatorWallet, verificationReportURI || `mrv://verification/${projectId}`],
      chainId: CHAIN_ID,
    });
  };

  return { writeAsync, txHash, isLoading: isPending, isConfirming, isConfirmed, error, reset };
}

/**
 * Set mint limit on-chain (admin only).
 */
export function useSetMintLimit() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const writeAsync = async (projectId, allowedCredits) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'setMintLimit',
      args: [projectId, parseUnits(allowedCredits.toString(), 18)],
      chainId: CHAIN_ID,
    });
  };

  return { writeAsync, txHash, isLoading: isPending, isConfirming, isConfirmed, error, reset };
}

/**
 * TRIGGER 4: Mint carbon credits on-chain (admin only).
 */
export function useMintCredits() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const writeAsync = async (projectId, amount, metadataCID) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'mintCredits',
      args: [projectId, parseUnits(amount.toString(), 18), metadataCID],
      chainId: CHAIN_ID,
    });
  };

  return { writeAsync, txHash, isLoading: isPending, isConfirming, isConfirmed, error, reset };
}

/**
 * Grant a role to a wallet (admin only — for assigning field officers / validators).
 */
export function useGrantRole() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const writeAsync = async (roleHash, walletAddress) => {
    return await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'grantRole',
      args: [roleHash, walletAddress],
      chainId: CHAIN_ID,
    });
  };

  return { writeAsync, txHash, isLoading: isPending, isConfirming, isConfirmed, error, reset };
}

/**
 * Helper: compute keccak256 of a JSON payload (for submission anchoring).
 * Uses viem's keccak256.
 */
export function computeDataHash(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return keccak256(toHex(bytes));
}

// Role constants (keccak256 hashes matching the contract)
export const ROLE_HASHES = {
  ADMIN: keccak256(stringToBytes('ADMIN_ROLE')),
  FIELD_OFFICER: keccak256(stringToBytes('FIELD_OFFICER_ROLE')),
  VALIDATOR: keccak256(stringToBytes('VALIDATOR_ROLE')),
};
