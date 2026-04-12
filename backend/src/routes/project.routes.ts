import { Router } from 'express';
import {
    createProject,
    getProjects,
    getProject,
    updateProject,
    getPublicProjects,
    getPublicMapPins,
    getProjectOnChainEvents,
} from '../controllers/project.controller';
import { confirmProjectTx } from '../controllers/confirm-tx.controller';
import { protect } from '../middlewares/auth';
import { restrictTo } from '../middlewares/roleGuard';
import { validate } from '../middlewares/validate';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import { UserRole } from '../types';

const router = Router();

router.get('/public', getPublicProjects);
router.get('/public/pins', getPublicMapPins);

router.use(protect);

router.post(
    '/',
    restrictTo(UserRole.USER, UserRole.ADMIN),
    validate(createProjectSchema),
    createProject
);

router.get('/', getProjects);

router.get('/:id', getProject);

router.get('/:id/on-chain-events', getProjectOnChainEvents);

router.post('/:id/confirm-tx', confirmProjectTx);

router.patch(
    '/:id',
    restrictTo(UserRole.ADMIN),
    validate(updateProjectSchema),
    updateProject
);

export default router;
