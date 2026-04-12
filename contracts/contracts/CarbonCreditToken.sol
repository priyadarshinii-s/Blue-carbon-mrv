// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CarbonCreditToken is ERC20, AccessControl, ReentrancyGuard, Pausable {

    bytes32 public constant ADMIN_ROLE          = keccak256("ADMIN_ROLE");
    bytes32 public constant VALIDATOR_ROLE      = keccak256("VALIDATOR_ROLE");
    bytes32 public constant FIELD_OFFICER_ROLE  = keccak256("FIELD_OFFICER_ROLE");

    mapping(bytes32 => uint256) private _mintedCredits;
    mapping(bytes32 => uint256) private _allowedCredits;
    mapping(bytes32 => bool)    private _registeredProjects;
    mapping(bytes32 => bool)    private _approvedProjects;
    mapping(bytes32 => mapping(bytes32 => bytes32)) private _anchoredSubmissions;
    mapping(bytes32 => bool)    private _mintedBatches;

    event ProjectRegistered(string indexed projectId, address indexed ownerWallet, string metadataURI, uint256 timestamp);
    event SubmissionAnchored(string indexed projectId, string submissionId, bytes32 dataHash, uint256 timestamp);
    event ProjectApproved(string indexed projectId, address indexed validatorWallet, string verificationReportURI, uint256 timestamp);
    event CreditsMinted(string indexed projectId, address indexed recipient, uint256 amount, string metadataCID, uint256 timestamp);
    event MintLimitSet(string indexed projectId, uint256 allowedCredits, uint256 timestamp);
    event ProjectStatusUpdated(string indexed projectId, string previousStatus, string newStatus, address indexed updatedBy, uint256 timestamp);
    event CreditsBurned(string indexed projectId, address indexed holder, uint256 amount, uint256 timestamp);
    event FieldOfficerAssigned(string indexed projectId, address indexed fieldOfficer, address indexed assignedBy, uint256 timestamp);
    event ValidatorAssigned(string indexed projectId, address indexed validator, address indexed assignedBy, uint256 timestamp);

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

    modifier onlyEitherRole(bytes32 roleA, bytes32 roleB) {
        if (!hasRole(roleA, msg.sender) && !hasRole(roleB, msg.sender))
            revert AccessControlUnauthorizedAccount(msg.sender, roleA);
        _;
    }

    constructor() ERC20("Blue Carbon Credit", "BCC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function _pid(string calldata projectId) private pure returns (bytes32) {
        return keccak256(bytes(projectId));
    }

    function _sid(string calldata submissionId) private pure returns (bytes32) {
        return keccak256(bytes(submissionId));
    }

    function registerProject(
        string calldata projectId,
        address ownerWallet,
        string calldata metadataURI
    ) external whenNotPaused {
        if (bytes(projectId).length   == 0) revert EmptyProjectId();
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        bytes32 pid = _pid(projectId);
        if (_registeredProjects[pid]) revert ProjectAlreadyRegistered(projectId);

        _registeredProjects[pid] = true;

        emit ProjectRegistered(projectId, ownerWallet, metadataURI, block.timestamp);
        emit ProjectStatusUpdated(projectId, "NONE", "REGISTERED", msg.sender, block.timestamp);
    }

    function anchorSubmission(
        string calldata projectId,
        string calldata submissionId,
        bytes32 dataHash
    ) external onlyEitherRole(FIELD_OFFICER_ROLE, ADMIN_ROLE) whenNotPaused {
        if (bytes(projectId).length    == 0) revert EmptyProjectId();
        if (bytes(submissionId).length == 0) revert EmptySubmissionId();
        if (dataHash == bytes32(0))          revert ZeroDataHash();

        bytes32 pid = _pid(projectId);
        bytes32 sid = _sid(submissionId);

        if (!_registeredProjects[pid])                    revert ProjectNotRegistered(projectId);
        if (_anchoredSubmissions[pid][sid] != bytes32(0)) revert SubmissionAlreadyAnchored(projectId, submissionId);

        _anchoredSubmissions[pid][sid] = dataHash;

        emit SubmissionAnchored(projectId, submissionId, dataHash, block.timestamp);
    }

    function approveProject(
        string calldata projectId,
        address validatorWallet,
        string calldata verificationReportURI
    ) external onlyEitherRole(VALIDATOR_ROLE, ADMIN_ROLE) whenNotPaused {
        if (bytes(projectId).length            == 0) revert EmptyProjectId();
        if (bytes(verificationReportURI).length == 0) revert EmptyMetadataURI();

        bytes32 pid = _pid(projectId);

        if (!_registeredProjects[pid]) revert ProjectNotRegistered(projectId);
        if (_approvedProjects[pid])    revert ProjectAlreadyApproved(projectId);

        _approvedProjects[pid] = true;

        emit ProjectApproved(projectId, validatorWallet, verificationReportURI, block.timestamp);
        emit ProjectStatusUpdated(projectId, "REGISTERED", "APPROVED", msg.sender, block.timestamp);
    }

    function assignFieldOfficer(
        string calldata projectId,
        address fieldOfficer
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        bytes32 pid = _pid(projectId);
        if (!_registeredProjects[pid]) revert ProjectNotRegistered(projectId);
        emit FieldOfficerAssigned(projectId, fieldOfficer, msg.sender, block.timestamp);
    }

    function assignValidator(
        string calldata projectId,
        address validator
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        if (bytes(projectId).length == 0) revert EmptyProjectId();
        bytes32 pid = _pid(projectId);
        if (!_registeredProjects[pid]) revert ProjectNotRegistered(projectId);
        emit ValidatorAssigned(projectId, validator, msg.sender, block.timestamp);
    }

    function mintCredits(
        string calldata projectId,
        uint256 amount,
        string calldata metadataCID
    ) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused {
        if (amount == 0)                    revert ZeroAmount();
        if (bytes(projectId).length  == 0)  revert EmptyProjectId();
        if (bytes(metadataCID).length == 0) revert EmptyCID();

        bytes32 batchHash = keccak256(abi.encodePacked(projectId, amount, metadataCID));
        if (_mintedBatches[batchHash]) revert BatchAlreadyMinted(batchHash);

        bytes32 pid     = _pid(projectId);
        uint256 allowed = _allowedCredits[pid];
        uint256 minted  = _mintedCredits[pid];

        if (allowed > 0 && minted + amount > allowed)
            revert MintExceedsLimit(projectId, amount, allowed - minted);

        _mintedCredits[pid]       = minted + amount;
        _mintedBatches[batchHash] = true;

        _mint(msg.sender, amount);

        emit CreditsMinted(projectId, msg.sender, amount, metadataCID, block.timestamp);
    }

    function setMintLimit(
        string calldata projectId,
        uint256 allowedCredits
    ) external onlyRole(ADMIN_ROLE) {
        if (bytes(projectId).length == 0) revert EmptyProjectId();

        bytes32 pid    = _pid(projectId);
        uint256 minted = _mintedCredits[pid];

        if (allowedCredits < minted)
            revert MintLimitBelowMinted(projectId, allowedCredits, minted);

        _allowedCredits[pid] = allowedCredits;

        emit MintLimitSet(projectId, allowedCredits, block.timestamp);
    }

    function retireCredits(
        string calldata projectId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (amount == 0)                  revert ZeroAmount();
        if (bytes(projectId).length == 0) revert EmptyProjectId();

        _burn(msg.sender, amount);

        emit CreditsBurned(projectId, msg.sender, amount, block.timestamp);
    }

    function isProjectRegistered(string calldata projectId) external view returns (bool) {
        return _registeredProjects[_pid(projectId)];
    }

    function getAnchoredSubmissionHash(
        string calldata projectId,
        string calldata submissionId
    ) external view returns (bytes32) {
        return _anchoredSubmissions[_pid(projectId)][_sid(submissionId)];
    }

    function isProjectApproved(string calldata projectId) external view returns (bool) {
        return _approvedProjects[_pid(projectId)];
    }

    function getMintedCredits(string calldata projectId) external view returns (uint256) {
        return _mintedCredits[_pid(projectId)];
    }

    function getAllowedCredits(string calldata projectId) external view returns (uint256) {
        return _allowedCredits[_pid(projectId)];
    }

    function validateMintLimit(string calldata projectId, uint256 amount) external view returns (bool) {
        bytes32 pid     = _pid(projectId);
        uint256 allowed = _allowedCredits[pid];
        if (allowed == 0) return true;
        return _mintedCredits[pid] + amount <= allowed;
    }

    function isBatchMinted(bytes32 batchHash) external view returns (bool) {
        return _mintedBatches[batchHash];
    }

    function getProjectLifecycleState(string calldata projectId)
        external view
        returns (bool registered, bool approved, uint256 minted, uint256 limit)
    {
        bytes32 pid = _pid(projectId);
        return (
            _registeredProjects[pid],
            _approvedProjects[pid],
            _mintedCredits[pid],
            _allowedCredits[pid]
        );
    }

    function pause()   external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }

    function decimals() public pure override returns (uint8) { return 18; }

    function supportsInterface(bytes4 interfaceId)
        public view override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}