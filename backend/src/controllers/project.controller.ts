import { Request, Response } from 'express';
import { ethers } from 'ethers';
import mongoose from 'mongoose';
import Project from '../models/Project';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { generateProjectId } from '../utils/generateId';
import { UserRole } from '../types';
import { logger } from '../utils/logger';
import { logAudit } from '../services/audit.service';
import { AuditAction } from '../models/AuditLog';
import {
    registerProjectOnChain,
    isBlockchainConfigured,
    queryProjectEvents,
    getProjectLifecycleStateOnChain,
} from '../services/blockchain.service';
import { getExplorerTxUrl } from '../controllers/admin.controller';
import { uploadJSONToIPFS } from '../services/ipfs.service';

// ──────────────────────────────────────────────────────────────
// TRIGGER 1 — POST /projects
// ──────────────────────────────────────────────────────────────
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

    // ── Step 1: Create in MongoDB first (source of truth) ──
    const project = await Project.create(projectData);

    logger.info({ projectId: project.projectId }, 'Project created in MongoDB');

    // Log the creation before attempting the blockchain call
    logAudit(AuditAction.PROJECT_CREATED, req.user.walletAddress, `Project "${project.projectName}" created`, {
        targetId: project.projectId,
        meta: { projectName: project.projectName, projectType: project.projectType },
    });

    // ── Step 2: Register on-chain (non-blocking to the HTTP response) ──
    // We attempt the blockchain call but NEVER roll back the MongoDB document
    // on failure — the DB is the source of truth; on-chain is eventually consistent.
    const blockchainEnabled = await isBlockchainConfigured();

    if (blockchainEnabled) {
        // Idempotency guard: project is brand-new so onChainTxHash will always be unset here,
        // but the guard pattern is established for retry scenarios (e.g. server restart mid-tx).
        if (!project.onChainTxHash) {
            try {
                // Build an IPFS metadata URI if possible; fall back to a placeholder URI.
                // The URI just needs to be non-empty for the contract.
                let metadataURI = `mrv://project/${projectId}`;
                try {
                    const ipfsCID = await uploadJSONToIPFS(
                        {
                            projectId,
                            projectName: project.projectName,
                            projectType: project.projectType,
                            location: project.location,
                            createdAt: project.createdAt,
                        },
                        `${projectId}-registration`
                    );
                    metadataURI = ipfsCID; // IPFS CID / URI from Pinata
                } catch (ipfsErr) {
                    // IPFS failure is non-fatal — use the placeholder URI
                    logger.warn({ err: ipfsErr, projectId }, 'IPFS upload failed for project registration metadata — using fallback URI');
                }

                const receipt = await registerProjectOnChain(
                    projectId,
                    req.user.walletAddress,
                    metadataURI
                );

                // ── Step 3: Update MongoDB ONLY after confirmed tx ──
                const explorerUrl = getExplorerTxUrl(receipt.txHash);

                await Project.findOneAndUpdate(
                    { projectId },
                    {
                        $set: {
                            onChainTxHash: receipt.txHash,
                            registeredBlock: receipt.blockNumber,
                        },
                        $push: {
                            blockchainTxHistory: {
                                action: 'PROJECT_REGISTERED',
                                txHash: receipt.txHash,
                                explorerUrl,
                                blockNumber: receipt.blockNumber,
                                timestamp: new Date(),
                            },
                        },
                    }
                );

                // Refresh the response object to include tx data
                project.onChainTxHash = receipt.txHash;
                project.registeredBlock = receipt.blockNumber;

                logger.info(
                    { projectId, txHash: receipt.txHash, blockNumber: receipt.blockNumber },
                    'Project registered on-chain'
                );

                logAudit(
                    AuditAction.PROJECT_REGISTERED_ON_CHAIN,
                    req.user.walletAddress,
                    `Project "${project.projectName}" registered on-chain`,
                    {
                        targetId: projectId,
                        txHash: receipt.txHash,
                        meta: {
                            blockNumber: receipt.blockNumber,
                            gasUsed: receipt.gasUsed,
                            metadataURI,
                        },
                    }
                );
            } catch (blockchainErr: unknown) {
                // ── On-chain failure: log to AuditLog, do NOT throw ──
                // The project exists in MongoDB and is usable;
                // retrying registration can be done via admin tooling.
                const errorMsg = blockchainErr instanceof Error
                    ? blockchainErr.message
                    : 'Unknown blockchain error';

                logger.error(
                    { err: blockchainErr, projectId },
                    'On-chain project registration failed — MongoDB state preserved'
                );

                logAudit(
                    AuditAction.BLOCKCHAIN_TX_FAILED,
                    req.user.walletAddress,
                    `On-chain registration failed for project ${projectId}: ${errorMsg}`,
                    {
                        targetId: projectId,
                        meta: { trigger: 'registerProject', error: errorMsg },
                    }
                );
            }
        } else {
            logger.info({ projectId, onChainTxHash: project.onChainTxHash }, 'Project already registered on-chain — skipping');
        }
    } else {
        logger.warn({ projectId }, 'Blockchain not configured — skipping on-chain registration');
    }

    res.status(201).json({
        success: true,
        data: { project },
    });
});

