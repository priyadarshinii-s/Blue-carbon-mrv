import mongoose, { Schema } from 'mongoose';
import { ISubmission, SubmissionStatus } from '../types';

const submissionSchema = new Schema<ISubmission>(
    {
        submissionId: {
            type: String,
            unique: true,
            required: [true, 'Submission ID is required'],
            index: true,
        },
        projectId: {
            type: String,
            ref: 'Project',
            required: [true, 'Project ID is required'],
            index: true,
        },
        fieldOfficerWallet: {
            type: String,
            required: [true, 'Field officer wallet is required'],
            lowercase: true,
            index: true,
        },
        visitDate: {
            type: Date,
            required: [true, 'Visit date is required'],
        },
        survivingTrees: {
            type: Number,
            min: [0, 'Surviving trees must be non-negative'],
        },
        survivalRate: {
            type: Number,
            min: [0, 'Survival rate must be at least 0'],
            max: [100, 'Survival rate cannot exceed 100'],
        },
        gps: {
            lat: { type: Number },
            lng: { type: Number },
        },
        currentPhotos: [{ type: String }],
        currentVideos: [{ type: String }],
        siteCondition: {
            type: Schema.Types.Mixed,
            default: {},
        },
        restorationLog: {
            type: Schema.Types.Mixed,
            default: {},
        },
        carbonInputs: {
            type: Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: Object.values(SubmissionStatus),
            default: SubmissionStatus.PENDING,
        },
        validatorComments: { type: String, trim: true },
        blockchainSubmissionHash: { type: String },
    },
    {
        timestamps: true,
        toJSON: { versionKey: false },
    }
);

submissionSchema.index({ status: 1 });
submissionSchema.index({ projectId: 1, status: 1 });

const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
export default Submission;
