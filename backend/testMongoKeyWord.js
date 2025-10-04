// testTranscript.js

const mongoose = require("mongoose");
const readline = require("readline");
const { chatCompletion } = require("./services/ollamaClient");

// --- Define schema & model pointing to the correct collection ---
const MoodSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "moods" }
);
const Mood = mongoose.model("Mood", MoodSchema);

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
    return { facts: [] };
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

// --- Main function ---
async function runTest() {
  await mongoose.connect("mongodb://localhost:27017/mood-chatbot", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter transcript: ", async (transcript) => {
    try {
      // --- Fetch top 5 Mongo documents matching transcript using regex ---
      const rawMongoDocs = await Mood.find({
        $or: [
          { transcript: { $regex: transcript, $options: "i" } },
          { response: { $regex: transcript, $options: "i" } },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(8)
        .lean();

      console.log("Mongo docs found:", rawMongoDocs.length);

      // --- Extract facts from Mongo docs using LLM ---
      const facts = await extractFactsFromMongo(null, transcript, rawMongoDocs);

      console.log("\n--- Final Extracted Facts ---");
      console.log(facts);
    } catch (err) {
      console.error("Error during test:", err.message);
    } finally {
      rl.close();
      mongoose.connection.close();
    }
  });
}

runTest();
