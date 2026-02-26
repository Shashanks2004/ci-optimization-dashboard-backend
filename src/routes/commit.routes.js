import express from "express";
import pool from "../config/db.js";
import { analyzeCommit } from "../services/ai.service.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * SIMULATE COMMIT (Enterprise Intelligence Version)
 */
router.post("/simulate", async (req, res) => {
  try {
    const randomHash = Math.random().toString(36).substring(2, 8);

    const sampleMessages = [
      "Updated authentication logic",
      "Refactored payment module",
      "Fixed UI bug",
      "Improved security core",
      "Optimized database queries"
    ];

    const message =
      sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

    // 🔥 PERFORMANCE INTELLIGENCE METRICS
    const buildTime = Math.floor(Math.random() * 600);
    const testDuration = Math.floor(Math.random() * 400);
    const failureRate = parseFloat(Math.random().toFixed(2));
    const filesChanged = Math.floor(Math.random() * 50) + 1;
    const linesAdded = Math.floor(Math.random() * 1000) + 10;
    const linesRemoved = Math.floor(Math.random() * 300);
    const branchList = ["main", "dev", "feature-x"];
    const branch = branchList[Math.floor(Math.random() * 3)];

    // 1️⃣ Insert into commits table FIRST
    const commitInsert = await pool.query(
      `INSERT INTO commits 
       (commit_hash, author_email, message)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [randomHash, "auto@ci.com", message]
    );

    const commit = commitInsert.rows[0];
    const commitId = commit.id;

    // 2️⃣ Insert into ci_metrics table
    await pool.query(
      `INSERT INTO ci_metrics
       (commit_id, build_time, test_duration, failure_rate, files_changed, lines_added, branch_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        commitId,
        buildTime,
        testDuration,
        failureRate,
        filesChanged,
        linesAdded,
        branch
      ]
    );

    // 3️⃣ AI Analysis
    const aiResult = await analyzeCommit({
      ...commit,
      files_changed: filesChanged,
      lines_added: linesAdded,
      branch_name: branch
    });

    // 4️⃣ Store AI Decision
    await pool.query(
      `INSERT INTO ai_decisions 
       (commit_id, risk_level, confidence, selected_tests, explanation, risk_score, failure_probability, confidence_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        commitId,
        aiResult.riskLevel,
        aiResult.confidence,
        aiResult.selectedTests,
        aiResult.explanation,
        aiResult.riskScore,
        aiResult.failureProbability,
        aiResult.confidence
      ]
    );

    // 5️⃣ Build Simulation
    const randomFactor = Math.random() * 100;

    const buildStatus =
      randomFactor < aiResult.failureProbability
        ? "Failed"
        : "Success";

    await pool.query(
      `INSERT INTO builds 
       (commit_id, status, duration_seconds, test_scope)
       VALUES ($1,$2,$3,$4)`,
      [
        commitId,
        buildStatus,
        buildTime,
        aiResult.selectedTests
      ]
    );

    res.json({
      message: "Simulated commit processed successfully",
      commitHash: randomHash,
      branch,
      buildTime,
      testDuration,
      failureRate,
      buildStatus
    });

  } catch (err) {
    console.error("SIMULATION ERROR:", err);
    res.status(500).json({ error: "Simulation failed" });
  }
});

export default router;