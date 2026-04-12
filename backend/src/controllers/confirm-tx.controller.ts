/**
 * confirm-tx.controller.ts
 *
 * Endpoints that accept a txHash from the frontend after the user's wallet
 * has signed and broadcast an on-chain transaction. Updates MongoDB with
 * the tx hash and block number.
 */

import { Request, Response } from 'express';
import Project from '../models/Project';
import Submission from '../models/Submission';
import Verification from '../models/Verification';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { logAudit } from '../services/audit.service';
import { AuditAction } from '../models/AuditLog';

const EXPLORER_BASE = 'https://amoy.polygonscan.com';
const explorerTxUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;


// ─────────────────────────────────────────────────────────────
// CONFIRM TX — Project Registration (Trigger 1)
// POST /api/projects/:id/confirm-tx
// ─────────────────────────────────────────────────────────────
export const confirmProjectTx = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { txHash, blockNumber } = req.body;
    const id = req.params.id as string; // projectId

    if (!txHash) throw new BadRequestError('txHash is required');

    const project = await Project.findOne({ projectId: id });
    if (!project) throw new NotFoundError(`Project ${id} not found`);

    // Update MongoDB with the confirmed transaction
    await Project.findOneAndUpdate(
        { projectId: id },
        {
            $set: {
                onChainTxHash: txHash,
                registeredBlock: blockNumber || 0,
            },
            $push: {
                blockchainTxHistory: {
                    action: 'PROJECT_REGISTERED',
                    txHash,
                    explorerUrl: explorerTxUrl(txHash),
                    blockNumber: blockNumber || 0,
                    timestamp: new Date(),
                },
            },
        }
    );

    logger.info({ projectId: id, txHash }, 'Project on-chain tx confirmed by frontend');

    logAudit(
        AuditAction.PROJECT_REGISTERED_ON_CHAIN,
        req.user?.walletAddress || 'unknown',
        `Project "${project.projectName}" registered on-chain (wallet-signed)`,
        {
            targetId: id,
            txHash,
            meta: { blockNumber, source: 'wallet-signed' },
        }
    );

    res.status(200).json({ success: true, data: { txHash, blockNumber } });
});


// ─────────────────────────────────────────────────────────────
// CONFIRM TX — Submission Anchoring (Trigger 2)
// POST /api/submissions/:id/confirm-tx
// ─────────────────────────────────────────────────────────────
export const confirmSubmissionTx = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { txHash, blockNumber } = req.body;
    const id = req.params.id as string; // submissionId

    if (!txHash) throw new BadRequestError('txHash is required');

    const submission = await Submission.findOne({
        $or: [{ submissionId: id }, { _id: id }],
    });
    if (!submission) throw new NotFoundError(`Submission ${id} not found`);

    await Submission.findByIdAndUpdate(submission._id, {
        $set: {
            anchorTxHash: txHash,
            anchorBlock: blockNumber || 0,
        },
    });

    logger.info({ submissionId: id, txHash }, 'Submission anchor tx confirmed by frontend');

    logAudit(
        AuditAction.SUBMISSION_ANCHORED_ON_CHAIN,
        req.user?.walletAddress || 'unknown',
        `Submission ${id} anchored on-chain (wallet-signed)`,
        {
            targetId: id,
            txHash,
            meta: { blockNumber, source: 'wallet-signed' },
        }
    );

    res.status(200).json({ success: true, data: { txHash, blockNumber } });
});


// ─────────────────────────────────────────────────────────────
// CONFIRM TX — Verification / Approval (Trigger 3)
// POST /api/verifications/:submissionId/confirm-tx
// ─────────────────────────────────────────────────────────────
export const confirmVerificationTx = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { txHash, blockNumber } = req.body;
    const submissionId = req.params.submissionId as string;

    if (!txHash) throw new BadRequestError('txHash is required');

    const verification = await Verification.findOne({
        $or: [{ submissionId }, { _id: submissionId }],
    }).sort({ createdAt: -1 });

    if (!verification) throw new NotFoundError(`Verification for ${submissionId} not found`);

    await Verification.findByIdAndUpdate(verification._id, {
        $set: {
            approvalTxHash: txHash,
            approvalBlock: blockNumber || 0,
        },
    });

    // Also update the project's blockchain tx history
    const submission = await Submission.findOne({
        $or: [{ submissionId }, { _id: submissionId }],
    });

    if (submission) {
        await Project.findOneAndUpdate(
            { projectId: submission.projectId },
            {
                $push: {
                    blockchainTxHistory: {
                        action: 'PROJECT_APPROVED',
                        txHash,
                        explorerUrl: explorerTxUrl(txHash),
                        blockNumber: blockNumber || 0,
                        timestamp: new Date(),
                    },
                },
            }
        );
    }

    logger.info({ submissionId, txHash }, 'Verification approval tx confirmed by frontend');

    res.status(200).json({ success: true, data: { txHash, blockNumber } });
});


// ─────────────────────────────────────────────────────────────
// CONFIRM TX — Minting (Trigger 4)
// POST /api/admin/mint/:projectId/confirm-tx
// ─────────────────────────────────────────────────────────────
import TokenData from '../models/TokenData';

export const confirmMintTx = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { txHash, blockNumber, amount, metadataIPFS, year } = req.body;
    const projectId = req.params.projectId as string;

    if (!txHash) throw new BadRequestError('txHash is required');

    const project = await Project.findOne({ projectId });
    if (!project) throw new NotFoundError(`Project ${projectId} not found`);

    // 1. Create TokenData record
    const tokenData = await TokenData.create({
        projectId,
        year,
        mintedAmount: amount,
        metadataIPFS,
        mintTxHash: txHash,
        onChainStatus: 'confirmed',
        blockNumber,
    });

    // 2. Update Project record
    const updateFields: Record<string, unknown> = {
        $inc: { totalMinted: amount || 0 },
    };

    const setFields: Record<string, unknown> = {
        onChainMinted: true
    };
    if (project.status === 'VALIDATED') {
        setFields.status = 'ACTIVE';
    }
    updateFields.$set = setFields;

    const explorerUrl = explorerTxUrl(txHash);
    updateFields.$push = {
        blockchainTxHistory: {
            action: 'CREDITS_MINTED',
            txHash,
            explorerUrl,
            blockNumber,
            timestamp: new Date(),
        },
    };

    await Project.findOneAndUpdate({ projectId }, updateFields);

    logger.info({ projectId, txHash, amount }, 'Mint tx confirmed by frontend');

    logAudit(
        AuditAction.CREDITS_MINTED_ON_CHAIN,
        req.user?.walletAddress || 'unknown',
        `Credits minted for project ${projectId} (wallet-signed)`,
        {
            targetId: projectId,
            txHash,
            meta: { amount, blockNumber, year, source: 'wallet-signed' },
        }
    );

    res.status(200).json({ success: true, data: { txHash, blockNumber, tokenData } });
});
