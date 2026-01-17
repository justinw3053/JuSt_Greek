"use client";

import { useState } from "react";

interface ChatMessage {
    role: "user" | "bot";
    text: string;
}

export default function ChatTutor({ context }: { context?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        const newHistory = [...messages, { role: "user" as const, text: userMsg }];

        setMessages(newHistory);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newHistory, context }),
            });

            const data = await res.json();
            if (data.reply) {
                setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
            } else {
                setMessages((prev) => [...prev, { role: "bot", text: "Sorry, I encountered an error." }]);
            }
        } catch (err) {
            setMessages((prev) => [...prev, { role: "bot", text: "Connection error. Please try again." }]);
        }
        setLoading(false);
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-24 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition animate-bounce-slow"
                >
                    <span className="text-2xl">🤖</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 w-full md:w-96 md:bottom-24 md:right-6 h-[500px] bg-white dark:bg-zinc-900 shadow-2xl rounded-t-2xl md:rounded-2xl flex flex-col border border-gray-200 dark:border-gray-800 z-50">
                    {/* Header */}
                    <div className="p-4 bg-purple-600 text-white rounded-t-2xl flex justify-between items-center shadow-sm">
                        <h3 className="font-bold">Gemini AI Tutor</h3>
                        <button onClick={() => setIsOpen(false)} className="text-white opacity-80 hover:opacity-100 text-xl">
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/50">
                        {messages.length === 0 && (
                            <p className="text-center text-gray-500 text-sm mt-10">
                                Ask me anything about this lesson! <br /> I'm here to help.
                            </p>
                        )}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === "user"
                                    ? "bg-blue-600 text-white self-end ml-auto rounded-tr-none"
                                    : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 mr-auto rounded-tl-none"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-1 p-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900 rounded-b-2xl">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Type your question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={loading}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
