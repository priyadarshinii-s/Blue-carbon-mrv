import { Request, Response } from 'express';
import Settings from '../models/Settings';
import { catchAsync } from '../utils/catchAsync';

export const getFormulaSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
    let settings = await Settings.findOne({ key: 'formula' });

    if (!settings) {
        settings = await Settings.create({ key: 'formula' });
    }

    res.status(200).json({
        success: true,
        data: {
            co2PerTree: settings.co2PerTree,
            co2Factors: settings.co2Factors,
            updatedBy: settings.updatedBy,
            updatedAt: settings.updatedAt,
        },
    });
});

export const updateFormulaSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { co2PerTree, co2Factors } = req.body;
    const update: Record<string, any> = {};

    if (co2PerTree !== undefined) {
        const val = parseFloat(co2PerTree);
        if (isNaN(val) || val <= 0) {
            res.status(400).json({ success: false, message: 'co2PerTree must be a positive number' });
            return;
        }
        update.co2PerTree = val;
    }

    if (co2Factors) {
        for (const [key, value] of Object.entries(co2Factors)) {
            const num = parseFloat(value as string);
            if (!isNaN(num) && num > 0) {
                update[`co2Factors.${key}`] = num;
            }
        }
    }

    if (req.user) {
        update.updatedBy = req.user.walletAddress || req.user.email || '';
    }

    const settings = await Settings.findOneAndUpdate(
        { key: 'formula' },
        { $set: update },
        { new: true, upsert: true }
    );

    res.status(200).json({
        success: true,
        data: {
            co2PerTree: settings.co2PerTree,
            co2Factors: settings.co2Factors,
            updatedBy: settings.updatedBy,
            updatedAt: settings.updatedAt,
        },
    });
});
