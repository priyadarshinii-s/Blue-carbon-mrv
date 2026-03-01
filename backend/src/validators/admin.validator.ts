import { z } from 'zod';

export const updateUserRoleSchema = z.object({
    role: z.enum(['USER', 'FIELD_OFFICER', 'VALIDATOR', 'ADMIN']),
});

export const assignProjectSchema = z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    role: z.enum(['FIELD_OFFICER', 'VALIDATOR'], {
        errorMap: () => ({ message: 'Role must be FIELD_OFFICER or VALIDATOR' }),
    }),
});

export const mintSchema = z.object({
    year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits'),
    amount: z.number().positive('Amount must be positive'),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type AssignProjectInput = z.infer<typeof assignProjectSchema>;
export type MintInput = z.infer<typeof mintSchema>;
