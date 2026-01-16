"use client";

import { generateClient } from "aws-amplify/data";
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from "@/amplify/data/resource";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatTutor from "@/components/ChatTutor";

const client = generateClient<Schema>();

export default function LessonPage() {
    const params = useParams();
    const idStr = params.id as string;
    // URL id is '1_1', data id is '1.1'
    const targetId = idStr ? idStr.replace('_', '.') : "";

    const [lesson, setLesson] = useState<Schema["Syllabus"]["type"] | undefined>(undefined);
    const [audioUrl, setAudioUrl] = useState<string>("");

    useEffect(() => {
        if (!targetId) return;

        async function fetchData() {
            // Fetch Lesson Data from DynamoDB
            const { data: items } = await client.models.Syllabus.list({
                filter: { topicId: { eq: targetId } }
            });

            if (items.length > 0) {
                const currentLesson = items[0];
                setLesson(currentLesson);

                try {
                    // Construct public URL since we enabled guest read
                    // Or retrieve signed URL if needed. 
                    // For simplicity in this v1, we use getUrl which handles it.
                    const link = await getUrl({
                        path: `audio/topic_${idStr}.mp3`,
                    });
                    setAudioUrl(link.url.toString());
                } catch (e) {
                    console.error("Audio fetch error", e);
                }
            }
        }
        fetchData();
    }, [targetId, idStr]);

    if (!lesson) return <div className="p-8 text-center mt-20">Loading Lesson...</div>;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
            {/* Header */}
            <header className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <Link href="/" className="text-2xl">←</Link>
                <div>
                    <span className="text-xs font-mono text-blue-500 uppercase">Week {lesson.week} • Topic {lesson.topicId}</span>
                    <h1 className="text-xl font-bold leading-tight">{lesson.title}</h1>
                </div>
            </header>

            {/* Main Content (Audio Player) */}
            <main className="flex-1 p-6 flex flex-col items-center justify-center gap-8">

                {/* Dynamic Waveform Visualizer Placeholder */}
                <div className="w-full h-32 bg-blue-50 dark:bg-gray-900 rounded-xl flex items-center justify-center border border-blue-100 dark:border-gray-800">
                    <span className="text-blue-200 text-4xl animate-pulse">|||||||||||||</span>
                </div>

                {/* Audio Controls */}
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

                {/* Action Buttons */}
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

                {/* Transcript / Content */}
                <div className="w-full max-w-md mt-4">
                    <h3 className="font-bold text-gray-500 text-sm mb-2 uppercase">Transcript Preview</h3>
                    <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm leading-relaxed">
                        {lesson.content}
                    </p>
                </div>

                <ChatTutor context={`Topic: ${lesson.title} (${lesson.topicId})\nContent: ${lesson.content}`} />
            </main>
        </div>
    );
}
