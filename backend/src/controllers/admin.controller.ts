import { Request, Response } from 'express';
import User from '../models/User';
import Project from '../models/Project';
import Verification from '../models/Verification';
import TokenData from '../models/TokenData';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import { UserRole } from '../types';
import { generateTokenId } from '../utils/generateId';
import { uploadJSONToIPFS } from '../services/ipfs.service';
import { logger } from '../utils/logger';

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

export const updateUserRole = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
        throw new NotFoundError('User not found.');
    }

    user.role = role;
    await user.save();

    logger.info({ userId: req.params.id, newRole: role }, 'User role updated');

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
    } else if (role === 'VALIDATOR') {
        project.assignedValidator = user.walletAddress;
    }

    await project.save();

    logger.info({ userId: req.params.id, projectId, role }, 'User assigned to project');

    res.status(200).json({
        success: true,
        data: { project },
    });
});

export const getMintQueue = catchAsync(async (_req: Request, res: Response): Promise<void> => {

    const projects = await Project.find({
        totalCarbonCredits: { $gt: 0 },
        status: { $in: ['ACTIVE', 'COMPLETED'] },
    }).sort({ totalCarbonCredits: -1 });

    const mintQueue = await Promise.all(
        projects.map(async (project) => {
            const mintedTokens = await TokenData.find({ projectId: project.projectId });
            const totalMinted = mintedTokens.reduce((sum, t) => sum + t.mintedAmount, 0);
            const unmintedCredits = project.totalCarbonCredits - totalMinted;

            return {
                project,
                totalMinted,
                unmintedCredits,
                mintedTokens,
            };
        })
    );

    const filteredQueue = mintQueue.filter((item) => item.unmintedCredits > 0);

    res.status(200).json({
        success: true,
        data: { mintQueue: filteredQueue },
    });
});

export const mintCredits = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const { year, amount } = req.body;

    const project = await Project.findOne({ projectId });
    if (!project) {
        throw new NotFoundError('Project not found.');
    }

    const existingTokens = await TokenData.find({ projectId });
    const totalMinted = existingTokens.reduce((sum, t) => sum + t.mintedAmount, 0);
    const available = project.totalCarbonCredits - totalMinted;

    if (amount > available) {
        throw new BadRequestError(
            `Cannot mint ${amount} credits. Only ${available} unminted credits available.`
        );
    }

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

    const tokenData = await TokenData.create({
        projectId,
        year,
        mintedAmount: amount,
        metadataIPFS,

    });

    logger.info({ projectId, year, amount, metadataIPFS }, 'Credits minted (placeholder)');

    res.status(201).json({
        success: true,
        data: { tokenData },
    });
});
