import { Request, Response } from 'express';
import Verification from '../models/Verification';
import Submission from '../models/Submission';
import Project from '../models/Project';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { generateVerificationId } from '../utils/generateId';
import { SubmissionStatus, VerificationStatus } from '../types';
import { logger } from '../utils/logger';
import { logAudit } from '../services/audit.service';
import { AuditAction } from '../models/AuditLog';

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

export const reviewSubmission = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    const { submissionId } = req.params;
    const { status, approvedCredits, remarks } = req.body;

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

    if (status === 'Approved') {
        submission.status = SubmissionStatus.APPROVED;
    } else if (status === 'NeedsCorrection') {
        submission.status = SubmissionStatus.NEEDS_CORRECTION;
    } else {
        submission.status = SubmissionStatus.REJECTED;
    }
    submission.validatorComments = remarks || '';
    await submission.save();

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

        if (status === 'Approved' && approvedCredits) {
            await Project.findOneAndUpdate(
                { projectId: submission.projectId },
                { $inc: { totalCarbonCredits: approvedCredits } }
            );
        }

    }

    logger.info({ submissionId, status, approvedCredits }, 'Submission reviewed');

    const auditAction = status === 'Approved' ? AuditAction.SUBMISSION_VERIFIED : AuditAction.SUBMISSION_REJECTED;
    logAudit(auditAction, req.user.walletAddress, `Submission ${submissionId} ${status.toLowerCase()}${approvedCredits ? ` (${approvedCredits} credits)` : ''}`, {
        targetId: submissionId as string,
        meta: { projectId: submission.projectId, status, approvedCredits, remarks },
    });

    res.status(200).json({
        success: true,
        data: {
            submission,
            verification,
        },
    });
});
