"use client";

import ChatTutor from "@/components/ChatTutor";
import Link from 'next/link';
import { useState } from "react";

export default function TutorPage() {
    const [isChatOpen, setIsChatOpen] = useState(true); // Always open essentially

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col p-6 pb-24">
            <header className="mb-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                <h1 className="text-2xl font-bold">Global Tutor</h1>
                <Link href="/" className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">✕</Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-6xl mb-4">🏛️</div>
                <h2 className="text-xl font-bold">Your Personal Greek Tutor</h2>
                <p className="text-gray-500 max-w-sm">
                    Ask me anything about grammar, vocabulary, or culture. I'm not tied to a specific lesson here.
                </p>

                <div className="hidden md:block text-sm text-gray-400 mt-8">
                    (On Desktop, the chat window is bottom-right. On Mobile, it takes over.)
                </div>
            </main>

            <ChatTutor
                context="You are a general Greek Language Tutor. The user is asking general questions not tied to a specific lesson. Be helpful and accurate."
                isOpen={isChatOpen}
                setIsOpen={setIsChatOpen}
            />

            {/* Footer Nav Integration */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-around shadow-lg z-50">
                <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-blue-500">
                    <span className="text-xl">🏠</span>
                    <span className="text-xs">Home</span>
                </Link>
                <Link href="/stats" className="flex flex-col items-center text-gray-400 hover:text-blue-500">
                    <span className="text-xl">🔥</span>
                    <span className="text-xs">Stats</span>
                </Link>
                <Link href="/tutor" className="flex flex-col items-center text-blue-600">
                    <span className="text-xl">🤖</span>
                    <span className="text-xs">Tutor</span>
                </Link>
            </div>
        </div>
    );
}
