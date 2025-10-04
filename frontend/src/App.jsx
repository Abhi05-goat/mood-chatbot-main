import React, { useState } from "react";
import ChatBot from "./components/ChatBot";
import Footer from "./components/Footer";
import "./styles/index.css";

export default function App() {
  const [moodLog, setMoodLog] = useState([]);
  return (
    <div className="container">
      <h1>Mood Chatbot</h1>
      <ChatBot moodLog={moodLog} setMoodLog={setMoodLog} />
      <Footer />
    </div>
  );
}
