import express from 'express';
import { initiateGithubAuth, handleGithubCallback, getUserRepositories } from '../controllers/profile.controller.js';

const router = express.Router();

// OAuth Trigger and Callback
router.get('/github/connect', initiateGithubAuth);
router.get('/github/callback', handleGithubCallback);

// GitHub API Data Actions
router.get('/github/repositories', getUserRepositories);

export default router;