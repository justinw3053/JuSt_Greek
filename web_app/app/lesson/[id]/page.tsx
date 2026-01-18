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
    ChatBubbleLeftRightIcon,
    TrophyIcon
} from "@heroicons/react/24/solid";

import { motion } from "framer-motion";

const client = generateClient<Schema>();

export default function LessonPage() {
    const { id } = useParams();
    const topicId = (id as string).replace(/_/g, ".");

    const [lesson, setLesson] = useState<Schema["Syllabus"]["type"] | null>(null);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch Lesson
    useEffect(() => {
        client.models.Syllabus.list({
            filter: { topicId: { eq: topicId } }
        }).then(res => {
            if (res.data.length > 0) {
                setLesson(res.data[0]);
            }
        });
    }, [topicId]);

    // Check Progress
    useEffect(() => {
        getCurrentUser().then(u => {
            setUserId(u.userId);
            client.models.UserProgress.list({
                filter: { userId: { eq: u.userId } },
                authMode: 'userPool'
            }).then(res => {
                if (res.data.length > 0) {
                    const completed = (res.data[0].completedTopics || []).filter(t => t !== null) as string[];
                    if (completed.includes(topicId)) setIsCompleted(true);
                }
            });
        }).catch(() => console.log("Not signed in"));
    }, [topicId]);

    const playAudio = (index: number, rate: number) => {
        const key = `/audio/topic_${topicId.replace(/\./g, "_")}_${index + 1}.mp3`;
        const audio = new Audio(key);
        audio.playbackRate = rate;
        audio.play().catch(e => console.error("Audio play error", e));
    };

    const hasGreek = (text: string) => /[\u0370-\u03FF]/.test(text);

    const handleComplete = async () => {
        if (!userId || !lesson) return;
        setIsCompleted(true);

        try {
            const { data: prog } = await client.models.UserProgress.list({
                filter: { userId: { eq: userId } },
                authMode: 'userPool'
            });

            if (prog.length > 0) {
                const p = prog[0];
                const current = (p.completedTopics || []).filter(t => t !== null) as string[];
                if (!current.includes(topicId)) {
                    await client.models.UserProgress.update({
                        id: p.id,
                        completedTopics: [...current, topicId],
                        xp: (p.xp || 0) + 10
                    });
                }
            } else {
                await client.models.UserProgress.create({
                    userId,
                    completedTopics: [topicId],
                    xp: 10
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gray-50 dark:bg-black text-black dark:text-white flex flex-col font-sans"
        >
            {/* Header */}
            <header className={`sticky top-0 z-10 backdrop-blur-md border-b p-4 flex items-center gap-4 transition-colors ${lesson.title.includes("Exam")
                ? "bg-amber-50/90 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800"
                : "bg-white/80 dark:bg-black/80 border-gray-200 dark:border-gray-800"
                }`}>
                <Link href="/" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                    ← Back
                </Link>
                <div className="flex-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${lesson.title.includes("Exam") ? "text-amber-600 dark:text-amber-400" : "text-blue-500"
                        }`}>
                        Chapter {lesson.chapter} • Topic {lesson.topicId}
                    </span>
                    <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                        {lesson.title}
                        {lesson.title.includes("Exam") && <TrophyIcon className="w-5 h-5 text-amber-500" />}
                    </h1>
                </div>
                <button
                    onClick={() => setIsChatOpen(true)}
                    className={`p-2 rounded-full hover:scale-105 transition-transform ${lesson.title.includes("Exam")
                        ? "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300"
                        : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                        }`}
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
                        {content.reading_english.split('\n').map((line, i) => {
                            if (!line.trim()) return <br key={i} />;

                            // Simple Regex to parse [Text](URL)
                            const parts = line.split(/(\[.*?\]\(.*?\))/g);

                            return (
                                <p key={i} className="text-gray-700 dark:text-gray-300 leading-7">
                                    {parts.map((part, j) => {
                                        const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
                                        if (match) {
                                            return (
                                                <a
                                                    key={j}
                                                    href={match[2]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-2"
                                                >
                                                    {match[1]}
                                                </a>
                                            );
                                        }
                                        return <span key={j}>{part}</span>;
                                    })}
                                </p>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Practice (Greek) */}
                <div className={`rounded-2xl p-6 shadow-sm border ${lesson.title.includes("Exam")
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800"
                    : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border-blue-100 dark:border-gray-700"
                    }`}>
                    <div className="flex items-center gap-2 mb-6">
                        <SpeakerWaveIcon className={`w-5 h-5 ${lesson.title.includes("Exam") ? "text-amber-600" : "text-indigo-500"}`} />
                        <h2 className={`font-bold text-lg ${lesson.title.includes("Exam") ? "text-amber-900 dark:text-amber-200" : "text-indigo-900 dark:text-indigo-200"}`}>
                            {lesson.title.includes("Exam") ? "Exam Content Review" : "Reading Practice"}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {content.reading_greek.split('\n').map((line, i) => {
                            if (!line.trim()) return null;
                            const isGreek = hasGreek(line);

                            // If it's a header (no Greek), just render text nicely
                            if (!isGreek) {
                                return (
                                    <div key={i} className="py-4 border-b border-gray-100 dark:border-gray-800">
                                        <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs">{line}</h3>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className="flex gap-4 items-center group py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => playAudio(i, 1.0)}
                                            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                                            title="Normal Speed"
                                        >
                                            <SpeakerWaveIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => playAudio(i, 0.75)}
                                            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900 transition-colors flex items-center justify-center"
                                            title="Slow Speed (75%)"
                                        >
                                            <span className="text-[10px] font-bold">0.75x</span>
                                        </button>
                                    </div>
                                    <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed font-greek">
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
                            : lesson.title.includes("Exam")
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-500/25"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25"
                            }`}
                    >
                        {isCompleted ? (
                            <>
                                <CheckCircleIcon className="w-6 h-6" />
                                {lesson.title.includes("Exam") ? "Exam Passed!" : "Lesson Completed!"}
                            </>
                        ) : (
                            <>
                                {lesson.title.includes("Exam") ? <TrophyIcon className="w-6 h-6" /> : <FireIcon className="w-6 h-6" />}
                                {lesson.title.includes("Exam") ? "Start Final Exam" : "Take Challenge"}
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
        </motion.div>
    );
}
