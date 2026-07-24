import express from 'express';
import { initiateGithubAuth, handleGithubCallback, getUserRepositories } from '../controllers/profile.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';
const router = express.Router();

// OAuth Trigger and Callback
router.get('/github/connect', isLoggedIn, initiateGithubAuth);
router.get('/github/callback', isLoggedIn, handleGithubCallback);

// GitHub API Data Actions
router.get('/github/repositories', isLoggedIn, getUserRepositories);

export default router;