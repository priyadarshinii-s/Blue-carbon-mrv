import mongoose, { Schema } from 'mongoose';
import { IProject, ProjectType, ProjectStatus } from '../types';

const projectSchema = new Schema<IProject>(
    {
        projectId: {
            type: String,
            unique: true,
            required: [true, 'Project ID is required'],
            index: true,
        },
        ownerWallet: {
            type: String,
            ref: 'User',
            required: [true, 'Owner wallet is required'],
            lowercase: true,
            index: true,
        },
        projectName: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
            maxlength: [200, 'Project name cannot exceed 200 characters'],
        },
        projectType: {
            type: String,
            enum: Object.values(ProjectType),
            required: [true, 'Project type is required'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
        },
        location: {
            type: String,
            trim: true,
        },
        geofence: {
            type: {
                type: String,
                enum: ['Polygon'],
            },
            coordinates: {
                type: [[[Number]]],
            },
        },
        approximateAreaHa: {
            type: Number,
            min: [0, 'Area must be positive'],
        },
        ecosystemTypes: [{ type: String, trim: true }],
        baselinePhotos: [{ type: String }],
        baselineVideos: [{ type: String }],
        plannedActivities: [{ type: String, trim: true }],
        startDate: { type: Date },
        endDate: { type: Date },
        status: {
            type: String,
            enum: Object.values(ProjectStatus),
            default: ProjectStatus.PENDING,
        },
        assignedFieldOfficer: {
            type: String,
            ref: 'User',
            lowercase: true,
        },
        fieldOfficerAssignedAt: { type: Date },
        assignedValidator: {
            type: String,
            ref: 'User',
            lowercase: true,
        },
        validatorAssignedAt: { type: Date },
        blockchainProjectHash: { type: String },
        // ── Blockchain lifecycle fields ──
        onChainTxHash: {
            type: String,
            // Set after registerProject() tx is confirmed (Trigger 1)
            // Used as idempotency guard: skip re-registration if already set
        },
        registeredBlock: {
            type: Number,
            // Block number at which the project was registered on-chain
        },
        totalCarbonCredits: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalMinted: {
            type: Number,
            default: 0,
            min: 0,
        },
        onChainMinted: {
            type: Boolean,
            default: false,
        },
        blockchainTxHistory: [{
            action: { type: String, required: true },   // e.g. 'PROJECT_REGISTERED', 'FIELD_OFFICER_ASSIGNED', etc.
            txHash: { type: String, required: true },
            explorerUrl: { type: String },
            blockNumber: { type: Number },
            timestamp: { type: Date, default: Date.now },
        }],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true, versionKey: false },
    }
);

projectSchema.index({ status: 1 });
projectSchema.index({ projectType: 1 });
projectSchema.index({ assignedFieldOfficer: 1 });
projectSchema.index({ assignedValidator: 1 });
projectSchema.index({ geofence: '2dsphere' });

const Project = mongoose.model<IProject>('Project', projectSchema);
export default Project;
