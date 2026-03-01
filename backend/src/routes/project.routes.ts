import { Router } from 'express';
import {
    createProject,
    getProjects,
    getProject,
    updateProject,
    getPublicProjects,
} from '../controllers/project.controller';
import { protect } from '../middlewares/auth';
import { restrictTo } from '../middlewares/roleGuard';
import { validate } from '../middlewares/validate';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import { UserRole } from '../types';

const router = Router();

router.get('/public', getPublicProjects);

router.use(protect);

router.post(
    '/',
    restrictTo(UserRole.USER, UserRole.ADMIN),
    validate(createProjectSchema),
    createProject
);

router.get('/', getProjects);

router.get('/:id', getProject);

router.patch(
    '/:id',
    restrictTo(UserRole.ADMIN),
    validate(updateProjectSchema),
    updateProject
);

export default router;
