import { Router } from 'express';
import {
    getHostingerProjects,
    getHostingerDomains,
    getHostingerVPS,
    getHostingerEmails,
    getHostingerDashboardSummary,
    getAllVps,
    getVpsDetails,
    resetVpsPassword,
    getVpsHealthMetrics,
} from '../controllers/hostinger.controller.js';

const router = Router();

router.get('/projects', getHostingerProjects);
router.get('/domains', getHostingerDomains);
router.get('/vps', getHostingerVPS);
router.get('/emails', getHostingerEmails);
router.get('/dashboard-summary', getHostingerDashboardSummary);

// vps routes
router.get("/vps", getAllVps);
router.get('/vps/:id', getVpsDetails);
router.get('/vps/:id/health', getVpsHealthMetrics);
router.post('/vps/:id/reset-password', resetVpsPassword);

export default router;