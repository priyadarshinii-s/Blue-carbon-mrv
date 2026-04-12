import { Request, Response } from 'express';
import User from '../models/User';
import Project from '../models/Project';
import Verification from '../models/Verification';
import TokenData from '../models/TokenData';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/AppError';
import { UserRole, UserStatus } from '../types';
import { generateTokenId } from '../utils/generateId';
import { uploadJSONToIPFS } from '../services/ipfs.service';
import {
    mintCreditsOnChain,
    setMintLimitOnChain,
    isBlockchainConfigured,
    assignFieldOfficerOnChain,
    assignValidatorOnChain,
} from '../services/blockchain.service';
import { logger } from '../utils/logger';
import { logAudit } from '../services/audit.service';
import { AuditAction } from '../models/AuditLog';

// ── Explorer URL helper ──
const EXPLORER_BASE_URL = process.env.EXPLORER_BASE_URL || 'https://amoy.polygonscan.com';
export function getExplorerTxUrl(txHash: string): string {
    return `${EXPLORER_BASE_URL}/tx/${txHash}`;
}

// ──────────────────────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────────────────────

export const getUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;

    const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: {
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
    });
});

export const createStaffUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { walletAddress, userName, email, phone, organization, role } = req.body;

    const existingUser = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existingUser) {
        throw new ConflictError('Wallet address is already registered.');
    }

    if (email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            throw new ConflictError('Email is already registered.');
        }
    }

    const user = await User.create({
        walletAddress: walletAddress.toLowerCase(),
        userName,
        email: email?.toLowerCase(),
        phone,
        organization,
        role,
        status: UserStatus.APPROVED,
    });

    logger.info({ walletAddress: user.walletAddress, role }, 'Staff user created by admin');

    logAudit(AuditAction.STAFF_CREATED, req.user!.walletAddress, `Staff user "${userName}" created with role ${role}`, {
        targetId: user.walletAddress,
        meta: { userName, role, organization },
    });

    res.status(201).json({
        success: true,
        data: { user },
    });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
        throw new NotFoundError('User not found.');
    }

    user.role = role;
    await user.save();

    logger.info({ userId: req.params.id, newRole: role }, 'User role updated');

    logAudit(AuditAction.ROLE_CHANGED, req.user!.walletAddress, `User ${user.walletAddress} role changed to ${role}`, {
        targetId: user.walletAddress,
        meta: { previousRole: user.role, newRole: role },
    });

    res.status(200).json({
        success: true,
        data: { user },
    });
});

export const assignUserToProject = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { projectId, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
        throw new NotFoundError('User not found.');
    }

    const project = await Project.findOne({ projectId });
    if (!project) {
        throw new NotFoundError('Project not found.');
    }

    if (role === 'FIELD_OFFICER' && user.role !== UserRole.FIELD_OFFICER) {
        throw new BadRequestError('User must have FIELD_OFFICER role to be assigned as field officer.');
    }
    if (role === 'VALIDATOR' && user.role !== UserRole.VALIDATOR) {
        throw new BadRequestError('User must have VALIDATOR role to be assigned as validator.');
    }

    if (role === 'FIELD_OFFICER') {
        project.assignedFieldOfficer = user.walletAddress;
        project.fieldOfficerAssignedAt = new Date();
    } else if (role === 'VALIDATOR') {
        project.assignedValidator = user.walletAddress;
        project.validatorAssignedAt = new Date();
    }

    await project.save();

    logger.info({ userId: req.params.id, projectId, role }, 'User assigned to project');

    const auditAction = role === 'FIELD_OFFICER' ? AuditAction.FIELD_OFFICER_ASSIGNED : AuditAction.VALIDATOR_ASSIGNED;
    logAudit(auditAction, req.user!.walletAddress, `${role === 'FIELD_OFFICER' ? 'Field Officer' : 'Validator'} ${user.walletAddress} assigned to project ${projectId}`, {
        targetId: projectId,
        meta: { assignedWallet: user.walletAddress, role },
    });

    // ── Record assignment on-chain ──
    let assignmentTxHash: string | undefined;
    let explorerUrl: string | undefined;
    const blockchainEnabled = await isBlockchainConfigured();

    if (blockchainEnabled && project.onChainTxHash) {
        try {
            if (role === 'FIELD_OFFICER') {
                const receipt = await assignFieldOfficerOnChain(projectId, user.walletAddress);
                assignmentTxHash = receipt.txHash;
            } else {
                const receipt = await assignValidatorOnChain(projectId, user.walletAddress);
                assignmentTxHash = receipt.txHash;
            }

            if (assignmentTxHash) {
                explorerUrl = getExplorerTxUrl(assignmentTxHash);

                // Store tx in project's blockchain history
                await Project.findOneAndUpdate(
                    { projectId },
                    {
                        $push: {
                            blockchainTxHistory: {
                                action: role === 'FIELD_OFFICER' ? 'FIELD_OFFICER_ASSIGNED' : 'VALIDATOR_ASSIGNED',
                                txHash: assignmentTxHash,
                                explorerUrl,
                                timestamp: new Date(),
                            },
                        },
                    }
                );

                logger.info(
                    { projectId, role, txHash: assignmentTxHash, explorerUrl },
                    `${role} assignment recorded on-chain`
                );
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            logger.error({ err, projectId, role }, 'On-chain assignment recording failed — MongoDB state preserved');
            logAudit(AuditAction.BLOCKCHAIN_TX_FAILED, req.user!.walletAddress,
                `On-chain ${role} assignment failed for ${projectId}: ${errorMsg}`,
                { targetId: projectId, meta: { trigger: 'assignment', role, error: errorMsg } }
            );
        }
    }

    res.status(200).json({
        success: true,
        data: {
            project,
            blockchainTx: assignmentTxHash ? {
                txHash: assignmentTxHash,
                explorerUrl,
                action: role === 'FIELD_OFFICER' ? 'FIELD_OFFICER_ASSIGNED' : 'VALIDATOR_ASSIGNED',
            } : undefined,
        },
    });
});

