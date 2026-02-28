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
    // Exchange code for access token
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

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ error: "No access token received" });
    }

    // Get GitHub user info
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { login, email } = userResponse.data;

    let userEmail = email;

    // If email is null, fetch emails separately
    if (!userEmail) {
      const emailResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const primaryEmail = emailResponse.data.find(e => e.primary);
      userEmail = primaryEmail?.email;
    }

    if (!userEmail) {
      return res.status(400).json({ error: "Email not found from GitHub" });
    }

    // Check user in DB
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [userEmail]
    );

    let user;

    if (userCheck.rows.length === 0) {
      const newUser = await pool.query(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
        [login, userEmail]
      );
      user = newUser.rows[0];
    } else {
      user = userCheck.rows[0];
    }

    // 🔥 STORE USER IN SESSION (NO JWT)
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // Redirect to frontend (no token needed)
    res.redirect(process.env.FRONTEND_URL);

  } catch (err) {
  console.error("===== GITHUB ERROR =====");
  console.error(err.response?.data);
  console.error(err.message);
  res.status(500).json({ error: "GitHub Auth Failed" });
}
});

export default router;