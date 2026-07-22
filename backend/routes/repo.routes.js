import express from 'express';
import { listJobs, listDeployment, deploy, getRepos } from "../controllers/repo.controller.js";

const router = express.Router();

router.get("/logs/:id", listJobs);
router.get("/deployments", listDeployment);
router.post("/deploy", deploy);
router.get("/", getRepos);

export default router;