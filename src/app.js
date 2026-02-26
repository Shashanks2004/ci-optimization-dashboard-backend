import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import commitRoutes from "./routes/commit.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import aiRoutes from "./routes/ai.routes.js";


dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/commits", commitRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);


app.get("/", (req, res) => {
  res.send("AutoDev AI Backend Running");
});

export default app;
