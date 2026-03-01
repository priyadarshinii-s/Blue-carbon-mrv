import { z } from 'zod';

export const createProjectSchema = z.object({
    projectName: z.string().min(1).max(200),
    projectType: z.enum(['MANGROVE', 'SALTMARSH', 'SEAGRASS', 'MIXED']),
    description: z.string().max(5000).optional(),
    location: z.string().optional(),
    geofence: z
        .object({
            type: z.literal('Polygon'),
            coordinates: z.array(z.array(z.array(z.number()))),
        })
        .optional(),
    approximateAreaHa: z.number().positive().optional(),
    ecosystemTypes: z.array(z.string()).optional(),
    baselinePhotos: z.array(z.string()).optional(),
    baselineVideos: z.array(z.string()).optional(),
    plannedActivities: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'COMPLETED']).optional(),
    assignedFieldOfficer: z.string().optional(),
    assignedValidator: z.string().optional(),
});

export const updateProjectSchema = z.object({
    projectName: z.string().min(1).max(200).optional(),
    projectType: z.enum(['MANGROVE', 'SALTMARSH', 'SEAGRASS', 'MIXED']).optional(),
    description: z.string().max(5000).optional(),
    location: z.string().optional(),
    geofence: z
        .object({
            type: z.literal('Polygon'),
            coordinates: z.array(z.array(z.array(z.number()))),
        })
        .optional(),
    approximateAreaHa: z.number().positive().optional(),
    ecosystemTypes: z.array(z.string()).optional(),
    baselinePhotos: z.array(z.string()).optional(),
    baselineVideos: z.array(z.string()).optional(),
    plannedActivities: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'COMPLETED']).optional(),
    assignedFieldOfficer: z.string().optional(),
    assignedValidator: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
