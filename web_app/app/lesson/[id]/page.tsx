"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatTutor from "@/components/ChatTutor";
import QuizModal from "@/components/QuizModal";
import { getCurrentUser } from 'aws-amplify/auth';
import {
    BookOpenIcon,
    SpeakerWaveIcon,
    AcademicCapIcon,
    CheckCircleIcon,
    FireIcon,
    ChatBubbleLeftRightIcon
} from "@heroicons/react/24/solid";

const client = generateClient<Schema>();

export default function LessonPage() {
    const params = useParams();
    const idStr = params.id as string;
    const targetId = idStr ? idStr.replace('_', '.') : "";

    const [lesson, setLesson] = useState<Schema["Syllabus"]["type"] | undefined>(undefined);
    const [userId, setUserId] = useState<string>("");
    const [isCompleted, setIsCompleted] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isQuizOpen, setIsQuizOpen] = useState(false);

    // TTS Helper
    // TTS Helper
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const v = window.speechSynthesis.getVoices();
            console.log("Loaded voices:", v.map(voice => `${voice.name} (${voice.lang})`));
            setVoices(v);
        };

        loadVoices();
        // Chrome loads voices asynchronously
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const speakGreek = (text: string) => {
        if (!text) return;
        window.speechSynthesis.cancel(); // Stop previous

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a specific Greek voice
        // 1. Exact match for 'el-GR'
        // 2. Include 'Google' (Google Greek commonly available on Android/Chrome)
        // 3. Any 'el' language
        const greekVoice = voices.find(v => v.lang === 'el-GR') ||
            voices.find(v => v.lang.startsWith('el')) ||
            voices.find(v => v.name.includes('Greek'));

        if (greekVoice) {
            utterance.voice = greekVoice;
            console.log("Using voice:", greekVoice.name);
        } else {
            console.warn("No Greek voice found. Using default.");
        }

        // Always set lang as hint
        utterance.lang = 'el-GR';
        utterance.rate = 0.9;

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        getCurrentUser().then(u => setUserId(u.userId)).catch(() => { });
    }, []);

    const handleComplete = async () => {
        if (!userId) {
            alert("Please Sign In to track your progress and earn XP!");
            return;
        }
        if (!lesson) return;

        try {
            const { data: progressList } = await client.models.UserProgress.list({
                filter: { userId: { eq: userId } }
            });

            const now = new Date().toISOString();

            if (progressList.length === 0) {
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

    if (!lesson) return <div className="p-8 text-center mt-20 text-gray-500 animate-pulse">Loading Lesson Content...</div>;

    // Parse Content
    let content = { reading_greek: "", reading_english: "", audio_script: "" };
    try {
        if (lesson.content) {
            const parsed = JSON.parse(lesson.content);
            content = { ...content, ...parsed };
        }
    } catch (e) {
        // Fallback for older plaintext content
        content.audio_script = lesson.content || "";
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-black dark:text-white flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                    ← Back
                </Link>
                <div className="flex-1">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                        Chapter {lesson.chapter} • Topic {lesson.topicId}
                    </span>
                    <h1 className="text-xl font-extrabold tracking-tight">{lesson.title}</h1>
                </div>
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full hover:scale-105 transition-transform"
                >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 space-y-8 pb-32">

                {/* 1. Context / Tutor Intro */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-4">
                        <AcademicCapIcon className="w-5 h-5 text-purple-500" />
                        <h2 className="font-bold text-gray-700 dark:text-gray-200">Introduction</h2>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        <p className="whitespace-pre-wrap">{content.audio_script}</p>
                    </div>
                </div>

                {/* 2. Grammar Theory (English) */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpenIcon className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold text-lg">Grammar & Rules</h2>
                    </div>
                    <div className="space-y-3">
                        {content.reading_english.split('\n').map((line, i) => (
                            line.trim() ? (
                                <p key={i} className="text-gray-700 dark:text-gray-300 leading-7">
                                    {line}
                                </p>
                            ) : <br key={i} />
                        ))}
                    </div>
                </div>

                {/* 3. Practice (Greek) */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-6">
                        <SpeakerWaveIcon className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-bold text-lg text-indigo-900 dark:text-indigo-200">Reading Practice</h2>
                    </div>

                    <div className="space-y-4">
                        {content.reading_greek.split('\n').map((line, i) => {
                            if (!line.trim()) return null;
                            return (
                                <div key={i} className="flex gap-4 items-start group">
                                    <button
                                        onClick={() => speakGreek(line)}
                                        className="mt-1 p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors shrink-0"
                                        aria-label="Listen"
                                    >
                                        <SpeakerWaveIcon className="w-4 h-4 text-indigo-500" />
                                    </button>
                                    <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-white leading-relaxed">
                                        {line}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 safe-pb">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={() => {
                            if (!userId) {
                                alert("Sign In to save progress!");
                                return;
                            }
                            if (!isCompleted) setIsQuizOpen(true);
                        }}
                        disabled={isCompleted}
                        className={`w-full p-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${isCompleted
                            ? "bg-green-100 text-green-700 cursor-default border border-green-200"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl"
                            }`}
                    >
                        {isCompleted ? (
                            <>
                                <CheckCircleIcon className="w-6 h-6" />
                                Lesson Completed!
                            </>
                        ) : (
                            <>
                                <FireIcon className="w-6 h-6" />
                                Take Challenge
                            </>
                        )}
                    </button>
                </div>
            </div>

            <QuizModal
                isOpen={isQuizOpen}
                onClose={() => setIsQuizOpen(false)}
                onComplete={() => {
                    handleComplete();
                    setIsQuizOpen(false);
                }}
                topicTitle={lesson.title}
                content={lesson.content || ""}
                preloadedQuestions={(() => {
                    try {
                        const parsed = JSON.parse(lesson.content || "{}");
                        return parsed.quiz_questions || [];
                    } catch { return []; }
                })()}
            />

            <ChatTutor
                context={`Topic: ${lesson.title}\nContent: ${lesson.content}`}
                isOpen={isChatOpen}
                setIsOpen={setIsChatOpen}
            />
        </div>
    );
}
