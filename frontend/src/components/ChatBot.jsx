// ChatBot.jsx (Parent component managing state)
import React, { useState, useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import soul22 from "../assets/soul22.svg";
import axios from "axios";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "../styles/ChatBot.css";
import VoiceToggle from "./VoiceToggle"; // New component
import TextInputForm from "./TextInputForm"; // New component
import ChatWindow from "./ChatWindow"; // New component
import Avatar from "./Avatar"; // New component

const chatbotQuestions = [
  "Hi! How are you really feeling today?",
  "What's one word to describe your mood?",
  "Would you like to share what's causing that feeling, or just chat?",
  "On a scale of 1-10, how energized do you feel?",
];

function ChatBot({ moodLog, setMoodLog }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const [messages, setMessages] = useState([
    { type: "chatbot", text: chatbotQuestions[0] },
  ]);
  const [step, setStep] = useState(0);
  const [textInput, setTextInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  // Log live transcript changes for testing
  useEffect(() => {
    if (listening && transcript) {
      console.log("Live transcript:", transcript);
    }
  }, [transcript, listening]);

  // Process voice input
  useEffect(() => {
    let timeout;
    if (listening && transcript) {
      timeout = setTimeout(async () => {
        await processMessage(transcript);
        resetTranscript();
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [transcript, listening, resetTranscript, setMoodLog]);

  // Shared message processing function
  const processMessage = async (inputText) => {
    console.log("Processed input:", inputText);
    try {
      console.log("Calling AI backend...");
      const response = await axios.post("http://localhost:5000/chat", {
        transcript: inputText,
      });
      const { response: aiResponse, moodScore } = response.data;
      console.log("AI Response:", aiResponse);
      console.log("Mood Score:", moodScore);

      setMessages((prev) => [
        ...prev,
        { type: "user", text: inputText },
        { type: "chatbot", text: aiResponse },
      ]);

      setMoodLog((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          moodScore,
          notes: inputText,
        },
      ]);

      setStep((prev) => prev + 1);
    } catch (error) {
      console.error("AI Backend Error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "user", text: inputText },
        {
          type: "chatbot",
          text: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    }
  };

  // Define handleVoiceToggle here (ensure it's before the return)
  const handleVoiceToggle = () => {
    if (!listening) {
      SpeechRecognition.startListening({ continuous: true });
    } else {
      SpeechRecognition.stopListening();
      resetTranscript();
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <div>Browser does not support speech recognition.</div>;
  }

  return (
    <div className={`chatbot-box ${listening ? "listening-bg" : ""}`}>
      <Avatar src={soul22} listening={listening} />
      <ChatWindow
        messages={messages}
        listening={listening}
        transcript={transcript}
        chatEndRef={chatEndRef}
      />
      <VoiceToggle
        listening={listening}
        onToggle={handleVoiceToggle} // Pass the defined function
      />
      <TextInputForm
        textInput={textInput}
        setTextInput={setTextInput}
        onSubmit={processMessage}
      />
    </div>
  );
}

export default ChatBot;
