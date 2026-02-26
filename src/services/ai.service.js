import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

// 🔥 Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🔁 Rule-based fallback
const ruleBasedAnalysis = (commitData) => {
  let riskLevel = "LOW";
  let failureProbability = 20;

  if (commitData.files_changed > 20) {
    riskLevel = "MEDIUM";
    failureProbability = 50;
  }

  if (commitData.files_changed > 40) {
    riskLevel = "HIGH";
    failureProbability = 80;
  }

  return {
    riskLevel,
    failureProbability,
    confidence: 75,
    selectedTests:
      riskLevel === "HIGH"
        ? "full-suite"
        : riskLevel === "MEDIUM"
        ? "regression"
        : "unit",
    explanation: "Fallback rule-based evaluation used."
  };
};

export const analyzeCommit = async (commitData) => {
  try {
    const prompt = `
You are an enterprise CI/CD risk analysis AI.

Analyze this commit:

Message: ${commitData.message}
Files Changed: ${commitData.files_changed}
Lines Added: ${commitData.lines_added}
Branch: ${commitData.branch_name}

Return ONLY valid JSON in this format:

{
  "riskLevel": "LOW | MEDIUM | HIGH",
  "failureProbability": number,
  "confidence": number,
  "selectedTests": "unit | regression | full-suite",
  "explanation": "short executive explanation"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    const content = response.choices[0].message.content;

    return JSON.parse(content);

  } catch (error) {
    console.error("OpenAI failed, using fallback:", error.message);
    return ruleBasedAnalysis(commitData);
  }
};

export default openai;