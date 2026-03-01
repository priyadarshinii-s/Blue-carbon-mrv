import mongoose, { Schema } from 'mongoose';

export enum AuditAction {
    DATA_SUBMITTED = 'DATA_SUBMITTED',
    SUBMISSION_VERIFIED = 'SUBMISSION_VERIFIED',
    SUBMISSION_REJECTED = 'SUBMISSION_REJECTED',
    CREDIT_MINTED = 'CREDIT_MINTED',
    CREDIT_RETIRED = 'CREDIT_RETIRED',
    PROJECT_CREATED = 'PROJECT_CREATED',
    PROJECT_UPDATED = 'PROJECT_UPDATED',
    ROLE_CHANGED = 'ROLE_CHANGED',
    USER_APPROVED = 'USER_APPROVED',
}

export interface IAuditLog {
    timestamp: Date;
    action: AuditAction;
    userEmail: string;
    walletAddress: string;
    txHash?: string;
    details: string;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        timestamp: { type: Date, default: Date.now, index: true },
        action: {
            type: String,
            enum: Object.values(AuditAction),
            required: true,
            index: true
        },
        userEmail: { type: String, required: true },
        walletAddress: { type: String, required: true, lowercase: true, index: true },
        txHash: { type: String },
        details: { type: String, required: true },
    },
    {
        timestamps: false,
        toJSON: { versionKey: false },
    }
);

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
