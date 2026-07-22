import express from 'express';
import { listJobs, listDeployment, deploy, getRepos, removeContributor, addCollaborator, searchUsers } from "../controllers/repo.controller.js";
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

export default router;