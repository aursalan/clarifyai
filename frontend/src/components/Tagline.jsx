import React from "react";

const Tagline = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-center px-4">
      <p className="text-lg sm:text-xl md:text-2xl font-medium text-gray-600 dark:text-gray-300">
        Welcome to <span className="font-bold">ClarifyAI</span>.  
        Upload a PDF to start chatting with it.
      </p>
    </div>
  );
};

export default Tagline;
