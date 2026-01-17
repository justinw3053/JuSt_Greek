"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function StatsPage() {
    const [user, setUser] = useState<any>(null);
    const [progress, setProgress] = useState<Schema["UserProgress"]["type"] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const u = await getCurrentUser();
                setUser(u);

                const { data: items } = await client.models.UserProgress.list({
                    filter: { userId: { eq: u.userId } }
                });

                if (items.length > 0) setProgress(items[0]);
            } catch (e) {
                // Guest
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading Stats...</div>;

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-6 text-center p-6">
                <span className="text-6xl">🔒</span>
                <h1 className="text-2xl font-bold">Guest Mode</h1>
                <p className="text-gray-500">Sign in to track your XP, Streaks, and Level.</p>
                <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold">
                    Sign In / Create Account
                </Link>
                <Link href="/" className="text-blue-500 underline">Back Home</Link>
            </div>
        );
    }

    const level = Math.floor((progress?.xp || 0) / 1000) + 1;
    const progressToNext = ((progress?.xp || 0) % 1000) / 10; // Percentage

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-black dark:text-white p-6 pb-24">
            <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold">Your Progress</h1>
                <Link href="/" className="text-2xl">✕</Link>
            </header>

            <div className="space-y-6">
                {/* Main Stats Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-center text-white shadow-xl">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Current Level</div>
                    <div className="text-6xl font-black mb-2">{level}</div>
                    <div className="text-lg font-medium opacity-90">Novice Scholar</div>

                    <div className="mt-6 bg-black/20 rounded-full h-4 overflow-hidden relative">
                        <div className="bg-white/90 h-full transition-all duration-1000" style={{ width: `${progressToNext}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-2 opacity-75 font-mono">
                        <span>{progress?.xp || 0} XP</span>
                        <span>{level * 1000} XP (Next Lvl)</span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
                        <div className="text-4xl mb-2">🔥</div>
                        <div className="text-2xl font-bold">{progress?.currentStreak || 0}</div>
                        <div className="text-xs text-gray-400 uppercase">Day Streak</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
                        <div className="text-4xl mb-2">✅</div>
                        <div className="text-2xl font-bold">{progress?.completedTopics?.length || 0}</div>
                        <div className="text-xs text-gray-400 uppercase">Lessons Done</div>
                    </div>
                </div>

                {/* Sign Out */}
                <div className="pt-8 text-center">
                    <Link href="/login" className="text-red-500 opacity-60 hover:opacity-100 text-sm font-bold">
                        Sign Out / Switch Account
                    </Link>
                </div>
            </div>

            {/* Footer Nav Integration */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-around shadow-lg z-50">
                <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-blue-500">
                    <span className="text-xl">🏠</span>
                    <span className="text-xs">Home</span>
                </Link>
                <Link href="/stats" className="flex flex-col items-center text-blue-600">
                    <span className="text-xl">🔥</span>
                    <span className="text-xs">Stats</span>
                </Link>
                <Link href="/tutor" className="flex flex-col items-center text-gray-400 hover:text-blue-500">
                    <span className="text-xl">🤖</span>
                    <span className="text-xs">Tutor</span>
                </Link>
            </div>
        </div>
    );
}
