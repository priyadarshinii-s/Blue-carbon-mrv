import mongoose, { Schema } from 'mongoose';
import { ITokenData } from '../types';

const tokenDataSchema = new Schema<ITokenData>(
    {
        projectId: {
            type: String,
            required: [true, 'Project ID is required'],
            index: true,
        },
        year: {
            type: String,
            required: [true, 'Year is required'],
        },
        tokenId: {
            type: Number,
        },
        mintedAmount: {
            type: Number,
            required: [true, 'Minted amount is required'],
            min: [0, 'Minted amount must be non-negative'],
        },
        retiredAmount: {
            type: Number,
            default: 0,
            min: [0, 'Retired amount must be non-negative'],
        },
        metadataIPFS: { type: String },
        mintTxHash: { type: String },
    },
    {
        timestamps: true,
        toJSON: { versionKey: false },
    }
);

tokenDataSchema.index({ projectId: 1, year: 1 });
tokenDataSchema.index({ tokenId: 1 });

const TokenData = mongoose.model<ITokenData>('TokenData', tokenDataSchema);
export default TokenData;
