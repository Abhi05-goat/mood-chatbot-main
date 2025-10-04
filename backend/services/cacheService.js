// services/cacheService.js
const Mood = require("../models/Mood");
const { chatCompletion } = require("./ollamaClient");
const {
  getRelevantFromCache,
  addToSemanticCache,
  embedText,
  getCollection,
} = require("./semanticCache");

// In-memory running cache per user
const runningCache = {};

// --- Safe JSON parse ---
function safeJsonParse(llmOutput) {
  try {
    return JSON.parse(llmOutput);
  } catch {
    const match = llmOutput.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.error("[MongoDistill] JSON reparse failed:", e2.message);
      }
    }
    return { facts: [] }; // fallback
  }
}

// --- Extract intent & facts from raw Mongo documents ---
async function extractFactsFromMongo(userId, currentTranscript, mongoDocs) {
  console.log(`[MongoDistill] Transcript: "${currentTranscript}"`);
  console.log(`[MongoDistill] Raw Mongo docs (${mongoDocs.length}):`);
  console.log(JSON.stringify(mongoDocs, null, 2));

  const prompt = `
You are a precise fact extractor. Given the conversation logs below for a user and their current input, 
extract only the factual information that directly answers or is relevant to the user's query.

Rules:
- Only return valid JSON.
- Do not include explanations, commentary, or markdown.
- JSON format must be:
{ "facts": ["fact1", "fact2", ...] }

Current user input:
"${currentTranscript}"

Conversation logs:
${JSON.stringify(mongoDocs, null, 2)}
`;

  try {
    const llmResponse = await chatCompletion(
      [{ role: "user", content: prompt }],
      "llama3.1:8b",
      { max_tokens: 200, temperature: 0.0, format: "json" } // enforce JSON
    );

    console.log("[MongoDistill] Raw LLM response:", llmResponse);

    const parsed = safeJsonParse(llmResponse);
    console.log("[MongoDistill] Parsed facts:", parsed.facts || []);
    return parsed.facts || [];
  } catch (err) {
    console.error("[MongoDistill] Fact extraction error:", err.message);
    return [];
  }
}

// --- Fetch cache ---
async function getCache(userId, currentTranscript) {
  // --- MongoDB keyword lookup (raw) ---
  const rawMongoDocs = await Mood.find({
    userId,
    $text: { $search: currentTranscript },
  })
    .sort({ timestamp: -1 })
    .limit(15)
    .lean();

  // --- Distill relevant facts from Mongo ---
  const mongoResults = await extractFactsFromMongo(
    userId,
    currentTranscript,
    rawMongoDocs
  );

  // --- Chroma retrieval ---
  //const chromaResults = await getRelevantFromCache(userId, currentTranscript);

  // --- Prepare rolling cache ---
  if (!runningCache[userId]) runningCache[userId] = [];
  const cachePairs = runningCache[userId];

  // --- Generate rolling summary from running cache (<=6 pairs) ---
  let rollingSummary = "";
  if (cachePairs.length > 0) {
    const combinedText = cachePairs
      .map(
        (p) =>
          `User: ${p.transcript}\nAI: ${p.response} (Mood: ${
            p.moodScore || "N/A"
          })`
      )
      .join("\n\n");

    const prompt = `
      You are a precise summarizer. Summarize the following conversation pairs concisely,
      highlighting key points, moods, and relevant details in as many words as you want:
      ${combinedText}
    `;

    try {
      const llmResponse = await chatCompletion(
        [{ role: "user", content: prompt }],
        "gemma3:4b",
        { max_tokens: 200, temperature: 0.4 }
      );
      rollingSummary = llmResponse?.trim() || "No summary generated.";
    } catch (err) {
      console.error("Rolling summary generation error:", err.message);
      rollingSummary = "Neutral conversation summary.";
    }
  }

  return { mongoResults, rollingSummary, cachePairs };
}

// --- Update cache ---
async function updateCache(userId, newMood) {
  if (!runningCache[userId]) runningCache[userId] = [];
  runningCache[userId].push(newMood);
  if (runningCache[userId].length > 6) runningCache[userId].shift(); // keep ≤6

  const pairText = `User: ${newMood.transcript}\nAI: ${newMood.response}`;
  let pairSummary = "";
  try {
    const prompt = `
      You are a precise summarizer. Summarize this single conversation pair in detail:
      ${pairText}
    `;
    const llmResponse = await chatCompletion(
      [{ role: "user", content: prompt }],
      "gemma3:4b",
      { max_tokens: 150, temperature: 0.3 }
    );
    pairSummary = llmResponse?.trim() || pairText;
  } catch (err) {
    console.error("Pair summary generation error:", err.message);
    pairSummary = pairText;
  }

  try {
    const embedding = await embedText(pairSummary);
    if (embedding.length) {
      const collection = getCollection();
      await collection.add({
        ids: [`pair_${userId}_${Date.now()}`],
        embeddings: [embedding],
        metadatas: [
          {
            userId,
            timestamp: new Date().toISOString(),
            type: "pair_summary",
            moodScore: newMood.moodScore,
          },
        ],
        documents: [pairSummary],
      });
      console.log(
        `[CacheService] Added pair summary to semantic cache for user ${userId}`
      );
    }
  } catch (err) {
    console.error("[CacheService] Add pair summary error:", err.message);
  }
}

module.exports = { getCache, updateCache };
