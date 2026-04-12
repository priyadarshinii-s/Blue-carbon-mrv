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
 *      MRV lifecycle: registerProject → anchorSubmission → approveProject → mintCredits
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

    // ── MRV Lifecycle State ──

    /// @notice Track whether a project has been registered on-chain
    mapping(string => bool) private _registeredProjects;

    /// @notice Track anchored submission hashes per project (submissionId => dataHash)
    mapping(string => mapping(string => bytes32)) private _anchoredSubmissions;

    /// @notice Track whether a project has been approved by a validator
    mapping(string => bool) private _approvedProjects;

    // ──────────────────── Events ────────────────────

    /// @notice Emitted when a project is registered on-chain (Trigger 1)
    event ProjectRegistered(
        string indexed projectId,
        address indexed ownerWallet,
        string metadataURI,
        uint256 timestamp
    );

    /// @notice Emitted when a field submission is anchored on-chain (Trigger 2)
    event SubmissionAnchored(
        string indexed projectId,
        string submissionId,
        bytes32 dataHash,
        uint256 timestamp
    );

    /// @notice Emitted when a validator approves a project (Trigger 3)
    event ProjectApproved(
        string indexed projectId,
        address indexed validatorWallet,
        string verificationReportURI,
        uint256 timestamp
    );

    /// @notice Emitted when credits are minted (Trigger 4)
    event CreditsMinted(
        string indexed projectId,
        address indexed recipient,
        uint256 amount,
        string metadataCID,
        uint256 timestamp
    );

    event MintLimitSet(
        string indexed projectId,
        uint256 allowedCredits,
        uint256 timestamp
    );

    /// @notice Emitted on any on-chain lifecycle status change (registration, approval, etc.)
    event ProjectStatusUpdated(
        string indexed projectId,
        string previousStatus,
        string newStatus,
        address indexed updatedBy,
        uint256 timestamp
    );

    event CreditsBurned(
        string indexed projectId,
        address indexed holder,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Emitted when a field officer is assigned to a project
    event FieldOfficerAssigned(
        string indexed projectId,
        address indexed fieldOfficer,
        address indexed assignedBy,
        uint256 timestamp
    );

    /// @notice Emitted when a validator is assigned to a project
    event ValidatorAssigned(
        string indexed projectId,
        address indexed validator,
        address indexed assignedBy,
        uint256 timestamp
    );

    // ──────────────────── Errors ────────────────────
    error MintExceedsLimit(string projectId, uint256 requested, uint256 available);
    error ZeroAmount();
    error EmptyProjectId();
    error EmptyCID();
    error BatchAlreadyMinted(bytes32 batchHash);
    error MintLimitBelowMinted(string projectId, uint256 newLimit, uint256 alreadyMinted);
    error ProjectAlreadyRegistered(string projectId);
    error ProjectNotRegistered(string projectId);
    error SubmissionAlreadyAnchored(string projectId, string submissionId);
    error ProjectAlreadyApproved(string projectId);
    error EmptySubmissionId();
    error EmptyMetadataURI();
    error ZeroDataHash();

    // ──────────────────── Constructor ────────────────────
    constructor() ERC20("Blue Carbon Credit", "BCC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ──────────────────── MRV Lifecycle Functions ────────────────────

    /**
     * @notice Register a new carbon project on-chain (Trigger 1 — POST /projects)
     * @dev Called by the backend (ADMIN_ROLE) right after the project is created in MongoDB.
     *      Prevents double-registration via _registeredProjects mapping.
     * @param projectId  The unique project identifier from the MRV system
     * @param ownerWallet Ethereum address of the project owner
     * @param metadataURI IPFS URI of the project's metadata document
     */
    function registerProject(
        string calldata projectId,
        address ownerWallet,
        string calldata metadataURI
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();
        // Idempotency: revert if already registered (backend checks DB flag, but belt-and-suspenders)
        if (_registeredProjects[projectId]) revert ProjectAlreadyRegistered(projectId);

        _registeredProjects[projectId] = true;

        emit ProjectRegistered(projectId, ownerWallet, metadataURI, block.timestamp);
        emit ProjectStatusUpdated(projectId, "NONE", "REGISTERED", msg.sender, block.timestamp);
    }

    /**
     * @notice Anchor a field submission hash on-chain (Trigger 2 — POST /submissions)
     * @dev Called by the backend using FIELD_OFFICER_ROLE (or ADMIN_ROLE acting on behalf).
     *      Stores keccak256(submissionData) to ensure immutable data integrity.
     * @param projectId    The project identifier
     * @param submissionId The unique submission identifier from MongoDB
     * @param dataHash     keccak256 hash of the canonical submission JSON
     */
    function anchorSubmission(
        string calldata projectId,
        string calldata submissionId,
        bytes32 dataHash
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        // ADMIN_ROLE used since backend signs all txs with one admin key.
        // In a fully decentralised setup this would be FIELD_OFFICER_ROLE.
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        if (bytes(submissionId).length == 0) revert EmptySubmissionId();
        if (dataHash == bytes32(0)) revert ZeroDataHash();
        if (!_registeredProjects[projectId]) revert ProjectNotRegistered(projectId);
        // Idempotency guard per (projectId, submissionId) pair
        if (_anchoredSubmissions[projectId][submissionId] != bytes32(0))
            revert SubmissionAlreadyAnchored(projectId, submissionId);

        _anchoredSubmissions[projectId][submissionId] = dataHash;

        emit SubmissionAnchored(projectId, submissionId, dataHash, block.timestamp);
    }

    /**
     * @notice Record on-chain validator approval (Trigger 3 — PATCH /verifications/:id/approve)
     * @dev Called by the backend (ADMIN_ROLE).  In a decentralised flow the validator
     *      would sign this tx themselves using VALIDATOR_ROLE.
     * @param projectId           The project identifier
     * @param validatorWallet     Ethereum address of the approving validator
     * @param verificationReportURI IPFS URI of the verification report document
     */
    function approveProject(
        string calldata projectId,
        address validatorWallet,
        string calldata verificationReportURI
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        if (bytes(verificationReportURI).length == 0) revert EmptyMetadataURI();
        if (!_registeredProjects[projectId]) revert ProjectNotRegistered(projectId);
        if (_approvedProjects[projectId]) revert ProjectAlreadyApproved(projectId);

        _approvedProjects[projectId] = true;

        emit ProjectApproved(projectId, validatorWallet, verificationReportURI, block.timestamp);
        emit ProjectStatusUpdated(projectId, "REGISTERED", "APPROVED", msg.sender, block.timestamp);
    }

    /**
     * @notice Record field officer assignment on-chain
     * @param projectId   The project identifier
     * @param fieldOfficer Ethereum address of the field officer
     */
    function assignFieldOfficer(
        string calldata projectId,
        address fieldOfficer
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        if (!_registeredProjects[projectId]) revert ProjectNotRegistered(projectId);

        emit FieldOfficerAssigned(projectId, fieldOfficer, msg.sender, block.timestamp);
    }

    /**
     * @notice Record validator assignment on-chain
     * @param projectId The project identifier
     * @param validator Ethereum address of the validator
     */
    function assignValidator(
        string calldata projectId,
        address validator
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        if (!_registeredProjects[projectId]) revert ProjectNotRegistered(projectId);

        emit ValidatorAssigned(projectId, validator, msg.sender, block.timestamp);
    }

    // ──────────────────── Admin Functions ────────────────────

    /**
     * @notice Mint carbon credits for a specific project (Trigger 4 — POST /projects/:id/mint)
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

        emit MintLimitSet(projectId, allowedCredits, block.timestamp);
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

        emit CreditsBurned(projectId, msg.sender, amount, block.timestamp);
    }

    // ──────────────────── View Functions ────────────────────

    /// @notice Check if a project has been registered on-chain
    function isProjectRegistered(string calldata projectId) external view returns (bool) {
        return _registeredProjects[projectId];
    }

    /// @notice Get the anchored data hash for a specific submission
    function getAnchoredSubmissionHash(
        string calldata projectId,
        string calldata submissionId
    ) external view returns (bytes32) {
        return _anchoredSubmissions[projectId][submissionId];
    }

    /// @notice Check if a project has been approved by a validator on-chain
    function isProjectApproved(string calldata projectId) external view returns (bool) {
        return _approvedProjects[projectId];
    }

    /// @notice Get total minted credits for a project
    function getMintedCredits(string calldata projectId) external view returns (uint256) {
        return _mintedCredits[projectId];
    }

    /// @notice Get the allowed credit limit for a project
    function getAllowedCredits(string calldata projectId) external view returns (uint256) {
        return _allowedCredits[projectId];
    }

    /// @notice Check if minting `amount` credits is within the limit for a project
    function validateMintLimit(
        string calldata projectId,
        uint256 amount
    ) external view returns (bool) {
        uint256 allowed = _allowedCredits[projectId];
        if (allowed == 0) return true; // No limit set = unlimited
        return _mintedCredits[projectId] + amount <= allowed;
    }

    /// @notice Get all metadata CIDs for a project
    function getProjectMetadata(string calldata projectId) external view returns (string[] memory) {
        return _projectMetadataCIDs[projectId];
    }

    /// @notice Check if a batch has already been minted
    function isBatchMinted(bytes32 batchHash) external view returns (bool) {
        return _mintedBatches[batchHash];
    }

    /**
     * @notice Returns the complete lifecycle state of a project in a single call.
     * @return registered  Whether the project has been registered on-chain
     * @return approved    Whether a validator has approved the project on-chain
     * @return minted      Total credits minted (in 18-decimal wei)
     * @return limit       Maximum allowed credits (0 = no limit set)
     */
    function getProjectLifecycleState(string calldata projectId)
        external
        view
        returns (
            bool registered,
            bool approved,
            uint256 minted,
            uint256 limit
        )
    {
        return (
            _registeredProjects[projectId],
            _approvedProjects[projectId],
            _mintedCredits[projectId],
            _allowedCredits[projectId]
        );
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
