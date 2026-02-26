import express from "express";
import axios from "axios";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ==========================================
   AI OPTIMIZATION ROUTE
========================================== */
router.post("/optimize", async (req, res) => {
  try {
    const { repo, successRate, avgBuildTime, totalBuilds } = req.body;

    if (!repo) {
      return res.status(400).json({ message: "Repository required" });
    }

    const username = "Shashanks2004"; // your GitHub username

    /* ------------------------------
       Check GitHub Actions Workflow
    ------------------------------ */
    let workflowExists = false;

    try {
      const workflowRes = await axios.get(
        `https://api.github.com/repos/${username}/${repo}/contents/.github/workflows`
      );

      if (workflowRes.data && workflowRes.data.length > 0) {
        workflowExists = true;
      }
    } catch (err) {
      workflowExists = false;
    }

    /* ------------------------------
       Build AI Prompt
    ------------------------------ */
    const prompt = `
You are a senior DevOps consultant.

Analyze the CI performance data below and provide actionable recommendations.

Repository: ${repo}
Success Rate: ${successRate ?? 0}%
Average Build Time: ${avgBuildTime ?? 0} minutes
Total Builds: ${totalBuilds ?? 0}
Workflow Configured: ${workflowExists ? "Yes" : "No"}

Instructions:
- If workflow is missing, recommend creating a GitHub Actions CI pipeline.
- If success rate is low, suggest debugging strategies.
- If build time is high, suggest performance optimizations.
- Provide concise bullet-point recommendations.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const suggestion = completion.choices[0].message.content;

    res.json({ suggestion });

  } catch (error) {
    console.error("AI Optimize Error:", error.message);
    res.status(500).json({ message: "AI optimization failed" });
  }
});

/* ==========================================
   AI EXECUTIVE SUMMARY ROUTE
========================================== */
router.get("/summary/:repo", async (req, res) => {
  try {
    const { repo } = req.params;

    const prompt = `
You are a CIO-level DevOps advisor.

Provide a short executive summary (5-6 lines) about the CI/CD health
of the repository "${repo}". Focus on:
- Risk
- Stability
- Performance
- Improvement direction

Keep it concise and professional.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      summary: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error("AI Summary Error:", error.message);
    res.status(500).json({ summary: "Failed to generate summary." });
  }
});

export default router;