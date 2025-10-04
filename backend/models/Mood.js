const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  transcript: String,
  moodScore: Number,
  moodScoreAnalysis: String,
  response: String,
});

module.exports = mongoose.model("Mood", moodSchema); // export the moodSchema
