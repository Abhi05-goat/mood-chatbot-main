// New Component: TextInputForm.jsx
import React from "react";

function TextInputForm({ textInput, setTextInput, onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSubmit(textInput);
      setTextInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-input-form">
      <input
        type="text"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="Or type your message here..."
        className="text-input"
      />
      <button type="submit" className="send-btn">
        Send
      </button>
    </form>
  );
}

export default TextInputForm;
