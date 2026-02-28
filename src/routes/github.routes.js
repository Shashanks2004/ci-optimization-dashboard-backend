import express from "express";
import {
  githubLogin,
  //githubCallback,
  getUserRepos,
  getGithubProfile,
  getRepoCommits,
  getRepoMetrics,
  getRepoTrend
} from "../controllers/github.controller.js";

const router = express.Router();

router.get("/login", githubLogin);
//router.get("/callback", githubCallback);
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

router.get("/github/callback", async (req, res) => {
  const code = req.query.code;

  try {
    console.log("Received code:", code);
    console.log("CLIENT ID:", process.env.GITHUB_CLIENT_ID);
    console.log("CLIENT SECRET EXISTS:", !!process.env.GITHUB_CLIENT_SECRET);

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    console.log("Token Response:", tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({
        error: "No access token received",
        github_response: tokenResponse.data,
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("FULL ERROR:");
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "GitHub Auth Failed" });
  }
});


export default router;