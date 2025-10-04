// services/detectionService.js
const { chatCompletion } = require("./ollamaClient");

async function detectMood(transcript) {
  const detectionPrompt = `
Analyze this user message: "${transcript}"

Return valid JSON:
{
  "moodScore": number (1 very negative → 10 very positive),
  "analysis": "short explanation"
}
`;

  try {
    const raw = await chatCompletion([
      { role: "user", content: detectionPrompt },
    ]);
    let cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("[Mood Parse Error]:", err, "Raw:", raw);
      return { moodScore: 5, analysis: "defaulted due to parse error" };
    }

    return {
      moodScore: parsed.moodScore ?? 5,
      analysis: parsed.analysis ?? "no analysis",
    };
  } catch (err) {
    console.error("[Mood Detection Error]:", err.message);
    return { moodScore: 5, analysis: "defaulted due to detection error" };
  }
}

module.exports = { detectMood };
