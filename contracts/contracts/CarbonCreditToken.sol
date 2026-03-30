// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CarbonCreditToken
 * @notice ERC-20 token representing verified carbon credits (1 token = 1 tCO₂e)
 * @dev Uses AccessControl for multi-role support, ReentrancyGuard for safety,
 *      and tracks per-project minting limits and totals on-chain.
 */
contract CarbonCreditToken is ERC20, AccessControl, ReentrancyGuard, Pausable {
    // ──────────────────── Roles ────────────────────
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant FIELD_OFFICER_ROLE = keccak256("FIELD_OFFICER_ROLE");

    // ──────────────────── State ────────────────────
    /// @notice Total credits minted per project
    mapping(string => uint256) private _mintedCredits;

    /// @notice Maximum credits allowed per project (set by admin/validator flow)
    mapping(string => uint256) private _allowedCredits;

    /// @notice Metadata CIDs stored per project per mint batch
    mapping(string => string[]) private _projectMetadataCIDs;

    /// @notice Nonce per project to prevent double-minting of the same batch
    mapping(bytes32 => bool) private _mintedBatches;

    // ──────────────────── Events ────────────────────
    event CreditsMinted(
        string indexed projectId,
        address indexed recipient,
        uint256 amount,
        string metadataCID,
        uint256 timestamp
    );

    event MintLimitSet(
        string indexed projectId,
        uint256 allowedCredits
    );

    event CreditsBurned(
        string indexed projectId,
        address indexed holder,
        uint256 amount
    );

    // ──────────────────── Errors ────────────────────
    error MintExceedsLimit(string projectId, uint256 requested, uint256 available);
    error ZeroAmount();
    error EmptyProjectId();
    error EmptyCID();
    error BatchAlreadyMinted(bytes32 batchHash);
    error MintLimitBelowMinted(string projectId, uint256 newLimit, uint256 alreadyMinted);

    // ──────────────────── Constructor ────────────────────
    constructor() ERC20("Blue Carbon Credit", "BCC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ──────────────────── Admin Functions ────────────────────

    /**
     * @notice Mint carbon credits for a specific project
     * @param projectId The unique project identifier from the MRV system
     * @param amount Number of carbon credits to mint (in wei units, 18 decimals)
     * @param metadataCID IPFS CID containing the credit metadata
     */
    function mintCredits(
        string calldata projectId,
        uint256 amount,
        string calldata metadataCID
    ) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        if (bytes(metadataCID).length == 0) revert EmptyCID();

        // Double-mint prevention: hash (projectId + amount + metadataCID) as batch key
        bytes32 batchHash = keccak256(abi.encodePacked(projectId, amount, metadataCID));
        if (_mintedBatches[batchHash]) revert BatchAlreadyMinted(batchHash);

        // Enforce mint limit
        uint256 allowed = _allowedCredits[projectId];
        uint256 alreadyMinted = _mintedCredits[projectId];
        if (allowed > 0 && alreadyMinted + amount > allowed) {
            revert MintExceedsLimit(projectId, amount, allowed - alreadyMinted);
        }

        // Update state before external call (CEI pattern)
        _mintedCredits[projectId] += amount;
        _mintedBatches[batchHash] = true;
        _projectMetadataCIDs[projectId].push(metadataCID);

        // Mint ERC-20 tokens to the admin (caller)
        _mint(msg.sender, amount);

        emit CreditsMinted(projectId, msg.sender, amount, metadataCID, block.timestamp);
    }

    /**
     * @notice Set the maximum allowed credits for a project
     * @param projectId The project identifier
     * @param allowedCredits Maximum credits that can be minted for this project
     */
    function setMintLimit(
        string calldata projectId,
        uint256 allowedCredits
    ) external onlyRole(ADMIN_ROLE) {
        if (bytes(projectId).length == 0) revert EmptyProjectId();

        uint256 alreadyMinted = _mintedCredits[projectId];
        if (allowedCredits < alreadyMinted) {
            revert MintLimitBelowMinted(projectId, allowedCredits, alreadyMinted);
        }

        _allowedCredits[projectId] = allowedCredits;

        emit MintLimitSet(projectId, allowedCredits);
    }

    /**
     * @notice Retire (burn) carbon credits — permanently removes them from circulation
     * @param projectId The project identifier for audit purposes
     * @param amount Number of credits to retire
     */
    function retireCredits(
        string calldata projectId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (bytes(projectId).length == 0) revert EmptyProjectId();

        _burn(msg.sender, amount);

        emit CreditsBurned(projectId, msg.sender, amount);
    }

    // ──────────────────── View Functions ────────────────────

    /**
     * @notice Get total minted credits for a project
     */
    function getMintedCredits(string calldata projectId) external view returns (uint256) {
        return _mintedCredits[projectId];
    }

    /**
     * @notice Get the allowed credit limit for a project
     */
    function getAllowedCredits(string calldata projectId) external view returns (uint256) {
        return _allowedCredits[projectId];
    }

    /**
     * @notice Check if minting `amount` credits is within the limit for a project
     */
    function validateMintLimit(
        string calldata projectId,
        uint256 amount
    ) external view returns (bool) {
        uint256 allowed = _allowedCredits[projectId];
        if (allowed == 0) return true; // No limit set = unlimited
        return _mintedCredits[projectId] + amount <= allowed;
    }

    /**
     * @notice Get all metadata CIDs for a project
     */
    function getProjectMetadata(string calldata projectId) external view returns (string[] memory) {
        return _projectMetadataCIDs[projectId];
    }

    /**
     * @notice Check if a batch has already been minted
     */
    function isBatchMinted(bytes32 batchHash) external view returns (bool) {
        return _mintedBatches[batchHash];
    }

    // ──────────────────── Admin Controls ────────────────────

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ──────────────────── ERC-20 decimals override ────────────────────

    /**
     * @notice Carbon credits use 18 decimals (standard ERC-20)
     * @dev 1 token = 1 tCO₂e. Sub-unit precision available for fractional credits.
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    // ──────────────────── Interface Support ────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
