// semanticCache.js

const axios = require("axios");
const { CloudClient } = require("chromadb");
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const client = new CloudClient({
  apiKey: "ck-AH9oyvLh66mVyWtDdWauP9x2HZ4epWTtqbAcVabzxbFn",
  tenant: "a77f44a1-a0e7-4c47-be99-ba9fd4802ecf",
  database: "chat_embeddings",
});

let collectionInstance = null;
let embeddingDims = 768; // fallback

async function embedText(text) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
      model: "embeddinggemma",
      prompt: text,
    });
    if (response.data && response.data.embedding) {
      return response.data.embedding;
    } else {
      console.error("Unexpected embedding response:", response.data);
      return null;
    }
  } catch (err) {
    console.error("Ollama embedText error:", err.response?.data || err.message);
    return null;
  }
}

async function initCollection() {
  try {
    // Probe dimensions once
    const testEmbedding = await embedText("test");
    if (testEmbedding && testEmbedding.length) {
      embeddingDims = testEmbedding.length;
    }
    collectionInstance = await client.getOrCreateCollection({
      name: "mood_embeddings",
      embeddingDimensions: embeddingDims,
    });
    console.log(
      `Connected to ChromaDB and initialized collection (dims=${embeddingDims})`
    );
  } catch (err) {
    console.error("Init collection error:", err.message, err.stack);
    throw err;
  }
}

function getCollection() {
  if (!collectionInstance) {
    throw new Error("Collection not initialized. Call initCollection() first.");
  }
  return collectionInstance;
}

async function addToSemanticCache(userId, standardizedText) {
  const collection = getCollection();
  const embedding = await embedText(standardizedText);
  if (!embedding) return;

  try {
    await collection.add({
      ids: [`std_${userId}_${Date.now()}`],
      embeddings: [embedding],
      metadatas: [
        {
          userId,
          timestamp: new Date().toISOString(),
          type: "standardized_embedding",
        },
      ],
      documents: [standardizedText],
    });
    console.log(`Added standardized text to semantic cache for user ${userId}`);
  } catch (err) {
    console.error("Add to semantic cache error:", err.message);
  }
}

async function getRelevantFromCache(
  userId,
  standardizedQuery,
  topK = 5,
  similarityThreshold = 0.6
) {
  const collection = getCollection();
  const queryEmbedding = await embedText(standardizedQuery);
  if (!queryEmbedding) return [];

  try {
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: { userId },
      include: ["documents", "metadatas", "distances"],
    });

    const filtered = [];
    for (let i = 0; i < results.ids[0].length; i++) {
      const similarity = 1 - results.distances[0][i];
      if (similarity >= similarityThreshold) {
        filtered.push({
          id: results.ids[0][i],
          document: results.documents[0][i],
          metadata: results.metadatas[0][i],
          similarity,
        });
      }
    }
    return filtered;
  } catch (err) {
    console.error("Query semantic cache error:", err.message);
    return [];
  }
}

module.exports = {
  initCollection,
  getCollection,
  embedText,
  addToSemanticCache,
  getRelevantFromCache,
};
