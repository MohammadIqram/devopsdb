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
import { isLoggedIn, sessionMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/projects', sessionMiddleware, isLoggedIn, getHostingerProjects);
router.get('/domains', sessionMiddleware, isLoggedIn, getHostingerDomains);
router.get('/vps', sessionMiddleware, isLoggedIn, getHostingerVPS);
router.get('/emails', sessionMiddleware, isLoggedIn, getHostingerEmails);
router.get('/dashboard-summary', sessionMiddleware, isLoggedIn, getHostingerDashboardSummary);

// vps routes
router.get("/vps", sessionMiddleware, isLoggedIn, getAllVps);
router.get('/vps/:id', sessionMiddleware, isLoggedIn, getVpsDetails);
router.get('/vps/:id/health', sessionMiddleware, isLoggedIn, getVpsHealthMetrics);
router.post('/vps/:id/reset-password', sessionMiddleware, isLoggedIn, resetVpsPassword);

export default router;