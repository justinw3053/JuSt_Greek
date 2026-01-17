"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MatchingGame from "@/components/MatchingGame";

const client = generateClient<Schema>();

interface ReviewData {
    summary: string;
    keywords: { greek: string; english: string }[];
    matchingPairs: { id: string; item: string; match: string }[];
}

export default function ChapterPage() {
    const params = useParams();
    const chapterId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [reviewData, setReviewData] = useState<ReviewData | null>(null);
    const [topicCount, setTopicCount] = useState(0);

    const [errorMsg, setErrorMsg] = useState<string>("");

    useEffect(() => {
        if (!chapterId) return;

        async function fetchChapter() {
            try {
                // Fetch all topics for this chapter
                const { data: topics } = await client.models.Syllabus.list({
                    filter: { chapter: { eq: parseInt(chapterId) } }
                });

                if (topics.length > 0) {
                    setTopicCount(topics.length);

                    // Aggregate Content
                    let fullText = "";
                    topics.forEach(t => {
                        fullText += `Topic ${t.topicId}: ${t.title}\n${t.content}\n---\n`;
                    });

                    // Generate AI Review
                    const res = await fetch("/api/chapter-review", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chapterContent: fullText })
                    });

                    const data = await res.json();
                    if (data.review) {
                        setReviewData(data.review);
                    } else if (data.error) {
                        setErrorMsg(data.error);
                    } else {
                        setErrorMsg("Unknown API Error");
                    }
                } else {
                    setErrorMsg("No content found for this chapter.");
                }
            } catch (e: any) {
                console.error(e);
                setErrorMsg(e.message || "Network Error");
            } finally {
                setLoading(false);
            }
        }

        fetchChapter();
    }, [chapterId]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-500">Compiling Chapter Review...</p>
            </div>
        );
    }

    if (!reviewData) {
        return (
            <div className="p-8 text-center text-red-500 flex flex-col items-center justify-center min-h-screen">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-2">Failed to load review</h2>
                <p className="opacity-80 mb-4">{errorMsg || "Please try refreshing."}</p>
                <Link href="/" className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-700">Back Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <header className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gray-50/50 dark:bg-zinc-900/50 backdrop-blur">
                <Link href="/" className="text-2xl hover:scale-110 transition">←</Link>
                <div>
                    <span className="text-xs font-mono text-blue-500 uppercase">End of Chapter Review</span>
                    <h1 className="text-2xl font-bold leading-tight">Chapter {chapterId} Boss Level</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-8">

                {/* 1. Summary Card */}
                <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8 rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-bold mb-4">📜 Chapter {chapterId} Verified</h2>
                    <p className="text-blue-50 leading-relaxed text-lg">
                        {reviewData.summary}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm opacity-75">
                        <span>✅ {topicCount} Topics Analyzed</span>
                        <span>•</span>
                        <span>🧠 AI Generated</span>
                    </div>
                </section>

                {/* 2. Keywords */}
                <section>
                    <h3 className="font-bold text-gray-500 uppercase tracking-widest mb-4">Top 10 Keywords</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {reviewData.keywords.map((kw, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{kw.greek}</span>
                                <span className="text-gray-600 dark:text-gray-400">{kw.english}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Matching Game */}
                <section>
                    <MatchingGame
                        pairs={reviewData.matchingPairs}
                        onComplete={async () => {
                            try {
                                const user = await import('aws-amplify/auth').then(m => m.getCurrentUser()).catch(() => null);
                                if (!user) {
                                    alert("Great job! Sign in to save your XP.");
                                    return;
                                }

                                const now = new Date().toISOString();
                                const { data: progressList } = await client.models.UserProgress.list({
                                    filter: { userId: { eq: user.userId } }
                                });

                                // Boss Level Reward: 500 XP
                                if (progressList.length > 0) {
                                    const prog = progressList[0];
                                    await client.models.UserProgress.update({
                                        id: prog.id,
                                        xp: (prog.xp || 0) + 500,
                                        lastActivity: now
                                    });
                                } else {
                                    await client.models.UserProgress.create({
                                        userId: user.userId,
                                        xp: 500,
                                        currentStreak: 1,
                                        lastActivity: now,
                                        completedTopics: []
                                    });
                                }

                                alert("🎉 BOSS DEFEATED! \n\nYou earned 500 XP!");
                                window.location.href = "/stats";
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                    />
                </section>

            </main>
        </div>
    );
}
