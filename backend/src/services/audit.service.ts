import AuditLog, { AuditAction } from '../models/AuditLog';
import { logger } from '../utils/logger';

interface AuditOptions {
    txHash?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
}

export const logAudit = (
    action: AuditAction,
    walletAddress: string,
    details: string,
    options: AuditOptions = {}
): void => {
    AuditLog.create({
        action,
        walletAddress: walletAddress.toLowerCase(),
        userEmail: walletAddress.toLowerCase(),
        details,
        txHash: options.txHash || undefined,
        targetId: options.targetId || undefined,
        meta: options.meta || undefined,
    }).catch((err) => {
        logger.error({ err, action, walletAddress }, 'Failed to write audit log');
    });
};
