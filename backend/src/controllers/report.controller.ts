import { Request, Response } from 'express';
import Project from '../models/Project';
import Submission from '../models/Submission';
import Verification from '../models/Verification';
import TokenData from '../models/TokenData';
import User from '../models/User';
import { UserRole } from '../types';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const exportCSV = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.query;
    if (!projectId) {
        throw new BadRequestError('projectId query parameter is required.');
    }

    const project = await Project.findOne({ projectId: projectId as string });
    if (!project) {
        throw new BadRequestError('Project not found.');
    }

    const submissions = await Submission.find({ projectId: projectId as string })
        .sort({ visitDate: 1 });

    const verifications = await Verification.find({ projectId: projectId as string });

    const headers = [
        'Submission ID', 'Visit Date', 'Field Officer', 'Surviving Trees',
        'Survival Rate (%)', 'GPS Lat', 'GPS Lng', 'Status', 'Validator Comments',
        'Approved Credits', 'Verification Status',
    ];

    const rows = submissions.map((sub) => {
        const ver = verifications.find((v) => v.submissionId === sub.submissionId);
        return [
            sub.submissionId,
            sub.visitDate?.toISOString() || '',
            sub.fieldOfficerWallet,
            sub.survivingTrees?.toString() || '',
            sub.survivalRate?.toString() || '',
            sub.gps?.lat?.toString() || '',
            sub.gps?.lng?.toString() || '',
            sub.status,
            sub.validatorComments || '',
            ver?.approvedCredits?.toString() || '',
            ver?.status || '',
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${projectId}-report.csv"`);
    res.status(200).send(csvContent);
});

export const getNDCReport = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const projectStats = await Project.aggregate([
        { $match: { status: { $in: ['ACTIVE', 'COMPLETED'] } } },
        {
            $group: {
                _id: '$projectType',
                totalProjects: { $sum: 1 },
                totalAreaHa: { $sum: { $ifNull: ['$approximateAreaHa', 0] } },
                totalCredits: { $sum: '$totalCarbonCredits' },
            },
        },
    ]);

    const totalSubmissions = await Submission.countDocuments();
    const approvedSubmissions = await Submission.countDocuments({ status: 'Approved' });

    const totalMinted = await TokenData.aggregate([
        { $group: { _id: null, total: { $sum: '$mintedAmount' } } },
    ]);

    const totalRetired = await TokenData.aggregate([
        { $group: { _id: null, total: { $sum: '$retiredAmount' } } },
    ]);

    res.status(200).json({
        success: true,
        data: {
            byEcosystem: projectStats,
            submissions: {
                total: totalSubmissions,
                approved: approvedSubmissions,
            },
            tokens: {
                totalMinted: totalMinted[0]?.total || 0,
                totalRetired: totalRetired[0]?.total || 0,
            },
            generatedAt: new Date().toISOString(),
        },
    });
});

export const getDashboardStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const stats: Record<string, any> = {};

    if (req.user) {
        const { role, walletAddress } = req.user;

        if (role === 'ADMIN') {
            const [totalProjects, totalUsers, pendingSubmissions, totalCredits, activeFieldOfficers] = await Promise.all([
                Project.countDocuments(),
                User.countDocuments(),
                Submission.countDocuments({ status: 'Pending' }),
                Project.aggregate([{ $group: { _id: null, total: { $sum: '$totalCarbonCredits' } } }]),
                User.countDocuments({ role: 'FIELD_OFFICER' }),
            ]);

            stats.projects = totalProjects;
            stats.users = totalUsers;
            stats.activeFieldOfficers = activeFieldOfficers;
            stats.pendingSubmissions = pendingSubmissions;
            stats.totalCredits = totalCredits[0]?.total || 0;
        } else if (role === UserRole.FIELD_OFFICER || (role as string) === 'FIELD') {
            const [assignedProjects, mySubmissions, pendingApproval] = await Promise.all([
                Project.countDocuments({ assignedFieldOfficer: walletAddress.toLowerCase() }),
                Submission.countDocuments({ fieldOfficerWallet: walletAddress.toLowerCase() }),
                Submission.countDocuments({ fieldOfficerWallet: walletAddress.toLowerCase(), status: 'Pending' }),
            ]);

            stats.assignedProjects = assignedProjects;
            stats.mySubmissions = mySubmissions;
            stats.pendingApproval = pendingApproval;
        }
        else if (role === 'VALIDATOR') {
            const assignedProjects = await Project.find({ assignedValidator: walletAddress }).select('projectId');
            const projectIds = assignedProjects.map((p) => p.projectId);

            const [queueSize, verifiedTotal, rejectedTotal] = await Promise.all([
                Submission.countDocuments({ projectId: { $in: projectIds }, status: 'Pending' }),
                Verification.countDocuments({ validatorWallet: walletAddress, status: 'Approved' }),
                Verification.countDocuments({ validatorWallet: walletAddress, status: 'Rejected' }),
            ]);

            let avgReviewTimeMs = 0;
            const verifications = await Verification.find({ validatorWallet: walletAddress }).select('submissionId createdAt').lean();
            if (verifications.length > 0) {
                const subIds = verifications.map(v => v.submissionId);
                const submissions = await Submission.find({ submissionId: { $in: subIds } }).select('submissionId createdAt').lean();
                const subMap: Record<string, Date> = {};
                submissions.forEach(s => { subMap[s.submissionId] = s.createdAt; });

                let totalMs = 0;
                let count = 0;
                verifications.forEach(v => {
                    const subDate = subMap[v.submissionId];
                    if (subDate && v.createdAt) {
                        totalMs += new Date(v.createdAt).getTime() - new Date(subDate).getTime();
                        count++;
                    }
                });
                if (count > 0) avgReviewTimeMs = totalMs / count;
            }

            stats.queueSize = queueSize;
            stats.verifiedTotal = verifiedTotal;
            stats.rejectedTotal = rejectedTotal;
            stats.avgReviewTimeMs = avgReviewTimeMs;
        }
    }

    const [publicProjects, globalCredits] = await Promise.all([
        Project.countDocuments({ status: 'ACTIVE' }),
        Project.aggregate([
            { $match: { status: 'ACTIVE' } },
            { $group: { _id: null, total: { $sum: '$totalCarbonCredits' } } }
        ]),
    ]);

    stats.community = {
        activeProjects: publicProjects,
        totalGlobalCredits: globalCredits[0]?.total || 0,
    };

    res.status(200).json({
        success: true,
        data: stats,
    });
});

