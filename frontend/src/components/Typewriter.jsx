import React, { useState, useEffect } from "react";

const Typewriter = ({ text, speed = 50 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // 1. Trim whitespace from the input text to prevent typing empty spaces at the start/end.
    const trimmedText = text.trim();
    setDisplayedText(""); // Reset text when the `text` prop changes
    setIsDone(false);

    // Ensure there's text to type after trimming
    if (trimmedText.length === 0) {
      setIsDone(true);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      // 2. Use a substring approach for cleaner and more reliable state updates.
      // We increment `i` first and then slice, so the first character is included.
      i++;
      setDisplayedText(trimmedText.substring(0, i));
      
      if (i >= trimmedText.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);

    // Cleanup function to clear the interval if the component unmounts
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="whitespace-pre-line">
      {displayedText}
      {/* 3. Added a visible cursor character for a better visual effect. */}
      <span
        className={`ml-1 transition-opacity duration-300 ${isDone ? "opacity-0" : "animate-pulse"}`}
      >
        .
      </span>
    </span>
  );
};

export default Typewriter;