import { Request, Response } from 'express';
import User from '../models/User';
import { signToken } from '../config/jwt';
import { verifyWalletSignature } from '../services/walletVerify.service';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/AppError';
import { IJwtPayload, UserRole, UserStatus } from '../types';
import { logger } from '../utils/logger';

export const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { walletAddress, userName, email, phone, organization } = req.body;

    const existingUser = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existingUser) {
        throw new ConflictError('Wallet address is already registered.');
    }

    if (email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            throw new ConflictError('Email is already registered.');
        }
    }

    const user = await User.create({
        walletAddress: walletAddress.toLowerCase(),
        userName,
        email: email?.toLowerCase(),
        phone,
        organization,
    });

    const payload: IJwtPayload = {
        userId: (user._id as unknown as string).toString(),
        walletAddress: user.walletAddress,
        role: user.role as UserRole,
    };
    const token = signToken(payload);

    logger.info({ walletAddress: user.walletAddress }, 'New user registered');

    res.status(201).json({
        success: true,
        data: {
            user,
            token,
        },
    });
});

export const loginWallet = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { walletAddress, message, signature } = req.body;

    const recoveredAddress = verifyWalletSignature(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedError('Signature verification failed. Wallet address mismatch.');
    }

    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    const adminWalletEnv = process.env.ADMIN_WALLET?.toLowerCase();
    if (!user && adminWalletEnv && walletAddress.toLowerCase() === adminWalletEnv) {
        logger.info({ walletAddress }, 'Auto-registering admin wallet from environment variable');
        user = await User.create({
            walletAddress: walletAddress.toLowerCase(),
            userName: 'NCCR Admin',
            email: 'admin@nccr.gov.in',
            role: UserRole.ADMIN,
            status: UserStatus.APPROVED,
        });
    }

    if (!user) {
        throw new NotFoundError('Wallet not registered. Please register first.');
    }

    const payload: IJwtPayload = {
        userId: (user._id as unknown as string).toString(),
        walletAddress: user.walletAddress,
        role: user.role as UserRole,
    };
    const token = signToken(payload);

    logger.info({ walletAddress: user.walletAddress }, 'User logged in via wallet');

    res.status(200).json({
        success: true,
        data: {
            user,
            token,
        },
    });
});

export const loginDemo = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { role } = req.body;

    let userRole = UserRole.USER;
    if (role === 'ADMIN') userRole = UserRole.ADMIN;
    if (role === 'FIELD' || role === 'FIELD_OFFICER') userRole = UserRole.FIELD_OFFICER;
    if (role === 'VALIDATOR') userRole = UserRole.VALIDATOR;
    if (role === 'USER') userRole = UserRole.USER;

    const demoWallets: Record<string, string> = {
        ADMIN: '0x7a3B9f2E0000000000000000000000000000002E',
        FIELD_OFFICER: '0x8b4C3a4B00000000000000000000000000004B00',
        VALIDATOR: '0x9c5D4a5C00000000000000000000000000005C00',
        USER: '0x0d6E5a6D00000000000000000000000000006D00'
    };
    const wallet = demoWallets[userRole] || demoWallets.USER;

    let user = await User.findOne({ walletAddress: wallet.toLowerCase() });

    if (!user) {
        user = await User.create({
            walletAddress: wallet.toLowerCase(),
            userName: `Demo ${userRole}`,
            email: `demo-${userRole.toLowerCase()}@example.com`,
            role: userRole,
            status: UserStatus.APPROVED
        });
    }

    const payload: IJwtPayload = {
        userId: (user._id as unknown as string).toString(),
        walletAddress: user.walletAddress,
        role: user.role as UserRole,
    };
    const token = signToken(payload);

    res.status(200).json({
        success: true,
        data: { user, token }
    });
});

export const getMe = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new UnauthorizedError('Not authenticated.');
    }

    res.status(200).json({
        success: true,
        data: { user: req.user },
    });
});
