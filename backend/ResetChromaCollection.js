const { CloudClient } = require("chromadb");

async function resetChromaCollection() {
  const client = new CloudClient({
    apiKey: "ck-AH9oyvLh66mVyWtDdWauP9x2HZ4epWTtqbAcVabzxbFn",
    tenant: "a77f44a1-a0e7-4c47-be99-ba9fd4802ecf",
    database: "chat_embeddings",
  });

  try {
    // Attempt to get existing collection
    const collection = await client.getCollection({ name: "mood_embeddings" });
    if (collection) {
      await collection.delete();
      console.log("Collection deleted successfully!");
    }
  } catch (err) {
    console.log("Collection does not exist or already deleted.");
  }

  // Recreate collection
  await client.getOrCreateCollection({ name: "mood_embeddings" });
  console.log("Collection recreated and ready to use!");
}

resetChromaCollection().catch(console.error);
