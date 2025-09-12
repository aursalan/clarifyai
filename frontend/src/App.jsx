import React, { useState, useEffect, useRef } from 'react';
import Logo from "./assets/icon.png";
import MoreIcon from "./assets/more.png";
import PaperclipIcon from "./assets/paperclip.png";
import SendIcon from "./assets/arrow-right.png";

// --- Main App Component ---
const App = () => {
    const [fileName, setFileName] = useState('');
    const [question, setQuestion] = useState('');
    const [conversation, setConversation] = useState([{ sender: 'ai', text: 'Welcome to ClarifyAI. You can turn your PDFs into conversations. Upload a PDF and start chatting now!' }]);
    const [isProcessing, setIsProcessing] = useState(false);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const API_BASE_URL = "https://clarifyai-server.aursalansayed.workers.dev";
    const PDF_EXTRACTOR_API_URL = "https://aursalan-pdf-reader.hf.space/extract-text";

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation]);
    
    useEffect(() => {
        document.documentElement.classList.add('dark'); // Default to dark mode for aesthetics
    }, []);


    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setConversation(prev => [...prev, { sender: 'system_processing' }]);
        
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const extractResponse = await fetch(PDF_EXTRACTOR_API_URL, { method: "POST", body: formData });
            if (!extractResponse.ok) throw new Error(`HTTP error! Status: ${extractResponse.status}`);
            const { text } = await extractResponse.json();

            const chunks = text.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 0);
            
            await fetch(`${API_BASE_URL}/api/ingest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chunks }),
            });
            
            setConversation(prev => [
                ...prev.filter(msg => msg.sender !== 'system_processing'), 
                { sender: 'ai', text: `All set! I'm ready to answer questions about "${file.name}".` }
            ]);
        } catch (error) {
            console.error("Error processing PDF:", error);
            setConversation(prev => [
                ...prev.filter(msg => msg.sender !== 'system_processing'), 
                { sender: 'system_error', text: `Couldn't process the file. Please try again.` }
            ]);
        } finally {
            setIsProcessing(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!question.trim() || isProcessing || !fileName) {
            if(!fileName && question.trim()) {
                 setConversation(prev => [...prev, { sender: 'system_error', text: "Please upload a PDF first." }]);
            }
            setQuestion('');
            return;
        };

        const userMessage = { sender: 'user', text: question };
        setConversation(prev => [...prev, userMessage, { sender: 'system_processing' }]);
        setQuestion('');
        setIsProcessing(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            
            setConversation(prev => [
                ...prev.filter(msg => msg.sender !== 'system_processing'), 
                { sender: 'ai', text: data.answer }
            ]);
        } catch (error) {
            console.error("Query error:", error);
            setConversation(prev => [
                ...prev.filter(msg => msg.sender !== 'system_processing'), 
                { sender: 'system_error', text: `Sorry, I had trouble responding. Please try again.` }
            ]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col font-sans bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            {/* Header */}
            <header className="flex-shrink-0 bg-white/1 z-10 backdrop-blur-none">
                <div className="w-full max-w-4xl mx-auto flex items-center justify-left p-4">
                    <h1 className="font-bold text-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                        ClarifyAI
                    </h1>
                </div>
            </header>



            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
                    {conversation.map((msg, index) => {
                        if(msg.sender === 'system_processing') {
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
                        if(msg.sender === 'system_error') {
                             return (
                                <div key={index} className="text-center text-xs text-red-500 px-4">{msg.text}</div>
                            );
                        }
                        return (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-3 rounded-2xl inline-block max-w-xl break-words ${msg.sender === 'user' ? 'bg-[#DDE3EA] text-black' : 'bg-[#DDE3EA] dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>
            </main>

            {/* Footer Input */}
            <footer className="flex-shrink-0">
                <div className="w-full max-w-4xl mx-auto px-4 mb-4">
                    <form
                        onSubmit={handleAskQuestion}
                        className="relative"
                    >
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="application/pdf"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                        />

                        {/* Textarea (auto-resizes up to 10 lines) */}
                        <textarea
                            value={question}
                            onChange={(e) => {
                                setQuestion(e.target.value);

                                const ta = e.target;
                                ta.style.height = "auto"; // reset
                                const MAX_HEIGHT = 240; // ~10 lines at 24px line-height
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

                        {/* Left Icon (Paperclip) - pinned to bottom */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isProcessing}
                            className="absolute left-3 bottom-5.5 text-gray-500 dark:text-gray-400 hover:opacity-70"
                        >
                            <img src={PaperclipIcon} alt="Attach" className="w-6 h-6" />
                        </button>

                        {/* Right Icon (Send) - pinned to bottom */}
                        <button
                            type="submit"
                            disabled={isProcessing || !question.trim()}
                            className="absolute right-3 bottom-[15px] bg-[#E3E7EC] dark:bg-gray-600 p-2 
                   rounded-xl hover:opacity-90 transition 
                   disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <img src={SendIcon} alt="Send" className="w-5 h-5" />
                        </button>
                    </form>
                    {/* Disclaimer text */}
                    <p className="mt-2 text-[12px] text-gray-500 dark:text-gray-400 text-center">
                        ClarifyAI can make mistakes sometimes.
                    </p>
                </div>
            </footer>

        </div>
    );
};

export default App;

