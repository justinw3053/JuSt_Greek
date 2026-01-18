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
        // Generator uses 0-based index matching line number
        const key = `/audio/topic_${topicId.replace(/\./g, "_")}_${index}.mp3`;
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
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 pb-32">

            {/* Background Effects */}
            <div className="fixed inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
            {/* Header */}
            <header className="sticky top-0 z-20 bg-black/50 backdrop-blur-xl border-b border-white/10 p-4 transition-all">
                <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
                    <Link href="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>

                    <div className="flex-1 px-4">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-0.5">
                            Chapter {lesson.chapter} • Topic {lesson.topicId}
                        </span>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            {lesson.title}
                            {lesson.title.includes("Exam") && <TrophyIcon className="w-5 h-5 text-amber-500" />}
                        </h1>
                    </div>

                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="p-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                        <ChatBubbleLeftRightIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6 space-y-6 pb-40">

                {/* 1. Context / Tutor Intro */}
                <div className="bg-[#1C1C1E] rounded-[20px] p-6 border border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <AcademicCapIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="font-bold text-lg text-gray-200">Introduction</h2>
                    </div>
                    <div className="prose prose-invert max-w-none text-gray-400 text-[15px] leading-relaxed relative z-10">
                        <p className="whitespace-pre-wrap">{content.audio_script}</p>
                    </div>
                </div>

                {/* 2. Grammar Theory (English) */}
                <div className="bg-[#1C1C1E] rounded-[20px] p-6 border border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <BookOpenIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="font-bold text-lg text-gray-200">Grammar & Rules</h2>
                    </div>
                    <div className="space-y-4 relative z-10">
                        {content.reading_english.split('\n').map((line, i) => {
                            if (!line.trim()) return <br key={i} />;

                            const parts = line.split(/(\[.*?\]\(.*?\)|(?:Page|page)\s+\d+)/g);

                            return (
                                <p key={i} className="text-gray-300/90 leading-7 text-[15px]">
                                    {parts.map((part, j) => {
                                        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                                        if (linkMatch) {
                                            const text = linkMatch[1];
                                            const url = linkMatch[2];

                                            // Intercept PDF links
                                            if (url.includes('.pdf') && url.includes('page=')) {
                                                const pageNumMatch = url.match(/page=(\d+)/);
                                                const pageNum = pageNumMatch ? pageNumMatch[1] : '1';

                                                return (
                                                    <Link
                                                        key={j}
                                                        href={`/pdf?page=${pageNum}`}
                                                        className="font-semibold text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-4"
                                                    >
                                                        {text}
                                                    </Link>
                                                );
                                            }

                                            return (
                                                <a
                                                    key={j}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-4"
                                                >
                                                    {text}
                                                </a>
                                            );
                                        }

                                        const pageMatch = part.match(/^(?:Page|page)\s+(\d+)$/);
                                        if (pageMatch) {
                                            const pageNum = parseInt(pageMatch[1]) + 9; // PDF Offset: Book Page + 9 = PDF Page
                                            return (
                                                <Link
                                                    key={j}
                                                    href={`/pdf?page=${pageNum}`}
                                                    className="inline-block px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold hover:bg-amber-500/20 transition-colors mx-1 text-sm border border-amber-500/20"
                                                >
                                                    {part}
                                                </Link>
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
                <div className={`rounded-[20px] p-0 border border-white/10 overflow-hidden ${lesson.title.includes("Exam")
                    ? "bg-[#1C1C1E] border-amber-500/20"
                    : "bg-[#1C1C1E]"
                    }`}>

                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${lesson.title.includes("Exam") ? "bg-amber-500/20" : "bg-indigo-500/20"}`}>
                                <SpeakerWaveIcon className={`w-5 h-5 ${lesson.title.includes("Exam") ? "text-amber-500" : "text-indigo-400"}`} />
                            </div>
                            <h2 className={`font-bold text-lg ${lesson.title.includes("Exam") ? "text-amber-500" : "text-gray-200"}`}>
                                {lesson.title.includes("Exam") ? "Exam Content Review" : "Reading Practice"}
                            </h2>
                        </div>
                    </div>

                    <div className="divide-y divide-white/5">
                        {content.reading_greek.split('\n').map((line, i) => {
                            if (!line.trim()) return null;
                            const isGreek = hasGreek(line);

                            if (!isGreek) {
                                return (
                                    <div key={i} className="px-6 py-4 bg-white/[0.01]">
                                        <h3 className="font-bold text-gray-500 uppercase tracking-widest text-[11px]">{line}</h3>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className="flex gap-4 items-center group px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => playAudio(i, 1.0)}
                                            className="w-10 h-10 flex items-center justify-center bg-[#0A84FF] text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                            title="Normal Speed"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => playAudio(i, 0.75)}
                                            className="h-10 px-3 flex items-center justify-center bg-white/10 text-green-400 rounded-full hover:bg-white/15 transition-colors font-bold text-[11px] tracking-wide"
                                            title="Slow Speed (75%)"
                                        >
                                            0.75x
                                        </button>
                                    </div>
                                    <p className="text-xl font-medium text-gray-100 font-greek tracking-wide">
                                        {line}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-5 safe-pb z-30">
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
                        className={`w-full p-4 rounded-xl font-bold text-[17px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isCompleted
                            ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                            : lesson.title.includes("Exam")
                                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/25"
                                : "bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-blue-500/25"
                            }`}
                    >
                        {isCompleted ? (
                            <>
                                <CheckCircleIcon className="w-6 h-6" />
                                {lesson.title.includes("Exam") ? "Exam Passed" : "Lesson Completed"}
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
        </div>
    );
}
