import { Request, Response } from 'express';
import Submission from '../models/Submission';
import Project from '../models/Project';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { generateSubmissionId } from '../utils/generateId';
import { UserRole } from '../types';
import { logger } from '../utils/logger';

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

    if (project.status !== 'ACTIVE') {
        throw new BadRequestError('Submissions can only be made for ACTIVE projects.');
    }

    const submissionId = generateSubmissionId();

    const submission = await Submission.create({
        ...req.body,
        submissionId,
        fieldOfficerWallet: req.user.walletAddress,
        visitDate: new Date(req.body.visitDate),
    });

    logger.info({ submissionId, projectId }, 'Field data submitted');

    res.status(201).json({
        success: true,
        data: { submission },
    });
});

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
