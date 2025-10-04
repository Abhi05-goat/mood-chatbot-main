// New Component: VoiceToggle.jsx
import React from "react";

function VoiceToggle({ listening, onToggle }) {
  return (
    <div className="voice-ui-bar">
      <button
        className={`voice-btn ${listening ? "active" : ""}`}
        onClick={onToggle}
      >
        {listening ? "Stop Listening" : "Press to Speak"}
      </button>
      <span className={listening ? "listening-dot" : ""} />
      <span className="voice-ui-label">{listening ? "Listening..." : ""}</span>
    </div>
  );
}

export default VoiceToggle;
