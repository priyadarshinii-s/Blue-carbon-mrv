import { Router } from 'express';
import {
    getVerificationQueue,
    reviewSubmission,
    getProjectVerifications,
} from '../controllers/verification.controller';
import { getVerificationHistory } from '../controllers/report.controller';
import { protect } from '../middlewares/auth';
import { restrictTo } from '../middlewares/roleGuard';
import { validate } from '../middlewares/validate';
import { reviewSubmissionSchema } from '../validators/verification.validator';
import { UserRole } from '../types';

const router = Router();

router.use(protect);

router.get('/queue', restrictTo(UserRole.VALIDATOR), getVerificationQueue);

router.post(
    '/:submissionId/review',
    restrictTo(UserRole.VALIDATOR),
    validate(reviewSubmissionSchema),
    reviewSubmission
);

router.get('/history', restrictTo(UserRole.VALIDATOR), getVerificationHistory);

router.get('/project/:projectId', getProjectVerifications);

export default router;
