"use client";

import { generateClient } from "aws-amplify/data";
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from "@/amplify/data/resource";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatTutor from "@/components/ChatTutor";
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function LessonPage() {
    const params = useParams();
    const idStr = params.id as string;
    const targetId = idStr ? idStr.replace('_', '.') : "";

    const [lesson, setLesson] = useState<Schema["Syllabus"]["type"] | undefined>(undefined);
    const [audioUrl, setAudioUrl] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        getCurrentUser().then(u => setUserId(u.userId)).catch(() => { });
    }, []);

    const handleComplete = async () => {
        if (!userId || !lesson) return;

        try {
            const { data: progressList } = await client.models.UserProgress.list({
                filter: { userId: { eq: userId } }
            });

            const now = new Date().toISOString();

            if (progressList.length === 0) {
                // First time user
                await client.models.UserProgress.create({
                    userId: userId,
                    completedTopics: [lesson.topicId],
                    xp: 100,
                    currentStreak: 1,
                    lastActivity: now
                });
            } else {
                const prog = progressList[0];
                const cleanTopics = (prog.completedTopics || []).filter(t => t !== null) as string[];

                if (!cleanTopics.includes(lesson.topicId)) {
                    // Award XP and Streak
                    const lastDate = prog.lastActivity ? new Date(prog.lastActivity) : new Date(0);
                    const today = new Date();
                    const isSameDay = lastDate.toDateString() === today.toDateString();

                    await client.models.UserProgress.update({
                        id: prog.id,
                        completedTopics: [...cleanTopics, lesson.topicId],
                        xp: (prog.xp || 0) + 100,
                        currentStreak: isSameDay ? (prog.currentStreak || 1) : ((prog.currentStreak || 0) + 1),
                        lastActivity: now
                    });
                }
            }
            setIsCompleted(true);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!targetId) return;

        async function fetchData() {
            const { data: items } = await client.models.Syllabus.list({
                filter: { topicId: { eq: targetId } }
            });

            if (items.length > 0) {
                const currentLesson = items[0];
                setLesson(currentLesson);

                try {
                    const link = await getUrl({
                        path: `audio/topic_${idStr}.mp3`,
                    });
                    setAudioUrl(link.url.toString());
                } catch (e) {
                    console.error("Audio fetch error", e);
                }

                // Check if completed
                if (userId) {
                    const { data: prog } = await client.models.UserProgress.list({
                        filter: { userId: { eq: userId } }
                    });
                    if (prog.length > 0) {
                        const topics = prog[0].completedTopics || [];
                        if (topics.includes(currentLesson.topicId)) setIsCompleted(true);
                    }
                }
            }
        }
        fetchData();
    }, [targetId, idStr, userId]);

    if (!lesson) return <div className="p-8 text-center mt-20">Loading Lesson...</div>;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
            <header className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <Link href="/" className="text-2xl">←</Link>
                <div>
                    <span className="text-xs font-mono text-blue-500 uppercase">Chapter {lesson.chapter} • Topic {lesson.topicId}</span>
                    <h1 className="text-xl font-bold leading-tight">{lesson.title}</h1>
                </div>
            </header>

            <main className="flex-1 p-6 flex flex-col items-center justify-center gap-8">

                <div className="w-full h-32 bg-blue-50 dark:bg-gray-900 rounded-xl flex items-center justify-center border border-blue-100 dark:border-gray-800">
                    <span className="text-blue-200 text-4xl animate-pulse">|||||||||||||</span>
                </div>

                <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">Audio Lesson</label>
                    {audioUrl ? (
                        <audio controls className="w-full h-12" src={audioUrl}>
                            Your browser does not support the audio element.
                        </audio>
                    ) : (
                        <div className="w-full h-12 bg-gray-200 animate-pulse rounded"></div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <button className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-xl shadow-lg active:scale-95 transition-transform">
                        <span className="text-2xl mb-1">🎙️</span>
                        <span className="text-sm font-bold">Record</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-purple-600 text-white rounded-xl shadow-lg active:scale-95 transition-transform">
                        <span className="text-2xl mb-1">🤖</span>
                        <span className="text-sm font-bold">Ask Tutor</span>
                    </button>
                </div>

                {/* COMPLETE LESSON BUTTON */}
                <button
                    onClick={handleComplete}
                    disabled={isCompleted}
                    className={`w-full max-w-md p-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all ${isCompleted
                        ? "bg-green-100 text-green-700 cursor-default"
                        : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                        }`}
                >
                    {isCompleted ? "✅ Lesson Completed (+100 XP)" : "🔥 Complete Lesson"}
                </button>

                <div className="w-full max-w-md mt-4">
                    <h3 className="font-bold text-gray-500 text-sm mb-2 uppercase">Transcript Preview</h3>
                    <div className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm leading-relaxed">
                        {lesson.content ? (
                            (() => {
                                try {
                                    const detailed = JSON.parse(lesson.content);
                                    return (
                                        <div className="space-y-4">
                                            <p className="whitespace-pre-wrap">{detailed.audio_script}</p>
                                            <hr className="border-gray-200 dark:border-gray-800" />
                                            <div>
                                                <p className="font-bold mb-1 text-black dark:text-white">{detailed.reading_greek}</p>
                                                <p className="italic text-gray-500">{detailed.reading_english}</p>
                                            </div>
                                        </div>
                                    );
                                } catch (e) {
                                    return <p className="whitespace-pre-wrap">{lesson.content}</p>;
                                }
                            })()
                        ) : (
                            <p className="italic">No content available.</p>
                        )}
                    </div>
                </div>

                <ChatTutor context={`Topic: ${lesson.title} (${lesson.topicId})\nContent: ${lesson.content}`} />
            </main>
        </div>
    );
}
