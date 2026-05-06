import express from "express";
import axios from "axios";
import {
  getUserRepos,
  getGithubProfile,
  getRepoCommits,
  getRepoMetrics,
  getRepoTrend
} from "../controllers/github.controller.js";

const router = express.Router();

//router.get("/callback", githubCallback);
router.get("/repos", getUserRepos);
router.get("/me", getGithubProfile);
router.get("/commits/:repo", getRepoCommits);
router.get("/metrics/:repo", getRepoMetrics);
router.get("/trend/:repo", getRepoTrend);

export default router;