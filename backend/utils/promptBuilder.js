// utils/promptBuilder.js

function buildPrompt(
  rollingSummary,
  currentInput,
  mongoResults = [],
  chromaResults = []
) {
  // --- MongoDB facts ---
  let mongoText = "";
  if (Array.isArray(mongoResults) && mongoResults.length > 0) {
    mongoText = "Relevant context from MongoDB:\n";
    mongoResults.forEach((fact) => {
      mongoText += `- ${fact}\n`;
    });
  } else {
    mongoText = "No relevant MongoDB context found.\n";
  }

  // --- Chroma results ---
  let chromaText = "";
  if (Array.isArray(chromaResults) && chromaResults.length > 0) {
    chromaText = "Relevant context from ChromaDB (semantic similarity):\n";
    chromaResults.forEach((item) => {
      chromaText += `- [Sim: ${item.similarity?.toFixed(2) || "N/A"}] ${
        item.metadata?.timestamp || "Unknown"
      }: ${item.document}\n`;
    });
  } else {
    chromaText = "No relevant ChromaDB context found.\n";
  }

  return `
You are a mentor-style chatbot for students and young professionals.

This is the rolling summary of recent conversation (use if relevant):
${rollingSummary || "No summary available."}

${mongoText}

Current input: "${currentInput}"

GUIDELINES:
- Always check session context before responding.
- Be direct, calm, and supportive.
- If user just wants to talk or vent, simply listen and acknowledge.
- Do not automatically suggest tasks unless asked.
- When asked for help, give concise, practical suggestions.
- Subtly personalize using context.
- Avoid rephrasing user input.
- Match the user's tone.
- Keep responses short unless asked otherwise.
  `;
}

module.exports = { buildPrompt };