// ──────────────────────────────────────────────────────────────
// GET /projects
// ──────────────────────────────────────────────────────────────
export const getProjects = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    let filter: Record<string, unknown> = {};

    if (req.user.role === UserRole.ADMIN) {
        // Admin sees all projects
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

// ──────────────────────────────────────────────────────────────
// GET /projects/:id
// ──────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────
// PATCH /projects/:id
// ──────────────────────────────────────────────────────────────
export const updateProject = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const updateData = { ...req.body };

    if (updateData.assignedFieldOfficer !== undefined) {
        updateData.fieldOfficerAssignedAt = updateData.assignedFieldOfficer ? new Date() : null;
    }
    if (updateData.assignedValidator !== undefined) {
        updateData.validatorAssignedAt = updateData.assignedValidator ? new Date() : null;
    }

    const project = await Project.findOneAndUpdate(
        { projectId: req.params.id },
        { $set: updateData },
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

// ──────────────────────────────────────────────────────────────
// GET /projects/public
// ──────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────
// GET /projects/map-pins
// ──────────────────────────────────────────────────────────────
export const getPublicMapPins = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const projects = await Project.aggregate([
        { $match: { status: { $in: ['ACTIVE', 'COMPLETED', 'VALIDATED', 'SUBMITTED', 'PENDING'] } } },
        {
            $lookup: {
                from: 'submissions',
                localField: 'projectId',
                foreignField: 'projectId',
                as: 'submissions'
            }
        },
        {
            $project: {
                projectId: 1,
                projectName: 1,
                status: 1,
                submissionWithGps: {
                    $arrayElemAt: [
                        { $filter: { input: '$submissions', as: 'sub', cond: { $and: [{ $ne: ['$$sub.gps.lat', null] }, { $ne: ['$$sub.gps.lng', null] }] } } },
                        0
                    ]
                }
            }
        },
        { $match: { submissionWithGps: { $ne: null } } }
    ]);

    const pins = projects.map(p => ({
        lat: p.submissionWithGps.gps.lat,
        lng: p.submissionWithGps.gps.lng,
        label: `${p.projectName} (${p.status})`
    }));

    res.status(200).json({
        success: true,
        data: { pins },
    });
});
// ──────────────────────────────────────────────────────────────
// GET /projects/:id/on-chain-events
// ──────────────────────────────────────────────────────────────
export const getProjectOnChainEvents = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;

    // Accept either MongoDB _id or projectId — only include _id in query
    // when the string is a valid ObjectId, otherwise Mongoose throws CastError
    const orConditions: Record<string, unknown>[] = [{ projectId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: id });
    }
    const project = await Project.findOne({ $or: orConditions }).select('projectId projectName');
    if (!project) {
        throw new NotFoundError('Project not found.');
    }

    const blockchainEnabled = await isBlockchainConfigured();
    if (!blockchainEnabled) {
        res.status(200).json({
            success: true,
            data: {
                projectId: project.projectId,
                events: [],
                lifecycleState: null,
                message: 'Blockchain not configured — no on-chain data available',
            },
        });
        return;
    }

    const [events, lifecycleState] = await Promise.all([
        queryProjectEvents(project.projectId),
        getProjectLifecycleStateOnChain(project.projectId).catch(() => null),
    ]);

    logger.info(
        { projectId: project.projectId, eventCount: events.length },
        'On-chain events fetched for project'
    );

    res.status(200).json({
        success: true,
        data: {
            projectId: project.projectId,
            projectName: project.projectName,
            events,
            lifecycleState,
        },
    });
});
