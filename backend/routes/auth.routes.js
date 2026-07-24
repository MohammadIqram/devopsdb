import express from 'express';
import { signup, login, initiateGithubAuth, handleGithubCallback, getUserRepositories } from '../controllers/auth.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// OAuth Trigger and Callback
router.get('/github/connect', isLoggedIn, initiateGithubAuth);
router.get('/github/callback', isLoggedIn, handleGithubCallback);

// GitHub API Data Actions
router.get('/github/repositories', getUserRepositories);

export default router;