import express from "express";
import axios from "axios";
import pool from "../config/db.js";

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

    // 🔥 Exchange code for access token
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

    // 🔥 Get GitHub user
   const userResponse = await axios.get("https://api.github.com/user", {
  headers: {
    Authorization: `token ${accessToken}`,
    "User-Agent": "ci-dashboard-app",
  },
});

    const githubUser = userResponse.data;

    let userEmail = githubUser.email;

    // 🔥 Get email if private
    if (!userEmail) {
      const emailResponse = await axios.get(
  "https://api.github.com/user/emails",
  {
    headers: {
      Authorization: `token ${accessToken}`,
      "User-Agent": "ci-dashboard-app",
    },
  }
);

      const primaryEmail = emailResponse.data.find((e) => e.primary);
      userEmail = primaryEmail?.email;
    }

    if (!userEmail) {
      return res.status(400).json({ error: "Email not found from GitHub" });
    }

    // 🔥 DB check
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [userEmail]
    );

    let user;

    if (userCheck.rows.length === 0) {
      const newUser = await pool.query(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
        [githubUser.login, userEmail]
      );
      user = newUser.rows[0];
    } else {
      user = userCheck.rows[0];
    }

    // 🔥 STORE FULL GITHUB DATA IN SESSION
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      login: githubUser.login,
      avatar_url: githubUser.avatar_url,
      public_repos: githubUser.public_repos,
      followers: githubUser.followers,
    };

    console.log("✅ USER STORED IN SESSION");

    // 🔥 Redirect back to frontend
    res.redirect(process.env.FRONTEND_URL);

  } catch (err) {
    console.error("===== FULL GITHUB ERROR =====");

    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error("DATA:", err.response.data);
    } else {
      console.error(err.message);
    }

    res.status(500).json({
      error: "GitHub Auth Failed",
      details: err.response?.data || err.message,
    });
  }
});

export default router;