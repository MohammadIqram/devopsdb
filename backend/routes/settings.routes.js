import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', isLoggedIn, getSettings);
router.put('/', isLoggedIn, updateSettings);

export default router;