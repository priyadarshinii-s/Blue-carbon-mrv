import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middlewares/auth';
import { getFormulaSettings, updateFormulaSettings } from '../controllers/settings.controller';

const router = Router();

const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin access required' });
        return;
    }
    next();
};

router.get('/formula', protect, getFormulaSettings);
router.patch('/formula', protect, adminOnly, updateFormulaSettings);

export default router;
