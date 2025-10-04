const dotenv = require("dotenv");
dotenv.config(); // ensure .env is loaded here

const { Groq } = require("groq-sdk"); // import the Groq CLIENT needed to interact with Groq APIs.

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY missing. Check your .env file.");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // retrieve and store the Groq API key
});

/**
 * chatCompletion - a helper function to call the Groq chat API
 * @param {Array} messages - Array of messages in the form [{ role: "user", content: "..." }]
 * @param {string} model - Model name, e.g., "gemma3:4b"
 * @param {Object} options - Optional parameters like temperature, max_tokens
 * @returns {Promise<string>} - The generated content
 */
async function chatCompletion(messages, model = "gemma2-9b-it", options = {}) {
  try {
    const response = await groq.chat.completions.create({
      model,
      messages,
      ...options,
    });

    // Groq SDK returns the content in response.choices[0].message.content
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("❌ chatCompletion error:", error);
    throw error;
  }
}

module.exports = {
  groq,
  chatCompletion,
};
