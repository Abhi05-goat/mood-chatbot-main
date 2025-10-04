import React from "react";
import "../styles/ChatBubble.css";

function ChatBubble({ type, text, glowing }) {
  return (
    <div className={`bubble ${type}${glowing ? " glowing" : ""}`}>{text}</div>
  );
}
export default ChatBubble;
