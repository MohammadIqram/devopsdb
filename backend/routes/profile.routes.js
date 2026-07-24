import express from 'express';
import { initiateGithubAuth, handleGithubCallback, getUserRepositories } from '../controllers/profile.controller.js';
import { isLoggedIn, sessionMiddleware } from '../middlewares/auth.middleware.js';
const router = express.Router();

// OAuth Trigger and Callback
router.get('/github/connect', sessionMiddleware, isLoggedIn, initiateGithubAuth);
router.get('/github/callback', sessionMiddleware, isLoggedIn, handleGithubCallback);

// GitHub API Data Actions
router.get('/github/repositories', sessionMiddleware, isLoggedIn, getUserRepositories);

export default router;