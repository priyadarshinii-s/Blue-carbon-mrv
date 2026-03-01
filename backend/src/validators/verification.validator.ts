import { z } from 'zod';

export const reviewSubmissionSchema = z.object({
    status: z.enum(['Approved', 'NeedsCorrection', 'Rejected']),
    approvedCredits: z.number().nonnegative().optional(),
    remarks: z.string().max(2000).optional(),
});

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
