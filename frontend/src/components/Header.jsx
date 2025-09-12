import React from "react";

const Header = () => {
  return (
    <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur z-10">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-start p-4">
        <h1 className="font-bold text-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
          ClarifyAI
        </h1>
      </div>
    </header>
  );
};

export default Header;
