import { z } from 'zod';

export const registerSchema = z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address'),
    userName: z.string().min(2).max(100),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    organization: z.string().optional(),
});

export const loginWalletSchema = z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address'),
    message: z.string().min(1, 'Message is required'),
    signature: z.string().min(1, 'Signature is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginWalletInput = z.infer<typeof loginWalletSchema>;
