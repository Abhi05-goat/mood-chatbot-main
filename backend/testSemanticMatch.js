const axios = require("axios");
const { CloudClient } = require("chromadb");

const embeddingDimension = 768; // Ollama gemma embedding dimension
const threshold = 0.7; // cosine similarity threshold

// === Chroma Cloud Client ===
const client = new CloudClient({
  apiKey: "ck-AH9oyvLh66mVyWtDdWauP9x2HZ4epWTtqbAcVabzxbFn",
  tenant: "a77f44a1-a0e7-4c47-be99-ba9fd4802ecf",
  database: "chat_embeddings",
});

let collection;

// === Ollama embedding function ===
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

async function getEmbedding(text) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
      model: "embeddinggemma",
      prompt: text,
    });

    if (response.data && response.data.embedding) {
      return response.data.embedding;
    } else {
      console.error("Unexpected Ollama response:", response.data);
      return [];
    }
  } catch (err) {
    console.error(
      "❌ Ollama embedding error:",
      err.response?.data || err.message
    );
    return [];
  }
}

// === Utility: Convert distance -> cosine similarity ===
function distanceToSimilarity(distance) {
  return 1 - distance;
}

async function testChroma() {
  const collectionName = "test_collection_ollama";

  try {
    // Use getOrCreateCollection to safely load or create
    collection = await client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: null, // Explicitly null since we provide embeddings manually
      embeddingDimensions: embeddingDimension,
      distanceFunction: "cosine",
    });
    console.log("✅ Loaded or created collection.");

    // Wipe old docs (get only IDs)
    const existing = await collection.get({ include: [] });
    const ids = existing.ids || [];
    if (ids.length > 0) {
      await collection.delete({ ids });
      console.log(`🧹 Cleared ${ids.length} old docs from collection.`);
    }
  } catch (err) {
    console.error("❌ Collection setup error:", err.message);
    if (err.message.includes("No embedding function configuration found")) {
      console.warn(
        "⚠️ Embedding function warning - safe to ignore since we provide embeddings manually."
      );
    } else {
      throw err; // Rethrow other errors
    }
  }

  // Simulated LLM-generated summaries (akin to our workflow: concise, fact-focused recaps of conversations)
  const summaries = [
    {
      id: "summary_1",
      text: "The user mentioned being 20 years old and from Chennai, Tamil Nadu. They expressed excitement about starting a new coding project involving AI chatbots. In the conversation on September 25, 2025, the user said: 'I'm 20 and live in Chennai.' The AI responded positively, noting the user's enthusiasm for tech.",
    },
    {
      id: "summary_2",
      text: "Conversation focused on education and height. The user is in their third year at Shiv Nadar University Chennai and stands at 6 feet 2 inches tall. They shared an opinion that university life is challenging but rewarding. Key fact: Height is 6'2\". Timestamp: September 26, 2025.",
    },
    {
      id: "summary_3",
      text: "The user discussed hobbies, enjoying coding in JavaScript and building chatbots. They mentioned a recent project with MERN stack and expressed frustration with debugging but overall positive outlook. No specific numbers, but they noted completing 5 coding sessions last week. Date: September 27, 2025.",
    },
    {
      id: "summary_4",
      text: "Unrelated summary for contrast: Discussion about fruits, where bananas are described as yellow and curved. The user prefers apples over bananas. Opinion: Bananas are too mushy. This was a light-hearted tangent on September 28, 2025.",
    },
  ];

  // Add summaries with embeddings
  for (const summary of summaries) {
    const embedding = await getEmbedding(summary.text);
    if (embedding.length > 0) {
      await collection.add({
        ids: [summary.id],
        documents: [summary.text],
        embeddings: [embedding],
        metadatas: [{ type: "summary" }],
      });
      console.log(
        `✅ Added summary: ${summary.id} - "${summary.text.substring(
          0,
          100
        )}..."`
      );
    }
  }

  // Single test query to check semantic similarity
  const queryText =
    "Tell me about your age, location, and any recent coding projects.";
  const queryEmbedding = await getEmbedding(queryText);

  if (queryEmbedding.length === 0) {
    console.error(`❌ Failed to get query embedding for: ${queryText}.`);
    return;
  }

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: summaries.length, // Get all for full comparison
  });

  console.log(`\n🔎 Test Query: "${queryText}"`);
  console.log("📊 Raw Results:", JSON.stringify(results, null, 2));

  // Convert distances -> similarities & sort by similarity descending
  const similarities = results.distances[0]
    .map((distance, i) => ({
      id: results.ids[0][i],
      text: results.documents[0][i],
      similarity: (1 - distance).toFixed(4),
    }))
    .sort((a, b) => b.similarity - a.similarity); // Sort descending to show most similar first

  console.log("\n✅ All Similarities (sorted by highest):");
  console.table(similarities);

  // Highlight the most similar
  const mostSimilar = similarities[0];
  console.log(
    `\n🏆 Most Semantically Similar: ID ${mostSimilar.id} with similarity ${mostSimilar.similarity}`
  );
  console.log(`Text: "${mostSimilar.text}"`);
}

testChroma().catch(console.error);
