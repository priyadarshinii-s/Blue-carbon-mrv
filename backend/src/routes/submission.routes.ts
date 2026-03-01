import { Router } from 'express';
import {
    createSubmission,
    getMySubmissions,
    getSubmission,
} from '../controllers/submission.controller';
import { protect } from '../middlewares/auth';
import { restrictTo } from '../middlewares/roleGuard';
import { validate } from '../middlewares/validate';
import { createSubmissionSchema } from '../validators/submission.validator';
import { UserRole } from '../types';

const router = Router();

router.use(protect);

router.post(
    '/',
    restrictTo(UserRole.FIELD_OFFICER),
    validate(createSubmissionSchema),
    createSubmission
);

router.get('/my', restrictTo(UserRole.FIELD_OFFICER), getMySubmissions);

router.get('/:id', getSubmission);

export default router;
