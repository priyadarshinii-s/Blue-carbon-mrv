import mongoose, { Schema } from 'mongoose';
import { IVerification, VerificationStatus } from '../types';

const verificationSchema = new Schema<IVerification>(
    {
        verificationId: {
            type: String,
            unique: true,
            required: [true, 'Verification ID is required'],
            index: true,
        },
        projectId: {
            type: String,
            ref: 'Project',
            required: [true, 'Project ID is required'],
            index: true,
        },
        submissionId: {
            type: String,
            ref: 'Submission',
            required: [true, 'Submission ID is required'],
            index: true,
        },
        validatorWallet: {
            type: String,
            required: [true, 'Validator wallet is required'],
            lowercase: true,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(VerificationStatus),
            required: [true, 'Verification status is required'],
        },
        approvedCredits: {
            type: Number,
            min: [0, 'Approved credits must be non-negative'],
        },
        remarks: {
            type: String,
            trim: true,
            maxlength: [2000, 'Remarks cannot exceed 2000 characters'],
        },
        blockchainVerificationHash: { type: String },
        finalized: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: { versionKey: false },
    }
);

verificationSchema.index({ projectId: 1, submissionId: 1 });
verificationSchema.index({ finalized: 1 });

const Verification = mongoose.model<IVerification>('Verification', verificationSchema);
export default Verification;
