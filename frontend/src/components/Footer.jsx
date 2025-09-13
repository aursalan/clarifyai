import React from "react";
import PaperclipIcon from "../assets/paperclip.png";
import SendIcon from "../assets/arrow-right.png";

const Footer = ({
  question,
  setQuestion,
  handleFileChange,
  handleAskQuestion,
  isProcessing,
  fileInputRef,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2">
      <form onSubmit={handleAskQuestion} className="relative">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {/* Textarea */}
        <textarea
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            const ta = e.target;
            ta.style.height = "auto";
            const MAX_HEIGHT = 240;
            const newHeight = Math.min(ta.scrollHeight, MAX_HEIGHT);
            ta.style.height = `${newHeight}px`;
            ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
          }}
          rows={1}
          placeholder="Type a message..."
          className="w-full min-h-[56px] max-h-[240px] pl-12 pr-16 py-[13px] resize-none
            bg-white dark:bg-gray-700 rounded-2xl border
            border-gray-200 dark:border-gray-600 focus:outline-none
            text-gray-900 dark:text-gray-100 no-scrollbar"
          disabled={isProcessing}
          style={{ lineHeight: "24px", overflowY: "hidden" }}
        />

        {/* Left Icon (Paperclip) */}
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          disabled={isProcessing}
          className="absolute left-3 bottom-5.5 text-gray-500 dark:text-gray-400 hover:opacity-70 "
        >
          <img src={PaperclipIcon} alt="Attach" className="w-6 h-6 dark:invert" />
        </button>

        {/* Right Icon (Send) */}
        <button
          type="submit"
          disabled={isProcessing || !question.trim()}
          className="absolute right-3 bottom-[15px] bg-[#E3E7EC] dark:bg-transparent dark:border dark:border-gray-400 p-2 
            rounded-xl hover:opacity-90 transition 
            disabled:opacity-50 disabled:cursor-not-allowed "
        >
          <img src={SendIcon} alt="Send" className="w-5 h-5 dark:invert" />
        </button>
      </form>

      {/* Disclaimer */}
      <p className="text-[13px] mb-5 text-gray-500 dark:text-gray-400 text-center">
        ClarifyAI can make mistakes sometimes.
      </p>
    </div>
  );
};

export default Footer;
