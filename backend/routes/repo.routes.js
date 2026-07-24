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
import { isLoggedIn } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get("/logs/:id", isLoggedIn, listJobs);
router.get("/deployments", isLoggedIn, listDeployment);
router.post("/deploy", isLoggedIn, deploy);
router.get("/", isLoggedIn, getRepos);
router.get("/contributors", isLoggedIn, getRepoContributors);
router.delete('/contributors', isLoggedIn, removeContributor);
router.get('/search-users', isLoggedIn, searchUsers);
router.post('/collaborators', isLoggedIn, addCollaborator);
router.get('/branches', isLoggedIn, getBranches);
router.get('/branch/tree', isLoggedIn, getBranchTree);
router.delete('/branch', isLoggedIn, deleteBranch);
router.post('/branches/bulk-delete', isLoggedIn, deleteBranchesBulk);
router.get('/details/:repoName', isLoggedIn, getRepoDetails);
router.get('/file/download', isLoggedIn, downloadFile);
router.get('/download-zip', isLoggedIn, downloadRepoZip);
router.post('/cicd/create-pr', isLoggedIn, createCicdPr);
router.post('/pr/check-or-create', isLoggedIn, checkOrCreatePr);
router.get('/:repo/pulls', isLoggedIn, getRepoPullRequests);
router.get('/:repo/pulls/:id', isLoggedIn, getPullRequestDetails);
router.post('/:repo/pulls/:id/merge', isLoggedIn, mergePullRequest);
router.post('/cicd/create-manual', isLoggedIn, createManualCicdPr);

export default router;