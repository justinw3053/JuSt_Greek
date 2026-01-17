"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useEffect, useState } from "react";
import Link from "next/link";

const client = generateClient<Schema>();

export default function Home() {
  const [syllabus, setSyllabus] = useState<Schema["Syllabus"]["type"][]>([]);

  useEffect(() => {
    async function fetchSyllabus() {
      const { data: items } = await client.models.Syllabus.list();
      // Sort by chapter then topicId
      const sorted = items.sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.topicId.localeCompare(b.topicId);
      });
      setSyllabus(sorted);
    }
    fetchSyllabus();
  }, []);

  // Group by Chapter
  const chapters: Record<number, typeof syllabus> = {};
  syllabus.forEach((item) => {
    if (!chapters[item.chapter]) chapters[item.chapter] = [];
    chapters[item.chapter].push(item);
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 pb-24">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">JuSt_Greek</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">A1 Proficiency Quarter (PDF Curriculum)</p>
      </header>

      <div className="space-y-6">
        {Object.entries(chapters).map(([chapterNum, lessons]) => (
          <section key={chapterNum} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Chapter {chapterNum} <span className="text-xs font-normal text-gray-400">{lessons[0].month}</span>
              </h2>
              <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                {lessons.length} Topics
              </span>
            </div>

            <div className="space-y-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.topicId}
                  href={`/lesson/${lesson.topicId.replace('.', '_')}`} // Next.js dynamic route
                  className="block p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs font-mono text-blue-500 uppercase tracking-wider block mb-1">
                      Topic {lesson.topicId}
                    </span>
                    <h3 className="font-medium">{lesson.title}</h3>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-gray-600 flex items-center justify-center text-blue-600 dark:text-blue-300">
                    ▶
                  </div>
                </Link>
              ))}
            </div>

            {/* Chapter Review Button */}
            <div className="mt-4 flex justify-end">
              <Link
                href={`/chapter/${chapterNum}`}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition flex items-center gap-2 text-sm"
              >
                <span>🏆</span>
                <span>Boss Level: Review Chapter {chapterNum}</span>
              </Link>
            </div>
          </section>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-around shadow-lg">
        <button className="flex flex-col items-center text-blue-600">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-xl">🔥</span>
          <span className="text-xs">Stats</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-xl">🤖</span>
          <span className="text-xs">Tutor</span>
        </button>
      </div>
    </main>
  );
}
