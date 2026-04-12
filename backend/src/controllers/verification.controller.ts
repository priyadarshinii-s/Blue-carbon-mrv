import { Request, Response } from 'express';
import Verification from '../models/Verification';
import Submission from '../models/Submission';
import Project from '../models/Project';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { generateVerificationId } from '../utils/generateId';
import { SubmissionStatus, VerificationStatus, ProjectStatus } from '../types';
import { logger } from '../utils/logger';
import { logAudit } from '../services/audit.service';
import { AuditAction } from '../models/AuditLog';
import {
    approveProjectOnChain,
    isBlockchainConfigured,
} from '../services/blockchain.service';
import { getExplorerTxUrl } from '../controllers/admin.controller';
import { uploadJSONToIPFS } from '../services/ipfs.service';

// ──────────────────────────────────────────────────────────────
// GET /verifications/queue
// ──────────────────────────────────────────────────────────────
export const getVerificationQueue = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    const assignedProjects = await Project.find({
        assignedValidator: req.user.walletAddress,
    }).select('projectId');

    const projectIds = assignedProjects.map((p) => p.projectId);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const filter = {
        projectId: { $in: projectIds },
        status: { $in: [SubmissionStatus.PENDING, SubmissionStatus.NEEDS_CORRECTION] },
    };

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
// TRIGGER 3 — PATCH /verifications/:submissionId/review
// ──────────────────────────────────────────────────────────────
export const reviewSubmission = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    const { submissionId } = req.params;
    const { status, approvedCredits, remarks } = req.body;
    const verificationReportURI: string | undefined = typeof req.body.verificationReportURI === 'string'
        ? req.body.verificationReportURI
        : undefined;

    const submission = await Submission.findOne({ submissionId });
    if (!submission) {
        throw new NotFoundError('Submission not found.');
    }

    const project = await Project.findOne({ projectId: submission.projectId });
    if (!project) {
        throw new NotFoundError('Associated project not found.');
    }

    if (project.assignedValidator !== req.user.walletAddress) {
        throw new ForbiddenError('You are not the assigned validator for this project.');
    }

    // ── Step 1: Update Submission status in MongoDB ──
    if (status === 'Approved') {
        submission.status = SubmissionStatus.APPROVED;
    } else if (status === 'NeedsCorrection') {
        submission.status = SubmissionStatus.NEEDS_CORRECTION;
    } else {
        submission.status = SubmissionStatus.REJECTED;
    }
    submission.validatorComments = remarks || '';

    if (!submission.visitDate) {
        submission.visitDate = (submission.createdAt as Date) || new Date();
    }

    await submission.save();

    // ── Step 2: Create Verification document in MongoDB ──
    let verification = null;
    if (status === 'Approved' || status === 'Rejected') {
        const verificationId = generateVerificationId();
        verification = await Verification.create({
            verificationId,
            projectId: submission.projectId,
            submissionId: submission.submissionId,
            validatorWallet: req.user.walletAddress,
            status: status === 'Approved' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
            approvedCredits: approvedCredits || 0,
            remarks: remarks || '',
            finalized: false,
        });

        // ── Step 3: If Approved — update Project in MongoDB ──
        if (status === 'Approved') {
            const updateOps: Record<string, unknown> = {
                $set: { status: ProjectStatus.VALIDATED },
            };
            if (approvedCredits) {
                updateOps.$inc = { totalCarbonCredits: approvedCredits };
            }
            await Project.findOneAndUpdate(
                { projectId: submission.projectId },
                updateOps
            );
        }
    }

    logger.info({ submissionId, status, approvedCredits }, 'Submission reviewed');

    const auditAction = status === 'Approved' ? AuditAction.SUBMISSION_VERIFIED : AuditAction.SUBMISSION_REJECTED;
    logAudit(
        auditAction,
        req.user.walletAddress,
        `Submission ${submissionId as string} ${status.toLowerCase()}${approvedCredits ? ` (${approvedCredits} credits)` : ''}`,
        {
            targetId: submissionId as string,
            meta: { projectId: submission.projectId, status, approvedCredits, remarks },
        }
    );

    // ── Step 4 (Approval only): Record approval on-chain (Trigger 3) ──
    // This runs AFTER MongoDB writes succeed. On blockchain failure we log and
    // continue — the MongoDB state (VALIDATED) is the source of truth.
    if (status === 'Approved' && verification) {
        const blockchainEnabled = await isBlockchainConfigured();

        if (blockchainEnabled) {
            // Idempotency guard: skip if this verification was already approved on-chain
            if (!verification.approvalTxHash) {
                try {
                    // Build IPFS URI for the verification report; fall back to placeholder
                    let reportURI = verificationReportURI || `mrv://verification/${verification.verificationId}`;
                    try {
                        const ipfsCID = await uploadJSONToIPFS(
                            {
                                verificationId: verification.verificationId,
                                projectId: submission.projectId,
                                submissionId: submission.submissionId,
                                validatorWallet: req.user.walletAddress,
                                approvedCredits,
                                remarks,
                                approvedAt: new Date().toISOString(),
                            },
                            `${verification.verificationId}-report`
                        );
                        reportURI = ipfsCID;
                    } catch (ipfsErr) {
                        logger.warn({ err: ipfsErr, verificationId: verification.verificationId }, 'IPFS upload failed for verification report — using fallback URI');
                    }

                    const receipt = await approveProjectOnChain(
                        submission.projectId,
                        req.user.walletAddress,
                        reportURI
                    );

                    // ── Step 5: Update Verification ONLY after confirmed tx ──
                    await Verification.findOneAndUpdate(
                        { verificationId: verification.verificationId },
                        {
                            $set: {
                                approvalTxHash: receipt.txHash,
                                blockchainVerificationHash: receipt.txHash, // keep legacy field in sync
                                finalized: true,
                            },
                        }
                    );

                    // Reflect on the in-memory object sent back in response
                    verification.approvalTxHash = receipt.txHash;
                    (verification as any).finalized = true;

                    const explorerUrl = getExplorerTxUrl(receipt.txHash);

                    // Store tx in project's blockchain history
                    await Project.findOneAndUpdate(
                        { projectId: submission.projectId },
                        {
                            $push: {
                                blockchainTxHistory: {
                                    action: 'PROJECT_APPROVED',
                                    txHash: receipt.txHash,
                                    explorerUrl,
                                    blockNumber: receipt.blockNumber,
                                    timestamp: new Date(),
                                },
                            },
                        }
                    );

                    logger.info(
                        {
                            projectId: submission.projectId,
                            verificationId: verification.verificationId,
                            txHash: receipt.txHash,
                            blockNumber: receipt.blockNumber,
                        },
                        'Project approval recorded on-chain'
                    );

                    logAudit(
                        AuditAction.PROJECT_APPROVED_ON_CHAIN,
                        req.user.walletAddress,
                        `Project ${submission.projectId} approved on-chain by ${req.user.walletAddress}`,
                        {
                            targetId: submission.projectId,
                            txHash: receipt.txHash,
                            meta: {
                                verificationId: verification.verificationId,
                                approvedCredits,
                                blockNumber: receipt.blockNumber,
                                gasUsed: receipt.gasUsed,
                                reportURI,
                            },
                        }
                    );
                } catch (blockchainErr: unknown) {
                    // On-chain failure: MongoDB is already VALIDATED — that is correct.
                    // Log for manual reconciliation (the validator can re-trigger via admin tooling).
                    const errorMsg = blockchainErr instanceof Error
                        ? blockchainErr.message
                        : 'Unknown blockchain error';

                    logger.error(
                        { err: blockchainErr, projectId: submission.projectId, verificationId: verification.verificationId },
                        'On-chain approval recording failed — MongoDB state preserved (project is VALIDATED)'
                    );

                    logAudit(
                        AuditAction.BLOCKCHAIN_TX_FAILED,
                        req.user.walletAddress,
                        `On-chain approval failed for project ${submission.projectId}: ${errorMsg}`,
                        {
                            targetId: submission.projectId,
                            meta: {
                                trigger: 'approveProject',
                                verificationId: verification.verificationId,
                                error: errorMsg,
                            },
                        }
                    );
                }
            } else {
                logger.info(
                    { verificationId: verification.verificationId, approvalTxHash: verification.approvalTxHash },
                    'Project already approved on-chain — skipping'
                );
            }
        } else {
            logger.warn({ projectId: submission.projectId }, 'Blockchain not configured — skipping on-chain approval');
        }
    }

    res.status(200).json({
        success: true,
        data: {
            submission,
            verification,
        },
    });
});

// ──────────────────────────────────────────────────────────────
// GET /verifications/project/:projectId
// ──────────────────────────────────────────────────────────────
export const getProjectVerifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const verifications = await Verification.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: { verifications },
    });
});
