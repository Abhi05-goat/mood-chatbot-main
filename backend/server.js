// server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chatRoutes");
const { initCollection } = require("./services/semanticCache");
const Mood = require("./models/Mood"); // For index creation

dotenv.config();
connectDB(); // Connect to DB

const app = express();
app.use(cors());
app.use(express.json());

// Create MongoDB text index after DB connection
const createTextIndex = async () => {
  try {
    await Mood.collection.createIndex({ transcript: "text", response: "text" });
    console.log("Text index created on Mood collection");
  } catch (err) {
    if (err.codeName !== "IndexAlreadyExists") {
      console.error("Error creating text index:", err);
    }
  }
};

// Initialize everything
(async () => {
  await createTextIndex(); // Create index first

  try {
    await initCollection();
    console.log("Semantic cache initialized successfully");

    // Routes
    app.use("/chat", chatRoutes);

    // Test endpoint
    app.get("/", (req, res) => res.send("Backend is running!"));

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to initialize semantic cache:", err);
    process.exit(1);
  }
})();
