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
    console.log("🔹 CLIENT ID:", process.env.GITHUB_CLIENT_ID);
    console.log("🔹 SECRET EXISTS:", !!process.env.GITHUB_CLIENT_SECRET);

    /* ==============================
       STEP 2.1 — Exchange code for token
    ============================== */
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:
          "https://ci-optimization-dashboard-backend.onrender.com/api/auth/github/callback",
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    console.log("🔹 TOKEN RESPONSE:", tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({
        error: "No access token received",
        github_response: tokenResponse.data,
      });
    }

    /* ==============================
       STEP 2.2 — Get GitHub user
    ============================== */
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("🔹 USER DATA:", userResponse.data);

    const { login, email } = userResponse.data;

    let userEmail = email;

    /* ==============================
       STEP 2.3 — Get email if private
    ============================== */
    if (!userEmail) {
      const emailResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log("🔹 EMAIL DATA:", emailResponse.data);

      const primaryEmail = emailResponse.data.find((e) => e.primary);
      userEmail = primaryEmail?.email;
    }

    if (!userEmail) {
      return res.status(400).json({ error: "Email not found from GitHub" });
    }

    /* ==============================
       STEP 2.4 — DB Check/Create
    ============================== */
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

    /* ==============================
       STEP 2.5 — Save session
    ============================== */
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    console.log("✅ USER STORED IN SESSION");

    /* ==============================
       STEP 2.6 — Redirect frontend
    ============================== */
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