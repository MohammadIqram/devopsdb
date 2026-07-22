import express from 'express';
import { inviteUser, updateUserRole, toggleUserStatus, deleteUser, getUserAuditLogs } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/invite', inviteUser);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);
router.get('/:id/audit', getUserAuditLogs);

export default router;