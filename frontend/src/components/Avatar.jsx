// New Component: Avatar.jsx
import React from "react";

function Avatar({ src, listening }) {
  return (
    <div className="chatbot-avatar-wrap">
      <img src={src} alt="Soul 22" className={listening ? "glow-avatar" : ""} />
    </div>
  );
}

export default Avatar;
