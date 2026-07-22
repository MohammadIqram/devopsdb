import express from 'express';
import {
    listJobs, listDeployment, deploy, getRepos, removeContributor, addCollaborator, searchUsers,
    getBranches,
    getBranchTree,
    deleteBranch,
    deleteBranchesBulk,
    getRepoDetails,
    downloadFile,
} from "../controllers/repo.controller.js";
import { getRepoContributors } from '../controllers/user.controller.js';

const router = express.Router();

router.get("/logs/:id", listJobs);
router.get("/deployments", listDeployment);
router.post("/deploy", deploy);
router.get("/", getRepos);
router.get("/contributors", getRepoContributors);
router.delete('/contributors', removeContributor);
router.get('/search-users', searchUsers);
router.post('/collaborators', addCollaborator);
router.get('/branches', getBranches);
router.get('/branch/tree', getBranchTree);
router.delete('/branch', deleteBranch);
router.post('/branches/bulk-delete', deleteBranchesBulk);
router.get('/details/:repoName', getRepoDetails);
router.get('/file/download', downloadFile);

export default router;