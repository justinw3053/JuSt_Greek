"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useEffect, useState } from "react";
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function GamificationHeader() {
    const [xp, setXp] = useState(0);
    const [streak, setStreak] = useState(0);
    const [userId, setUserId] = useState<string>("");

    useEffect(() => {
        async function checkUser() {
            try {
                const user = await getCurrentUser();
                setUserId(user.userId);
            } catch (e) {
                // Guest user
            }
        }
        checkUser();
    }, []);

    useEffect(() => {
        if (!userId) return;

        // Subscribe to real-time updates
        const sub = client.models.UserProgress.observeQuery({
            filter: { userId: { eq: userId } }
        }).subscribe({
            next: ({ items }) => {
                if (items.length > 0) {
                    setXp(items[0].xp || 0);
                    setStreak(items[0].currentStreak || 0);
                } else {
                    // Initialize if not exists?
                    // Usually better to do this on first action to avoid spamming DB for inactive users
                }
            }
        });

        return () => sub.unsubscribe();
    }, [userId]);

    if (!userId) {
        return (
            <div className="fixed top-4 right-4 z-50">
                <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition text-sm">
                    Sign In
                </a>
            </div>
        );
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex gap-3">
            <div className="bg-white/90 backdrop-blur dark:bg-zinc-800/90 border border-amber-200 dark:border-amber-900 rounded-full px-4 py-1.5 shadow-sm flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <span className="font-bold text-amber-600 dark:text-amber-500">{streak}</span>
            </div>
            <div className="bg-white/90 backdrop-blur dark:bg-zinc-800/90 border border-blue-200 dark:border-blue-900 rounded-full px-4 py-1.5 shadow-sm flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{xp} XP</span>
            </div>
        </div>
    );
}
