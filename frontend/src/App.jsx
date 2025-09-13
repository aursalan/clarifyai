import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import ChatUI from "./components/ChatUI";
import Footer from "./components/Footer";
import Tagline from "./components/Tagline";

const App = () => {
  const [fileName, setFileName] = useState("");
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE_URL = "https://clarifyai-server.aursalansayed.workers.dev";
  const PDF_EXTRACTOR_API_URL = "https://aursalan-pdf-reader.hf.space/extract-text";

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // --- File Upload ---
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setConversation((prev) => [...prev, { sender: "system_processing" }]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const extractResponse = await fetch(PDF_EXTRACTOR_API_URL, {
        method: "POST",
        body: formData,
      });
      if (!extractResponse.ok)
        throw new Error(`HTTP error! Status: ${extractResponse.status}`);
      const { text } = await extractResponse.json();

      const chunks = text
        .split(/\n\s*\n/)
        .filter((chunk) => chunk.trim().length > 0);

      await fetch(`${API_BASE_URL}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunks }),
      });

      setConversation((prev) => [
        ...prev.filter((msg) => msg.sender !== "system_processing"),
        { sender: "ai", text: `All set! I'm ready to answer questions about "${file.name}".` },
      ]);
    } catch (error) {
      console.error("Error processing PDF:", error);
      setConversation((prev) => [
        ...prev.filter((msg) => msg.sender !== "system_processing"),
        { sender: "system_error", text: `Couldn't process the file. Please try again.` },
      ]);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- Ask Question ---
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || isProcessing || !fileName) {
      if (!fileName && question.trim()) {
        setConversation((prev) => [
          ...prev,
          { sender: "system_error", text: "Please upload a PDF first." },
        ]);
      }
      setQuestion("");
      return;
    }

    const userMessage = { sender: "user", text: question };
    setConversation((prev) => [...prev, userMessage, { sender: "system_processing" }]);
    setQuestion("");
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();

      setConversation((prev) => [
        ...prev.filter((msg) => msg.sender !== "system_processing"),
        { sender: "ai", text: data.answer },
      ]);
    } catch (error) {
      console.error("Query error:", error);
      setConversation((prev) => [
        ...prev.filter((msg) => msg.sender !== "system_processing"),
        { sender: "system_error", text: `Sorry, I had trouble responding. Please try again.` },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-10 w-full bg-white dark:bg-gray-900 h-10 flex items-center">
        <Header />
      </header>

      {/* Middle Content (scrollable) */}
      <main className="flex-1 overflow-y-auto pt-16 pb-20 bg-white dark:bg-gray-900 dark:text-gray-100">
        {fileName ? (
          <ChatUI conversation={conversation} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Tagline />
          </div>
        )}
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 w-full bg-white dark:bg-gray-900 h-20 flex items-center">
        <Footer
          question={question}
          setQuestion={setQuestion}
          handleFileChange={handleFileChange}
          handleAskQuestion={handleAskQuestion}
          isProcessing={isProcessing}
          fileInputRef={fileInputRef}
        />
      </footer>
    </div>
  );
};

export default App;
