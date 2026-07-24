import express from 'express';
import {
    listJobs, listDeployment, deploy, getRepos, removeContributor, addCollaborator, searchUsers,
    getBranches,
    getBranchTree,
    deleteBranch,
    deleteBranchesBulk,
    getRepoDetails,
    downloadFile,
    downloadRepoZip,
    createCicdPr,
    checkOrCreatePr,
    getRepoPullRequests,
    getPullRequestDetails,
    mergePullRequest,
    createManualCicdPr,
} from "../controllers/repo.controller.js";
import { getRepoContributors } from '../controllers/user.controller.js';
import { sessionMiddleware, isLoggedIn } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get("/logs/:id", sessionMiddleware, isLoggedIn, listJobs);
router.get("/deployments", sessionMiddleware, isLoggedIn, listDeployment);
router.post("/deploy", sessionMiddleware, isLoggedIn, deploy);
router.get("/", sessionMiddleware, isLoggedIn, getRepos);
router.get("/contributors", sessionMiddleware, isLoggedIn, getRepoContributors);
router.delete('/contributors', sessionMiddleware, isLoggedIn, removeContributor);
router.get('/search-users', sessionMiddleware, isLoggedIn, searchUsers);
router.post('/collaborators', sessionMiddleware, isLoggedIn, addCollaborator);
router.get('/branches', sessionMiddleware, isLoggedIn, getBranches);
router.get('/branch/tree', sessionMiddleware, isLoggedIn, getBranchTree);
router.delete('/branch', sessionMiddleware, isLoggedIn, deleteBranch);
router.post('/branches/bulk-delete', sessionMiddleware, isLoggedIn, deleteBranchesBulk);
router.get('/details/:repoName', sessionMiddleware, isLoggedIn, getRepoDetails);
router.get('/file/download', sessionMiddleware, isLoggedIn, downloadFile);
router.get('/download-zip', sessionMiddleware, isLoggedIn, downloadRepoZip);
router.post('/cicd/create-pr', sessionMiddleware, isLoggedIn, createCicdPr);
router.post('/pr/check-or-create', sessionMiddleware, isLoggedIn, checkOrCreatePr);
router.get('/:repo/pulls', sessionMiddleware, isLoggedIn, getRepoPullRequests);
router.get('/:repo/pulls/:id', sessionMiddleware, isLoggedIn, getPullRequestDetails);
router.post('/:repo/pulls/:id/merge', sessionMiddleware, isLoggedIn, mergePullRequest);
router.post('/cicd/create-manual', sessionMiddleware, isLoggedIn, createManualCicdPr);

export default router;