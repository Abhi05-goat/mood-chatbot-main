// New Component: ChatWindow.jsx
import React from "react";
import ChatBubble from "./ChatBubble";

function ChatWindow({ messages, listening, transcript, chatEndRef }) {
  return (
    <div className="chat-window">
      {messages.map((msg, idx) => (
        <ChatBubble
          key={idx}
          type={msg.type}
          text={msg.text}
          glowing={listening && msg.type === "chatbot"}
        />
      ))}
      {listening && transcript && (
        <ChatBubble type="user" text={transcript} glowing />
      )}
      <div ref={chatEndRef} />
    </div>
  );
}

export default ChatWindow;
