"use client";

import ChatTutor from "@/components/ChatTutor";
import Link from "next/link";
import { useState } from "react";

export default function TutorPage() {
    const [isOpen, setIsOpen] = useState(true); // Always open in this view

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col pb-24">
            <header className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 bg-white dark:bg-black">
                <Link href="/" className="text-2xl">←</Link>
                <h1 className="text-xl font-bold">Personal Greek Tutor</h1>
            </header>

            <main className="flex-1 relative">
                {/* We reuse the ChatTutor component but force it open/embedded */}
                <ChatTutor
                    context="General Greek Tutor Mode. The user can ask any question about Greek. You are NOT bound to a specific lesson."
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                />
            </main>
            {/* Note: ChatTutor is a modal/drawer. We might want to adjust it to be inline if reusable, 
                but for now, let's trust its drawer behavior or modify it if needed. 
                Actually, ChatTutor is fixed position. Let's see if it works. 
             */}
        </div>
    );
}
