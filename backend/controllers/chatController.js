// controllers/chatController.js
const Mood = require("../models/Mood");
const { chatCompletion } = require("../services/groqClient");
//const { chatCompletion } = require("../services/ollamaClient");
const { detectMood } = require("../services/detectionService");
const { getCache, updateCache } = require("../services/cacheService");
const { buildPrompt } = require("../utils/promptBuilder");
const { parseResponse } = require("../utils/responseParser");

async function handleChat(req, res) {
  try {
    const { transcript, userId = "default" } = req.body;

    // --- Detect moodScore from transcript ---
    const { moodScore, analysis: moodScoreAnalysis } = await detectMood(
      transcript
    );
    console.log(`[Mood] Score: ${moodScore}, Analysis: ${moodScoreAnalysis}`);

    // --- Fetch cache (MongoDB + Chroma + rolling summary) ---
    const cache = await getCache(userId, transcript);

    // --- Build final prompt ---
    const combinedPrompt = buildPrompt(
      cache.rollingSummary,
      transcript,
      cache.mongoResults
    );

    console.log("[Prompt] Final prompt:\n", combinedPrompt);

    // --- Model call ollama ---
    // const rawContent = await chatCompletion(
    //   [{ role: "user", content: combinedPrompt }],
    //   "gemma3:4b",
    //   { temperature: 0.6, max_tokens: 400 }
    // );

    // --- Model call Groq ---
    const rawContent = await chatCompletion(
      [{ role: "user", content: combinedPrompt }],
      "gemma2-9b-it",
      { temperature: 0.6, max_tokens: 400 }
    );

    console.log(rawContent);

    const aiResponse = parseResponse({
      choices: [{ message: { content: rawContent } }],
    });

    // --- Save full conversation to MongoDB ---
    const newMood = new Mood({
      userId,
      transcript,
      moodScore,
      moodScoreAnalysis,
      response: aiResponse,
    });
    await newMood.save();
    console.log(`[DB] Mood+response saved for user ${userId}`);

    // --- Update running cache + embed pair summary ---
    await updateCache(userId, newMood);

    res.json({ response: aiResponse, moodScore });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Something went wrong",
      response: "I'm having trouble right now. Try again in a moment.",
      moodScore: 5,
    });
  }
}

module.exports = { handleChat };
