function parseResponse(completion) {
  try {
    // Extract raw content safely
    let rawContent = completion?.choices?.[0]?.message?.content?.trim() || "";
    if (!rawContent) {
      throw new Error("No content found in response");
    }

    // Attempt to match and parse as JSON object
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.response || "Sorry, I didn't quite get that.";
    }

    // If not JSON, try regex for "response": "value" (improved to handle escaped quotes or variations)
    const responseMatch = rawContent.match(
      /"response"\s*:\s*"([^"]*(?:""[^"]*)*)"/
    );
    if (responseMatch) {
      return responseMatch[1].replace(/""/g, '"'); // Unescape any double quotes
    }

    // Ultimate fallback: return the cleaned raw content (remove any leading/trailing junk)
    return (
      rawContent.replace(/^\s*Based on.*?:?\s*/i, "").trim() ||
      "Sorry, I didn't quite get that."
    );
  } catch (err) {
    console.error("Parse error:", err);
    // Safest fallback: raw content if available
    return (
      completion?.choices?.[0]?.message?.content || "Error parsing response"
    );
  }
}

module.exports = { parseResponse };
