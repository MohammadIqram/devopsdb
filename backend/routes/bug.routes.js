import express from 'express';
import { getBugs, createBug, updateBugStatus } from '../controllers/bug.controller.js';
import { isLoggedIn, sessionMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', sessionMiddleware, isLoggedIn, getBugs);
router.post('/', sessionMiddleware, isLoggedIn, createBug);
router.patch('/:id', sessionMiddleware, isLoggedIn, updateBugStatus);

export default router;