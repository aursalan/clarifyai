import React, { useRef, useEffect } from "react";
import Typewriter from "./Typewriter"; // import your custom typewriter

const ChatUI = ({ conversation }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      {conversation.map((msg, index) => {
        if (msg.sender === "system_processing") {
          return (
            <div key={index} className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl inline-block bg-white dark:bg-gray-700 text-white dark:text-gray-200">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-0"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></span>
                </div>
              </div>
            </div>
          );
        }

        if (msg.sender === "system_error") {
          return (
            <div key={index} className="text-center text-xs text-red-500 px-4">
              {msg.text}
            </div>
          );
        }

        if (msg.sender === "user") {
          return (
            <div key={index} className="flex justify-end">
              <div className="px-4 py-3 rounded-2xl inline-block max-w-xl break-words whitespace-pre-line leading-relaxed tracking-normal bg-[#DDE3EA] text-black dark:bg-gray-700 dark:text-gray-100 ">
                {msg.text}
              </div>
            </div>
          );
        }

        if (msg.sender === "ai") {
          return (
            <div key={index} className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 inline-block max-w-xl break-words whitespace-pre-line leading-relaxed tracking-normal bg-white dark:bg-transparent text-black dark:text-gray-100">
                <Typewriter text={msg.text} speed={30} />
              </div>
            </div>
          );
        }

        return null;
      })}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatUI;
