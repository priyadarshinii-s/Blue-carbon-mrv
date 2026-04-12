/**
 * contractABI.js
 *
 * Contract address and ABI for frontend interaction via wagmi/viem.
 * Only includes the functions the frontend needs to call directly.
 */

export const CONTRACT_ADDRESS = '0x53F9aD10d5aC5EC09279623EB2972Bed690875E5';

export const CHAIN_ID = 80002; // Polygon Amoy

export const CONTRACT_ABI = [
  // ── Write Functions ──────────────────────────────────────
  {
    name: 'registerProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'string' },
      { name: 'ownerWallet', type: 'address' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'anchorSubmission',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'string' },
      { name: 'submissionId', type: 'string' },
      { name: 'dataHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'approveProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'string' },
      { name: 'validatorWallet', type: 'address' },
      { name: 'verificationReportURI', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'mintCredits',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'metadataCID', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'setMintLimit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'projectId', type: 'string' },
      { name: 'allowedCredits', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'grantRole',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [],
  },

  // ── Read Functions ──────────────────────────────────────
  {
    name: 'isProjectRegistered',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'projectId', type: 'string' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'isProjectApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'projectId', type: 'string' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'ADMIN_ROLE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'FIELD_OFFICER_ROLE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'VALIDATOR_ROLE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'hasRole',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },

  // ── Events (for display) ──────────────────────────────────
  {
    name: 'ProjectRegistered',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'projectId', type: 'string', indexed: true },
      { name: 'ownerWallet', type: 'address', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'SubmissionAnchored',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'projectId', type: 'string', indexed: true },
      { name: 'submissionId', type: 'string', indexed: false },
      { name: 'dataHash', type: 'bytes32', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'ProjectApproved',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'projectId', type: 'string', indexed: true },
      { name: 'validatorWallet', type: 'address', indexed: true },
      { name: 'verificationReportURI', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'CreditsMinted',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'projectId', type: 'string', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'metadataCID', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
];

export const EXPLORER_BASE_URL = 'https://amoy.polygonscan.com';

export function getExplorerTxUrl(txHash) {
  return `${EXPLORER_BASE_URL}/tx/${txHash}`;
}
