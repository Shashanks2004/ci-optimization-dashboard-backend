import express from "express";
import {
  githubLogin,
  githubCallback,
  getUserRepos,
  getGithubProfile,
  getRepoCommits,
  getRepoMetrics,
  getRepoTrend
} from "../controllers/github.controller.js";

const router = express.Router();

router.get("/login", githubLogin);
router.get("/callback", githubCallback);
router.get("/repos", getUserRepos);
router.get("/me", getGithubProfile);
router.get("/commits/:repo", getRepoCommits);
router.get("/metrics/:repo", getRepoMetrics);
router.get("/trend/:repo", getRepoTrend);

router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.json({ connected: false });
  }

  res.json({
    connected: true,
    user: req.session.user,
  });
});


export default router;