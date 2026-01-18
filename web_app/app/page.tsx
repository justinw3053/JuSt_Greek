"use client";

import { motion } from "framer-motion";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  LockClosedIcon,
  PlayCircleIcon,
  TrophyIcon,
  BookOpenIcon,
  UserIcon
} from "@heroicons/react/24/solid";
import { getCurrentUser } from 'aws-amplify/auth'; // kept as it might be used? check below
// actually getCurrentUser IS used in useEffect. The lint said line 15: Warning 'getCurrentUser' is defined but never used
// Wait, looking at file content in 772:
// Line 28: const u = await getCurrentUser();
// It IS used. Why did lint say unused?
// Ah, lint said:
// /Users/justin/JuSt_Greek/web_app/app/page.tsx
// 15:10 warning 'getCurrentUser' is defined but never used
// ...
// Maybe I messed up the imports in Step 765?
// Let's look at 772 again.
// Line 15: import { getCurrentUser } from 'aws-amplify/auth';
// Line 28: const u = await getCurrentUser();
// It IS used. The lint might be confused or referring to a previous version if I didn't save?
// No, command output is authoritative.
// Let's re-read carefully.
// "5:10 warning 'useEffect' is defined but never used" -> It IS used on line 24.
// This is suspicious. Maybe the file wasn't parsed correctly due to the syntax errors elsewhere?
// I will trust my eyes on the file content from Step 772.
// useEffect IS used. useState IS used. Link IS used.
// I will NOT remove them if they are used.
// I will only remove unused ones if I am sure.
// The lint error might be stale or from a bad parse.
// However, `web_app/app/lesson/[id]/page.tsx` had warnings too.
// Let's specifically look at `web_app/app/lesson/[id]/page.tsx` imports.
// It imports `useEffect`, `useState` etc.
// Used? Yes.
//
// Okay, let's fix the `MatchingGame` and `QuizModal` errors instead, as those are definitely real runtime hazards.



const client = generateClient<Schema>();

// Variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  const [syllabus, setSyllabus] = useState<Schema["Syllabus"]["type"][]>([]);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [user, setUser] = useState<{ userId: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch User & Progress
      try {
        const u = await getCurrentUser();
        setUser({ userId: u.userId });

        const { data: prog } = await client.models.UserProgress.list({
          filter: { userId: { eq: u.userId } },
          authMode: 'userPool'
        });
        if (prog.length > 0) {
          const topics = (prog[0].completedTopics || []).filter(t => t !== null) as string[];
          setCompletedTopics(topics);
        }
      } catch (e) {
        console.log("Not signed in or error fetching progress", e);
      }

      // 2. Fetch Syllabus
      const { data: items } = await client.models.Syllabus.list();
      const sorted = items.sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.topicId.localeCompare(b.topicId, undefined, { numeric: true });
      });
      setSyllabus(sorted);
    }
    fetchData();
  }, []);



  // Group by Chapter
  const chapters: Record<number, typeof syllabus> = {};
  const chapterProgress: Record<number, number> = {};

  syllabus.forEach((item) => {
    if (!chapters[item.chapter]) chapters[item.chapter] = [];
    chapters[item.chapter].push(item);
  });

  // Calculate stats
  Object.keys(chapters).forEach(cx => {
    const cNum = parseInt(cx);
    const lessons = chapters[cNum];
    const done = lessons.filter(l => completedTopics.includes(l.topicId)).length;
    chapterProgress[cNum] = Math.round((done / lessons.length) * 100);
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 pb-24 font-sans">

      {/* Header */}
      <header className="bg-white dark:bg-black/50 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">JuSt_Greek</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">A1 Proficiency Quarter</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300">
            <UserIcon className="w-6 h-6" />
          </div>
        </div>
      </header>

      <motion.div
        className="max-w-md mx-auto px-4 py-6 space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {Object.entries(chapters).map(([chapterNum, lessons]) => {
          const cNum = parseInt(chapterNum);
          const progress = chapterProgress[cNum] || 0;

          return (
            <motion.section
              key={chapterNum}
              variants={item}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
            >

              {/* Chapter Header */}
              <div className="p-5 border-b border-gray-50 dark:border-gray-800">
                <div className="flex justify-between items-end mb-2">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Chapter {chapterNum} <span className="text-sm font-normal text-gray-400 ml-1">{lessons[0].month}</span>
                  </h2>
                  <span className={`text-xs font-bold ${progress === 100 ? 'text-green-500' : 'text-blue-500'}`}>
                    {progress}% Completed
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Lesson List */}
              <div className="bg-gray-50/50 dark:bg-black/20">
                {lessons.map((lesson, idx) => {
                  const isCompleted = completedTopics.includes(lesson.topicId);
                  const isExam = lesson.title.includes("Exam");
                  const isNext = !isCompleted && (idx === 0 || completedTopics.includes(lessons[idx - 1].topicId));
                  const isLocked = !isCompleted && !isNext;

                  return (
                    <Link
                      key={lesson.topicId}
                      href={isLocked ? '#' : `/lesson/${lesson.topicId.replace('.', '_')}`}
                      className={`
                        block p-4 border-b last:border-0 border-gray-100 dark:border-gray-800 transition-all
                        ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-white dark:hover:bg-gray-800 active:scale-[0.98] active:bg-blue-50 dark:active:bg-blue-900/20'}
                        ${isExam ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`
                                    text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                                    ${isExam
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}
                                `}>
                              Topic {lesson.topicId}
                            </span>
                            {isExam && <TrophyIcon className="w-3 h-3 text-amber-500" />}
                          </div>
                          <h3 className={`font-semibold truncate ${isExam ? 'text-amber-900 dark:text-amber-100' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                            {lesson.title.replace("Chapter " + cNum + " Exam: ", "")}
                          </h3>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0">
                          {isCompleted ? (
                            <CheckCircleIcon className="w-8 h-8 text-green-500" />
                          ) : isLocked ? (
                            <LockClosedIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                          ) : (
                            <div className={`
                                   h-8 w-8 rounded-full flex items-center justify-center shadow-lg
                                   ${isExam ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}
                               `}>
                              <PlayCircleIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </motion.div>

      {/* Bottom Nav (Visual Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-3 h-16">
          <button className="flex flex-col items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
            <div className="w-8 h-1 rounded-full bg-blue-600 absolute top-0"></div>
            <BookOpenIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">Curriculum</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600">
            <TrophyIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Achievements</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600">
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </div>

    </main>
  );
}
