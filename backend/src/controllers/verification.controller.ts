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

    // ── Step 4 (Approval only): Upload metadata to IPFS for frontend to sign ──
    let reportURI = verificationReportURI;
    if (status === 'Approved' && verification) {
        try {
            reportURI = reportURI || `mrv://verification/${verification.verificationId}`;
            const ipfsCID = await uploadJSONToIPFS(
                {
                    verificationId: verification.verificationId,
                    projectId: submission.projectId,
                    submissionId: submission.submissionId,
                    validatorWallet: req.user.walletAddress,
                    approvedCredits,
                    remarks,
                    timestamp: new Date().toISOString(),
                },
                `${verification.verificationId}-report`
            );
            reportURI = ipfsCID;
            // The verificationReportURI is returned to the frontend to sign
            await verification.save();
        } catch (ipfsErr) {
            logger.warn({ err: ipfsErr, verificationId: verification.verificationId }, 'IPFS upload failed for verification report — using fallback URI');
        }
    }

    res.status(200).json({
        success: true,
        data: { submission, verification, reportURI },
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
