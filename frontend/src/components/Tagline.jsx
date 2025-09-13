import React from "react";

const Tagline = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
          Hello, Explorer
        </h1>
        <p className="mt-1 text-lg font-light text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Let's begin. Upload a PDF to start asking questions.
        </p>
      </div>
    </div>
  );
};

export default Tagline;