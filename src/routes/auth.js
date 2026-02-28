import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
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

    // Get GitHub user info
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id, login, email } = userResponse.data;

    // If email is null, fetch emails separately
    let userEmail = email;

    if (!userEmail) {
      const emailResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const primaryEmail = emailResponse.data.find(e => e.primary);
      userEmail = primaryEmail.email;
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

    // Create JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect back to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${jwtToken}`);

  } catch (err) {
  console.error("GitHub OAuth Error:");
  console.error(err.response?.data || err.message || err);
  res.status(500).json({ error: "GitHub Auth Failed" });
}
});

export default router;