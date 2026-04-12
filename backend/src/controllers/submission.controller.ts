import { Request, Response } from 'express';
import { ethers } from 'ethers';
import Submission from '../models/Submission';
import Project from '../models/Project';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { generateSubmissionId } from '../utils/generateId';
import { UserRole, ProjectStatus } from '../types';
import { logger } from '../utils/logger';
import { logAudit } from '../services/audit.service';
import { AuditAction } from '../models/AuditLog';
import {
    anchorSubmissionOnChain,
    isBlockchainConfigured,
} from '../services/blockchain.service';
import { getExplorerTxUrl } from '../controllers/admin.controller';

// ──────────────────────────────────────────────────────────────
// TRIGGER 2 — POST /submissions
// ──────────────────────────────────────────────────────────────
export const createSubmission = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    const { projectId } = req.body;

    const project = await Project.findOne({ projectId });
    if (!project) {
        throw new NotFoundError('Project not found.');
    }

    if (project.assignedFieldOfficer !== req.user.walletAddress) {
        throw new ForbiddenError('You are not the assigned field officer for this project.');
    }

    if (project.status !== 'PENDING' && project.status !== 'SUBMITTED') {
        throw new BadRequestError('Submissions can only be made for PENDING or SUBMITTED projects.');
    }

    const submissionId = generateSubmissionId();

    // ── Step 1: Create submission in MongoDB ──
    const submission = await Submission.create({
        ...req.body,
        submissionId,
        fieldOfficerWallet: req.user.walletAddress,
        visitDate: new Date(),
    });

    logger.info({ submissionId, projectId }, 'Field data submitted');

    // ── Step 2: Transition project status PENDING → SUBMITTED in MongoDB ──
    if (project.status === 'PENDING') {
        await Project.findOneAndUpdate(
            { projectId },
            { $set: { status: ProjectStatus.SUBMITTED } }
        );
    }

    logAudit(AuditAction.DATA_SUBMITTED, req.user.walletAddress, `Field data submitted for project ${projectId}`, {
        targetId: submissionId,
        meta: { projectId, survivingTrees: req.body.survivingTrees },
    });

    // ── Step 3: Anchor submission hash on-chain ──
    // Strategy: compute keccak256 of the canonical submission payload.
    // We use the stored MongoDB fields so the hash is reproducible from the DB record.
    const blockchainEnabled = await isBlockchainConfigured();

    if (blockchainEnabled) {
        // Idempotency guard: skip if this submission was already anchored
        if (!submission.anchorTxHash) {
            try {
                // Build a deterministic canonical payload from the submission fields.
                // We deliberately exclude _id, createdAt, updatedAt (Mongoose noise) so the
                // hash is reproducible from the user-submitted data alone.
                const canonicalPayload = JSON.stringify({
                    submissionId: submission.submissionId,
                    projectId: submission.projectId,
                    fieldOfficerWallet: submission.fieldOfficerWallet,
                    visitDate: submission.visitDate.toISOString(),
                    survivingTrees: submission.survivingTrees,
                    survivalRate: submission.survivalRate,
                    gps: submission.gps,
                    siteCondition: submission.siteCondition,
                    restorationLog: submission.restorationLog,
                    carbonInputs: submission.carbonInputs,
                });

                // keccak256 of the UTF-8 encoded JSON string
                const dataHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalPayload));

                const receipt = await anchorSubmissionOnChain(projectId, submissionId, dataHash);

                // ── Step 4: Update Submission ONLY after confirmed tx ──
                await Submission.findOneAndUpdate(
                    { submissionId },
                    {
                        $set: {
                            anchorTxHash: receipt.txHash,
                            anchorBlock: receipt.blockNumber,
                            // Keep legacy field in sync for any existing queries
                            blockchainSubmissionHash: dataHash,
                        },
                    }
                );

                submission.anchorTxHash = receipt.txHash;

                const explorerUrl = getExplorerTxUrl(receipt.txHash);

                // Store tx in project's blockchain history
                await Project.findOneAndUpdate(
                    { projectId },
                    {
                        $push: {
                            blockchainTxHistory: {
                                action: 'SUBMISSION_ANCHORED',
                                txHash: receipt.txHash,
                                explorerUrl,
                                blockNumber: receipt.blockNumber,
                                timestamp: new Date(),
                            },
                        },
                    }
                );

                logger.info(
                    { submissionId, projectId, txHash: receipt.txHash, blockNumber: receipt.blockNumber },
                    'Submission anchored on-chain'
                );

                logAudit(
                    AuditAction.SUBMISSION_ANCHORED,
                    req.user.walletAddress,
                    `Submission ${submissionId} anchored on-chain for project ${projectId}`,
                    {
                        targetId: submissionId,
                        txHash: receipt.txHash,
                        meta: {
                            projectId,
                            blockNumber: receipt.blockNumber,
                            gasUsed: receipt.gasUsed,
                            dataHash,
                        },
                    }
                );
            } catch (blockchainErr: unknown) {
                // On-chain failure: submission exists in MongoDB and is usable.
                // Log to AuditLog for manual reconciliation — do NOT throw.
                const errorMsg = blockchainErr instanceof Error
                    ? blockchainErr.message
                    : 'Unknown blockchain error';

                logger.error(
                    { err: blockchainErr, submissionId, projectId },
                    'On-chain submission anchoring failed — MongoDB state preserved'
                );

                logAudit(
                    AuditAction.BLOCKCHAIN_TX_FAILED,
                    req.user.walletAddress,
                    `On-chain anchoring failed for submission ${submissionId}: ${errorMsg}`,
                    {
                        targetId: submissionId,
                        meta: { trigger: 'anchorSubmission', projectId, error: errorMsg },
                    }
                );
            }
        } else {
            logger.info({ submissionId, anchorTxHash: submission.anchorTxHash }, 'Submission already anchored — skipping');
        }
    } else {
        logger.warn({ submissionId }, 'Blockchain not configured — skipping on-chain anchoring');
    }

    res.status(201).json({
        success: true,
        data: { submission },
    });
});

// ──────────────────────────────────────────────────────────────
// GET /submissions/mine
// ──────────────────────────────────────────────────────────────
export const getMySubmissions = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { fieldOfficerWallet: req.user.walletAddress };

    if (req.query.projectId) {
        filter.projectId = req.query.projectId;
    }
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const [submissions, total] = await Promise.all([
        Submission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Submission.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: {
            submissions,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
    });
});

// ──────────────────────────────────────────────────────────────
// GET /submissions/:id
// ──────────────────────────────────────────────────────────────
export const getSubmission = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const submission = await Submission.findOne({ submissionId: req.params.id });
    if (!submission) {
        throw new NotFoundError('Submission not found.');
    }

    res.status(200).json({
        success: true,
        data: { submission },
    });
});

// ──────────────────────────────────────────────────────────────
// GET /submissions/project/:projectId
// ──────────────────────────────────────────────────────────────
export const getProjectSubmissions = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const submissions = await Submission.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: { submissions },
    });
});
