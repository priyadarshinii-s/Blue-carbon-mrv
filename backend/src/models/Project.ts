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
        assignedValidator: {
            type: String,
            ref: 'User',
            lowercase: true,
        },
        blockchainProjectHash: { type: String },
        totalCarbonCredits: {
            type: Number,
            default: 0,
            min: 0,
        },
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
