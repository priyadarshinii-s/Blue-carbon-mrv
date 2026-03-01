import { Request, Response } from 'express';
import Project from '../models/Project';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { generateProjectId } from '../utils/generateId';
import { UserRole } from '../types';
import { logger } from '../utils/logger';
import { logAudit } from '../services/audit.service';
import { AuditAction } from '../models/AuditLog';

export const createProject = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    const projectId = generateProjectId();

    const projectData = {
        ...req.body,
        projectId,
        ownerWallet: req.user.walletAddress,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    };

    const project = await Project.create(projectData);

    logger.info({ projectId: project.projectId }, 'Project created');

    logAudit(AuditAction.PROJECT_CREATED, req.user.walletAddress, `Project "${project.projectName}" created`, {
        targetId: project.projectId,
        meta: { projectName: project.projectName, projectType: project.projectType },
    });

    res.status(201).json({
        success: true,
        data: { project },
    });
});

export const getProjects = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    let filter: Record<string, unknown> = {};

    if (req.user.role === UserRole.ADMIN) {

    } else if (req.user.role === UserRole.FIELD_OFFICER) {
        filter = { assignedFieldOfficer: req.user.walletAddress };
    } else if (req.user.role === UserRole.VALIDATOR) {
        filter = { assignedValidator: req.user.walletAddress };
    } else {

        filter = { ownerWallet: req.user.walletAddress };
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    if (req.query.status) {
        filter.status = req.query.status;
    }

    const [projects, total] = await Promise.all([
        Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Project.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: {
            projects,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
    });
});

export const getProject = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const project = await Project.findOne({ projectId: req.params.id });
    if (!project) {
        throw new NotFoundError('Project not found.');
    }

    res.status(200).json({
        success: true,
        data: { project },
    });
});

export const updateProject = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const project = await Project.findOneAndUpdate(
        { projectId: req.params.id },
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!project) {
        throw new NotFoundError('Project not found.');
    }

    logger.info({ projectId: project.projectId }, 'Project updated');

    logAudit(AuditAction.PROJECT_UPDATED, req.user?.walletAddress || 'system', `Project "${project.projectName}" updated`, {
        targetId: project.projectId,
        meta: { updatedFields: Object.keys(req.body) },
    });

    res.status(200).json({
        success: true,
        data: { project },
    });
});

export const getPublicProjects = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const projects = await Project.find({ status: { $in: ['ACTIVE', 'COMPLETED'] } })
        .select('projectId projectName projectType location approximateAreaHa status totalCarbonCredits createdAt')
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json({
        success: true,
        data: { projects },
    });
});
