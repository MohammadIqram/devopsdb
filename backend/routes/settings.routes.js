import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { isLoggedIn, sessionMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', sessionMiddleware, isLoggedIn, getSettings);
router.put('/', sessionMiddleware, isLoggedIn, updateSettings);

export default router;