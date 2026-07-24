import express from 'express';
import { inviteUser, updateUserRole, toggleUserStatus, deleteUser, getUserAuditLogs } from '../controllers/user.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/invite', isLoggedIn, inviteUser);
router.patch('/:id/role', isLoggedIn, updateUserRole);
router.patch('/:id/status', isLoggedIn, toggleUserStatus);
router.delete('/:id', isLoggedIn, deleteUser);
router.get('/:id/audit', isLoggedIn, getUserAuditLogs);

export default router;