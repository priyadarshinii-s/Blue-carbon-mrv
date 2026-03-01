import { Router } from 'express';
import {
    getVerificationQueue,
    reviewSubmission,
} from '../controllers/verification.controller';
import { getVerificationHistory } from '../controllers/report.controller';
import { protect } from '../middlewares/auth';
import { restrictTo } from '../middlewares/roleGuard';
import { validate } from '../middlewares/validate';
import { reviewSubmissionSchema } from '../validators/verification.validator';
import { UserRole } from '../types';

const router = Router();

router.use(protect, restrictTo(UserRole.VALIDATOR));

router.get('/queue', getVerificationQueue);

router.post(
    '/:submissionId/review',
    validate(reviewSubmissionSchema),
    reviewSubmission
);

router.get('/history', getVerificationHistory);

export default router;
