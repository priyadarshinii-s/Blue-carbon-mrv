import { Router } from 'express';
import {
    getUsers,
    updateUserRole,
    assignUserToProject,
    getMintQueue,
    mintCredits,
} from '../controllers/admin.controller';
import { protect } from '../middlewares/auth';
import { restrictTo } from '../middlewares/roleGuard';
import { validate } from '../middlewares/validate';
import { updateUserRoleSchema, assignProjectSchema, mintSchema } from '../validators/admin.validator';
import { UserRole } from '../types';

const router = Router();

router.use(protect, restrictTo(UserRole.ADMIN));

router.get('/users', getUsers);

router.patch('/users/:id/role', validate(updateUserRoleSchema), updateUserRole);

router.patch('/users/:id/assign-project', validate(assignProjectSchema), assignUserToProject);

router.get('/mint-queue', getMintQueue);

router.post('/mint/:projectId', validate(mintSchema), mintCredits);

export default router;
