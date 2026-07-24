import express from 'express';
import { inviteUser, updateUserRole, toggleUserStatus, deleteUser, getUserAuditLogs } from '../controllers/user.controller.js';
import { isLoggedIn, sessionMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/invite', sessionMiddleware, isLoggedIn, inviteUser);
router.patch('/:id/role', sessionMiddleware, isLoggedIn, updateUserRole);
router.patch('/:id/status', sessionMiddleware, isLoggedIn, toggleUserStatus);
router.delete('/:id', sessionMiddleware, isLoggedIn, deleteUser);
router.get('/:id/audit', sessionMiddleware, isLoggedIn, getUserAuditLogs);

export default router;