export const getLedgerReport = catchAsync(async (_req: Request, res: Response): Promise<void> => {

    const ledger = await TokenData.aggregate([
        {
            $group: {
                _id: { projectId: '$projectId', year: '$year' },
                totalMinted: { $sum: '$mintedAmount' },
                totalRetired: { $sum: '$retiredAmount' }
            }
        },
        {
            $lookup: {
                from: 'projects',
                localField: '_id.projectId',
                foreignField: 'projectId',
                as: 'projectData'
            }
        },
        { $unwind: '$projectData' },
        {
            $project: {
                _id: 0,
                projectId: '$_id.projectId',
                projectName: '$projectData.projectName',
                year: '$_id.year',
                projectType: '$projectData.projectType',
                credits: '$totalMinted',
                retired: '$totalRetired',
                status: {
                    $cond: { if: { $gt: ['$totalRetired', 0] }, then: 'retired', else: 'minted' }
                }
            }
        },
        { $sort: { year: -1, projectName: 1 } }
    ]);

    res.status(200).json({
        success: true,
        data: ledger,
    });
});

export const getPerformanceReport = catchAsync(async (_req: Request, res: Response): Promise<void> => {

    const performance = await Submission.aggregate([
        {
            $group: {
                _id: '$fieldOfficerWallet',
                totalSubmissions: { $sum: 1 },
                approved: {
                    $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
                },
                rejected: {
                    $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
                },
                pending: {
                    $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: 'walletAddress',
                as: 'userData'
            }
        },
        { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                wallet: '$_id',
                name: { $ifNull: ['$userData.userName', '$_id'] },
                totalSubmissions: 1,
                approved: 1,
                rejected: 1,
                pending: 1,
                approvalRate: {
                    $cond: [
                        { $gt: ['$totalSubmissions', 0] },
                        { $multiply: [{ $divide: ['$approved', '$totalSubmissions'] }, 100] },
                        0
                    ]
                }
            }
        },
        { $sort: { totalSubmissions: -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: performance,
    });
});

import AuditLog from '../models/AuditLog';

export const getAuditLogs = catchAsync(async (_req: Request, res: Response): Promise<void> => {

    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);

    res.status(200).json({
        success: true,
        data: logs,
    });
});

export const getUserCredits = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    const userProjects = await Project.find({
        $or: [
            { ownerWallet: req.user.walletAddress },
            { assignedFieldOfficer: req.user.walletAddress },
        ]
    }).select('projectId projectName');

    const projectIds = userProjects.map(p => p.projectId);
    const projectMap: Record<string, string> = {};
    userProjects.forEach(p => { projectMap[p.projectId] = p.projectName; });

    const tokens = await TokenData.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 });

    const credits = tokens.map(t => ({
        id: t._id,
        project: projectMap[t.projectId] || t.projectId,
        projectId: t.projectId,
        amount: t.mintedAmount,
        retired: t.retiredAmount || 0,
        txHash: t.mintTxHash || '',
        date: t.createdAt,
        status: (t.retiredAmount || 0) >= t.mintedAmount ? 'retired' : 'active',
    }));

    res.status(200).json({
        success: true,
        data: credits,
    });
});

export const getVerificationHistory = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('User required');
    }

    const verifications = await Verification.find({
        validatorWallet: req.user.walletAddress,
    }).sort({ createdAt: -1 });

    const projectIds = [...new Set(verifications.map(v => v.projectId))];
    const projects = await Project.find({ projectId: { $in: projectIds } }).select('projectId projectName');
    const projectMap: Record<string, string> = {};
    projects.forEach(p => { projectMap[p.projectId] = p.projectName; });

    const history = verifications.map(v => ({
        id: v._id,
        verificationId: v.verificationId,
        projectId: v.projectId,
        projectName: projectMap[v.projectId] || v.projectId,
        submissionId: v.submissionId,
        status: v.status,
        approvedCredits: v.approvedCredits || 0,
        remarks: v.remarks || '',
        date: v.createdAt,
    }));

    res.status(200).json({
        success: true,
        data: history,
    });
});

