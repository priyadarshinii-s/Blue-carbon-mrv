import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    key: string;
    co2PerTree: number;
    co2Factors: {
        MANGROVE: number;
        SALTMARSH: number;
        SEAGRASS: number;
        MIXED: number;
    };
    updatedBy: string;
    updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
    {
        key: { type: String, default: 'formula', unique: true },
        co2PerTree: { type: Number, default: 0.024 },
        co2Factors: {
            MANGROVE: { type: Number, default: 10.0 },
            SALTMARSH: { type: Number, default: 6.5 },
            SEAGRASS: { type: Number, default: 4.0 },
            MIXED: { type: Number, default: 7.0 },
        },
        updatedBy: { type: String, default: '' },
    },
    { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);
