import React, { useState, useEffect, useRef } from 'react';

// --- ICONS ---
const MoreIcon = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
    </svg>
);

const PaperclipIcon = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 13V18.5C10 20.433 11.567 22 13.5 22C15.433 22 17 20.433 17 18.5V8.5C17 5.46243 14.5376 3 11.5 3C8.46243 3 6 5.46243 6 8.5V17C6 18.1046 6.89543 19 8 19C9.10457 19 10 18.1046 10 17V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SendIcon = (props) => (
     <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// --- Main App Component ---
const App = () => {
    const [fileName, setFileName] = useState('');
    const [question, setQuestion] = useState('');
    const [conversation, setConversation] = useState([{ sender: 'ai', text: 'Hello! Upload a PDF using the paperclip icon to get started.' }]);
    const [isProcessing, setIsProcessing] = useState(false);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const API_BASE_URL = "https://clarifyai-server.aursalansayed.workers.dev";
    const PDF_EXTRACTOR_API_URL = "https://aursalan-pdfreader.hf.space/extract-text";

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
            <header className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md z-10">
                <div className="w-full max-w-4xl mx-auto flex items-center p-4">
                    <img src="https://placehold.co/40x40/ffffff/7c3aed/png?text=C" alt="Avatar" className="w-10 h-10 rounded-full" />
                    <div className="ml-3">
                        <h1 className="font-bold text-lg">ClarityAI</h1>
                        <p className="text-sm opacity-80">{fileName ? fileName : 'Ready for your documents'}</p>
                    </div>
                    <button className="ml-auto text-white/80 hover:text-white">
                        <MoreIcon />
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
                    {conversation.map((msg, index) => {
                        if(msg.sender === 'system_processing') {
                            return (
                                <div key={index} className="flex justify-start">
                                    <div className="px-4 py-3 rounded-2xl inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                        <div className="flex items-center space-x-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        if(msg.sender === 'system_error') {
                             return (
                                <div key={index} className="text-center text-xs text-red-500 italic px-4">{msg.text}</div>
                            );
                        }
                        return (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-3 rounded-2xl inline-block max-w-xl break-words ${msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>
            </main>

            {/* Footer Input */}
            <footer className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <div className="w-full max-w-4xl mx-auto p-4">
                    <form onSubmit={handleAskQuestion} className="flex items-center space-x-3">
                        <input type="file" ref={fileInputRef} accept="application/pdf" className="hidden" onChange={handleFileChange} disabled={isProcessing}/>
                        <button type="button" onClick={() => fileInputRef.current.click()} disabled={isProcessing} className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <PaperclipIcon />
                        </button>
                        <label className="flex-1">
                            <input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                type="text"
                                placeholder="Type a message..."
                                className="w-full h-12 px-4 bg-gray-100 dark:bg-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-gray-900 dark:text-gray-100"
                                disabled={isProcessing}
                            />
                        </label>
                        <button type="submit" disabled={isProcessing || !question.trim()} className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </footer>
        </div>
    );
};

export default App;

