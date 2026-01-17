"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useEffect, useState } from "react";
import { getCurrentUser } from 'aws-amplify/auth';
import Link from "next/link";
import { FireIcon, BoltIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

const client = generateClient<Schema>();

export default function StatsPage() {
    const [userId, setUserId] = useState<string>("");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentUser().then(u => setUserId(u.userId)).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!userId) return;

        async function fetchStats() {
            try {
                const { data } = await client.models.UserProgress.list({
                    filter: { userId: { eq: userId } },
                    authMode: 'userPool'
                });
                if (data.length > 0) {
                    setStats(data[0]);
                }
            } catch (e) {
                console.error("Stats fetch error:", e);
            }
            setLoading(false);
        }
        fetchStats();
    }, [userId]);

    if (loading) return <div className="p-8 text-center">Loading Stats...</div>;

    if (!userId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
                    <p className="mb-8 text-gray-500">You need to sign in to track your progress.</p>
                    <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg">
                        Sign In
                    </Link>
                    <div className="mt-8">
                        <Link href="/" className="text-gray-400 text-sm">Back Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col pb-24">
            <header className="p-4 flex items-center gap-4 bg-white dark:bg-black shadow-sm">
                <Link href="/" className="text-2xl">←</Link>
                <h1 className="text-xl font-bold">Your Progress</h1>
            </header>

            <main className="p-6 space-y-6">

                {/* Hero Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <FireIcon className="w-6 h-6" />
                            <span className="font-bold uppercase tracking-wider text-xs">Streak</span>
                        </div>
                        <div className="text-4xl font-extrabold">{stats?.currentStreak || 0}</div>
                        <div className="text-sm opacity-75">Days</div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <BoltIcon className="w-6 h-6" />
                            <span className="font-bold uppercase tracking-wider text-xs">Total XP</span>
                        </div>
                        <div className="text-4xl font-extrabold">{stats?.xp || 0}</div>
                        <div className="text-sm opacity-75">Points</div>
                    </div>
                </div>

                {/* Topics Completed */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4">Completed Topics</h3>
                    <div className="space-y-2">
                        {(stats?.completedTopics || []).length === 0 ? (
                            <p className="text-gray-400 italic">No topics completed yet. Get started!</p>
                        ) : (
                            (stats?.completedTopics || []).filter((t: string | null) => t).map((topicId: string) => (
                                <div key={topicId} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    <span className="font-mono font-bold text-blue-500">{topicId}</span>
                                    <span className="text-sm font-medium">Completed</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
