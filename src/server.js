import dotenv from "dotenv";
dotenv.config();

import session from "express-session";
import cors from "cors";
import express from "express";
import app from "./app.js";

import githubRoutes from "./routes/github.routes.js";
import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";
import commitRoutes from "./routes/commit.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const PORT = process.env.PORT || 5000;

/* ===============================
   CORS CONFIG (VERY IMPORTANT)
=============================== */

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));

/* ===============================
   SESSION
=============================== */

app.use(
  session({
    secret: "cio_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true only in production HTTPS
      httpOnly: true,
      sameSite: "lax", // 🔥 important for CORS cookies
    },
  })
);

/* ===============================
   ROUTES
=============================== */

app.use("/api/github", githubRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/commits", commitRoutes);
app.use("/api", dashboardRoutes);

/* ===============================
   START SERVER
=============================== */

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});