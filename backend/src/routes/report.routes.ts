import { Router } from 'express';
import { exportCSV, getNDCReport, getDashboardStats, getLedgerReport, getPerformanceReport, getAuditLogs, getUserCredits } from '../controllers/report.controller';
import { optionalProtect, protect } from '../middlewares/auth';
import { restrictTo } from '../middlewares/roleGuard';
import { UserRole } from '../types';

const router = Router();

router.get('/dashboard-stats', optionalProtect, getDashboardStats);

router.use(protect);

router.get('/user-credits', getUserCredits);

router.use(restrictTo(UserRole.ADMIN));

router.get('/export-csv', exportCSV);

router.get('/ndc', getNDCReport);

router.get('/ledger', getLedgerReport);

router.get('/performance', getPerformanceReport);

router.get('/audit-logs', getAuditLogs);

export default router;
