import React, { useRef, useEffect } from "react";
import Typewriter from "typewriter-effect";

const ChatUI = ({ conversation }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  return (
    <main className="flex-1 overflow-y-auto px-2 sm:px-4 pt-20 pb-24"> 
      {/* pt-20 = space for header, pb-24 = space for footer */}
      <div className="max-w-4xl mx-auto p-2 sm:p-4 space-y-4">
        {conversation.map((msg, index) => {
          if (msg.sender === "system_processing") {
            return (
              <div key={index} className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl inline-block bg-blue-500 dark:bg-gray-700 text-white dark:text-gray-200">
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse delay-300"></span>
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
                <div className="px-4 py-3 rounded-2xl inline-block max-w-xl break-words bg-[#DDE3EA] text-black">
                  {msg.text}
                </div>
              </div>
            );
          }
          if (msg.sender === "ai") {
            return (
              <div key={index} className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl border border-gray-200 inline-block max-w-xl break-words bg-white dark:bg-gray-700 text-black dark:text-gray-100">
                  <Typewriter
                    options={{
                      strings: msg.text,
                      autoStart: true,
                      delay: 30,
                    }}
                  />
                </div>
              </div>
            );
          }
          return null;
        })}
        <div ref={chatEndRef} />
      </div>
    </main>
  );
};

export default ChatUI;
