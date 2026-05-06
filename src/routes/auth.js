import express from "express";
import axios from "axios";
//import pool from "../config/db.js";

const router = express.Router();

/* ==============================
   STEP 1 — Redirect To GitHub
============================== */
router.get("/github", (req, res) => {
  const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;

  res.redirect(githubAuthURL);
});

/* ==============================
   STEP 2 — GitHub Callback
============================== */
router.get("/github/callback", async (req, res) => {
  const code = req.query.code;

  try {
    console.log("🔹 CODE:", code);

    // Exchange code for token
    const tokenResponse = await axios({
      method: "post",
      url: "https://github.com/login/oauth/access_token",
      headers: {
        Accept: "application/json",
      },
      data: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
    });

    console.log("🔹 TOKEN RESPONSE:", tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({
        error: "No access token received",
        github_response: tokenResponse.data,
      });
    }

    // Get GitHub user
    const userResponse = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `token ${accessToken}`,
          "User-Agent": "ci-dashboard-app",
        },
      }
    );

    const githubUser = userResponse.data;

    // Store session ONLY
    req.session.githubToken = accessToken;

    req.session.githubUser = githubUser;

    console.log("✅ USER STORED IN SESSION");

    // Redirect frontend
    return res.redirect(process.env.FRONTEND_URL);

  } catch (err) {
    console.error("===== FULL GITHUB ERROR =====");

    console.error("MESSAGE:", err.message);

    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error("DATA:", JSON.stringify(err.response.data, null, 2));
    }

    console.error("STACK:", err.stack);

    res.status(500).json({
      error: "GitHub Auth Failed",
      details: err.message,
    });
  }
});

export default router;