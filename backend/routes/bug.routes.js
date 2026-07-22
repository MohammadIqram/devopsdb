import express from 'express';
import { getBugs, createBug, updateBugStatus } from '../controllers/bugController.js';

const router = express.Router();

router.get('/', getBugs);
router.post('/', createBug);
router.patch('/:id', updateBugStatus);

export default router;