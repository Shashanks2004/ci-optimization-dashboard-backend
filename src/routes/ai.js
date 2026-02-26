import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/optimize/:commitId", async (req, res) => {
  try {
    const { commitId } = req.params;

    const result = await pool.query(
      `SELECT c.commit_hash,
              m.build_time,
              m.test_duration,
              m.failure_rate,
              m.files_changed,
              m.lines_added,
              m.branch_name
       FROM commits c
       JOIN ci_metrics m ON c.id = m.commit_id
       WHERE c.id = $1`,
      [commitId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Commit not found" });
    }

    const data = result.rows[0];

    const suggestions = [];
    let riskScore = 0;

    // 🔍 Optimization Rules

    if (data.build_time > 400) {
      suggestions.push("Enable dependency caching to reduce build time.");
      riskScore += 15;
    }

    if (data.test_duration > 300) {
      suggestions.push("Parallelize test execution to reduce pipeline time.");
      riskScore += 15;
    }

    if (data.files_changed > 25) {
      suggestions.push("Split large commits to reduce integration risk.");
      riskScore += 20;
    }

    if (data.lines_added > 500) {
      suggestions.push("Review large code additions for potential instability.");
      riskScore += 15;
    }

    if (data.failure_rate > 0.3) {
      suggestions.push("Investigate flaky tests and improve test reliability.");
      riskScore += 25;
    }

    // CI Health Score (100 - risk)
    const ciHealthScore = Math.max(100 - riskScore, 10);

    res.json({
      commit: data.commit_hash,
      branch: data.branch_name,
      risk_score: riskScore,
      ci_health_score: ciHealthScore,
      suggestions
    });

  } catch (err) {
    console.error("AI Optimization Error:", err.message);
    res.status(500).json({ error: "Optimization failed" });
  }
});

export default router;
