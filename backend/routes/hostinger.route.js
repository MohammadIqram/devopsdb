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
import { isLoggedIn } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/projects', isLoggedIn, getHostingerProjects);
router.get('/domains', isLoggedIn, getHostingerDomains);
router.get('/vps', isLoggedIn, getHostingerVPS);
router.get('/emails', isLoggedIn, getHostingerEmails);
router.get('/dashboard-summary', isLoggedIn, getHostingerDashboardSummary);

// vps routes
router.get("/vps", isLoggedIn, getAllVps);
router.get('/vps/:id', isLoggedIn, getVpsDetails);
router.get('/vps/:id/health', isLoggedIn, getVpsHealthMetrics);
router.post('/vps/:id/reset-password', isLoggedIn, resetVpsPassword);

export default router;