const axios = require("axios");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

async function chatCompletion(
  messages,
  model = "gemma3:4b",
  options = {},
  stream = false
) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
      model,
      messages,
      stream: false, // <-- full response at once
      options,
    });

    if (response.data && response.data.message) {
      return response.data.message.content;
    } else {
      console.error("Unexpected Ollama response:", response.data);
      return "";
    }
  } catch (err) {
    console.error(
      "❌ Ollama chatCompletion error:",
      err.response?.data || err.message
    );
    return "Error: unable to fetch response from model";
  }
}

module.exports = { chatCompletion };
