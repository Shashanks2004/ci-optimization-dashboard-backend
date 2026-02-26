import express from "express";
import pool from "../config/db.js";

const router = express.Router();


// ==========================
// 📊 Dashboard Stats
// ==========================
router.get("/stats", async (req, res) => {
  try {
    const totalBuilds = await pool.query(
      `SELECT COUNT(*) FROM builds`
    );

    const successBuilds = await pool.query(
      `SELECT COUNT(*) FROM builds WHERE status = 'Success'`
    );

    const failedBuilds = await pool.query(
      `SELECT COUNT(*) FROM builds WHERE status = 'Failed'`
    );

    const avgDuration = await pool.query(
      `SELECT AVG(duration_seconds) FROM builds`
    );

    const failureRate =
      totalBuilds.rows[0].count == 0
        ? 0
        : (
            (failedBuilds.rows[0].count /
              totalBuilds.rows[0].count) *
            100
          ).toFixed(2);

    res.json({
      total_builds: Number(totalBuilds.rows[0].count),
      success_builds: Number(successBuilds.rows[0].count),
      failed_builds: Number(failedBuilds.rows[0].count),
      failure_rate: Number(failureRate),
      avg_duration: Number(avgDuration.rows[0].avg || 0)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});


// ==========================
// 🤖 Latest AI Decision
// ==========================
router.get("/latest-ai", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.commit_hash, a.risk_level, b.status, a.selected_tests
      FROM ai_decisions a
      JOIN commits c ON a.commit_id = c.id
      JOIN builds b ON b.commit_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 1
    `);

    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch AI decision" });
  }
});


// ==========================
// 📄 Recent Commits Table
// ==========================
router.get("/commits", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.commit_hash, 
        a.risk_level, 
        b.status, 
        a.selected_tests,
        a.failure_probability,
        a.confidence,
        a.explanation
      FROM commits c
      JOIN ai_decisions a ON a.commit_id = c.id
      JOIN builds b ON b.commit_id = c.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch commits" });
  }
})


export default router;