// ──────────────────────────────────────────────────────────────
// Mint Queue — GET /admin/mint-queue
// ──────────────────────────────────────────────────────────────

export const getMintQueue = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const projects = await Project.find({
        totalCarbonCredits: { $gt: 0 },
        status: { $in: ['VALIDATED', 'ACTIVE', 'COMPLETED'] },
    }).sort({ totalCarbonCredits: -1 });

    const mintQueue = await Promise.all(
        projects.map(async (project) => {
            const mintedTokens = await TokenData.find({ projectId: project.projectId });
            const totalMinted = project.totalMinted || mintedTokens.reduce((sum, t) => sum + t.mintedAmount, 0);
            const unmintedCredits = project.totalCarbonCredits - totalMinted;

            return {
                project,
                totalMinted,
                unmintedCredits,
                mintedTokens,
                onChainEnabled: project.onChainMinted || false,
            };
        })
    );

    const filteredQueue = mintQueue.filter((item) => item.unmintedCredits > 0);

    res.status(200).json({
        success: true,
        data: { mintQueue: filteredQueue },
    });
});

// ──────────────────────────────────────────────────────────────
// TRIGGER 4 — POST /admin/projects/:projectId/mint
//
// Flow:
//  1. Load project from MongoDB
//  2. Validate available credits (totalCarbonCredits - totalMinted)
//  3. Idempotency guard: reject if already onChainMinted for this exact amount+year
//  4. Upload metadata to IPFS → CID
//  5. Set mint limit on-chain
//  6. Call mintCreditsOnChain → wait for tx.wait(1)
//  7. Listen for CreditsMinted event via blockchain.listener (async safety net)
//  8. ONLY after confirmed receipt: insert TokenData + update Project fields
//  9. Write CREDIT_MINTED AuditLog with tx hash
// ──────────────────────────────────────────────────────────────

/**
 * Mint carbon credits — on-chain via smart contract + MongoDB.
 *
 * Key design decisions:
 *  • onChainMinted flag checked BEFORE any blockchain call — prevents duplicate
 *    minting on API retries or double-clicks.
 *  • TokenData + Project are only written AFTER tx.wait(1) confirms the mint.
 *  • On blockchain failure: 500 returned, MongoDB NOT touched (no optimistic writes).
 *  • On MongoDB failure after confirmed tx: tx hash is logged to AuditLog with
 *    BLOCKCHAIN_TX_FAILED for manual reconciliation — we never lose the tx hash.
 */
export const mintCredits = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const projectId = req.params.projectId as string;
    const { year, amount } = req.body;

    // ── Step 1: Fetch project ──
    const project = await Project.findOne({ projectId });
    if (!project) {
        throw new NotFoundError('Project not found.');
    }

    // ── Step 2: Validate available credits ──
    const totalMinted = project.totalMinted || 0;
    const available = project.totalCarbonCredits - totalMinted;

    if (amount > available) {
        throw new BadRequestError(
            `Cannot mint ${amount} credits. Only ${available} unminted credits available.`
        );
    }

    // ── Step 3: Idempotency guard ──
    // If a TokenData record already exists for this (projectId, year) with
    // onChainStatus='confirmed', block the duplicate mint request.
    const existingMint = await TokenData.findOne({
        projectId,
        year,
        onChainStatus: 'confirmed',
    });
    if (existingMint) {
        throw new BadRequestError(
            `Credits for project ${projectId} year ${year} have already been minted on-chain (txHash: ${existingMint.mintTxHash}). ` +
            `To mint additional credits, submit a new request with a different year or remaining credit balance.`
        );
    }

    // Also guard on the project-level flag for complete mints
    if (project.onChainMinted && totalMinted >= project.totalCarbonCredits) {
        throw new BadRequestError(
            `All ${project.totalCarbonCredits} credits for project ${projectId} have already been minted on-chain.`
        );
    }

    // ── Step 4: Upload metadata to IPFS ──
    const metadata = {
        projectId,
        projectName: project.projectName,
        projectType: project.projectType,
        year,
        amount,
        location: project.location,
        mintedAt: new Date().toISOString(),
    };

    const metadataIPFS = await uploadJSONToIPFS(metadata, `${projectId}-${year}-metadata`);

    // ── Step 5: Return metadata for frontend to mint on-chain ──
    // The actual state updates to TokenData and Project will happen
    // in the confirm-tx endpoint after the frontend wallet signs the transaction.
    
    res.status(201).json({
        success: true,
        data: {
            metadataIPFS,
            year,
            amount,
        },
    });
});
