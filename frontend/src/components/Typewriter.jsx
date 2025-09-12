import React, { useState, useEffect } from "react";

const Typewriter = ({ text, speed = 30 }) => {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="whitespace-pre-line">
      {displayed}
      <span
        className={`ml-0.5 ${isDone ? "opacity-100" : "animate-pulse"}`}
      >
      </span>
    </span>
  );
};

export default Typewriter;
