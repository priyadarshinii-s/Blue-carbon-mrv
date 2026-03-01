import { Document } from 'mongoose';

export enum UserRole {
    USER = 'USER',
    FIELD_OFFICER = 'FIELD_OFFICER',
    VALIDATOR = 'VALIDATOR',
    ADMIN = 'ADMIN',
}

export enum UserStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export enum ProjectType {
    MANGROVE = 'MANGROVE',
    SALTMARSH = 'SALTMARSH',
    SEAGRASS = 'SEAGRASS',
    MIXED = 'MIXED',
}

export enum ProjectStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
}

export enum SubmissionStatus {
    PENDING = 'Pending',
    NEEDS_CORRECTION = 'NeedsCorrection',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export enum VerificationStatus {
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export interface IUser extends Document {
    walletAddress: string;
    userName: string;
    email?: string;
    phone?: string;
    organization?: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGeoJSON {
    type: string;
    coordinates: number[][][];
}

export interface IProject extends Document {
    projectId: string;
    ownerWallet: string;
    projectName: string;
    projectType: ProjectType;
    description?: string;
    location?: string;
    geofence?: IGeoJSON;
    approximateAreaHa?: number;
    ecosystemTypes?: string[];
    baselinePhotos?: string[];
    baselineVideos?: string[];
    plannedActivities?: string[];
    startDate?: Date;
    endDate?: Date;
    status: ProjectStatus;
    assignedFieldOfficer?: string;
    assignedValidator?: string;
    blockchainProjectHash?: string;
    totalCarbonCredits: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGPS {
    lat: number;
    lng: number;
}

export interface ISiteCondition {
    vegetation?: string;
    salinity?: number;
    pH?: number;
    flooding?: string;
}

export interface ISubmission extends Document {
    submissionId: string;
    projectId: string;
    fieldOfficerWallet: string;
    visitDate: Date;
    survivingTrees?: number;
    survivalRate?: number;
    gps?: IGPS;
    currentPhotos?: string[];
    currentVideos?: string[];
    siteCondition?: ISiteCondition;
    restorationLog?: Record<string, unknown>;
    carbonInputs?: Record<string, unknown>;
    status: SubmissionStatus;
    validatorComments?: string;
    blockchainSubmissionHash?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IVerification extends Document {
    verificationId: string;
    projectId: string;
    submissionId: string;
    validatorWallet: string;
    status: VerificationStatus;
    approvedCredits?: number;
    remarks?: string;
    blockchainVerificationHash?: string;
    finalized: boolean;
    createdAt: Date;
}

export interface ITokenData extends Document {
    projectId: string;
    year: string;
    tokenId?: number;
    mintedAmount: number;
    retiredAmount: number;
    metadataIPFS?: string;
    mintTxHash?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IJwtPayload {
    userId: string;
    walletAddress: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
