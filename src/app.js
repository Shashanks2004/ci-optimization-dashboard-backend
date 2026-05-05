import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";

import commitRoutes from "./routes/commit.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import githubRoutes from "./routes/github.routes.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: [
    "https://ci-optimization-dashboard-frontend.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none",
  }
}));

app.use("/api/commits", commitRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("AutoDev AI Backend Running");
});

export default app;