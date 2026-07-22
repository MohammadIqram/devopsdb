import express from 'express';
import { getUsers, inviteUser, updateUserRole, toggleUserStatus, deleteUser, getUserAuditLogs } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/invite', inviteUser);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);
router.get('/:id/audit', getUserAuditLogs);

export default router;