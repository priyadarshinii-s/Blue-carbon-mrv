import { z } from 'zod';

export const createSubmissionSchema = z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    visitDate: z.string().datetime({ message: 'Valid visit date is required' }),
    survivingTrees: z.number().int().nonnegative().optional(),
    survivalRate: z.number().min(0).max(100).optional(),
    gps: z
        .object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
        })
        .optional(),
    currentPhotos: z.array(z.string()).optional(),
    currentVideos: z.array(z.string()).optional(),
    siteCondition: z
        .object({
            vegetation: z.string().optional(),
            salinity: z.number().optional(),
            pH: z.number().optional(),
            flooding: z.string().optional(),
        })
        .optional(),
    restorationLog: z.record(z.unknown()).optional(),
    carbonInputs: z.record(z.unknown()).optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
