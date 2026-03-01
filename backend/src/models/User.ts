import mongoose, { Schema } from 'mongoose';
import { IUser, UserRole, UserStatus } from '../types';

const userSchema = new Schema<IUser>(
    {
        walletAddress: {
            type: String,
            unique: true,
            required: [true, 'Wallet address is required'],
            lowercase: true,
            trim: true,
            index: true,
        },
        userName: {
            type: String,
            required: [true, 'Username is required'],
            trim: true,
            minlength: [2, 'Username must be at least 2 characters'],
            maxlength: [100, 'Username cannot exceed 100 characters'],
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        organization: {
            type: String,
            trim: true,
        },

        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
        },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.APPROVED,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                delete (ret as Record<string, unknown>).__v;
                return ret;
            },
        },
    }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

const User = mongoose.model<IUser>('User', userSchema);
export default User;
