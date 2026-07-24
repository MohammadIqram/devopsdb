import express from 'express';
import { getBugs, createBug, updateBugStatus } from '../controllers/bug.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', isLoggedIn, getBugs);
router.post('/', isLoggedIn, createBug);
router.patch('/:id', isLoggedIn, updateBugStatus);

export default router;