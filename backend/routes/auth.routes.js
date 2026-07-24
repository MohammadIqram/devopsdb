import express from 'express';
import { signup, login, initiateGithubAuth, handleGithubCallback, getUserRepositories, logout } from '../controllers/auth.controller.js';
import { isLoggedIn, sessionMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// OAuth Trigger and Callback
router.get('/github/connect', sessionMiddleware, isLoggedIn, initiateGithubAuth);
router.get('/github/callback', sessionMiddleware, isLoggedIn, handleGithubCallback);

// GitHub API Data Actions
router.get('/github/repositories', sessionMiddleware, getUserRepositories);

export default router;