"use client";

import { useState, useEffect } from "react";

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface QuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    topicTitle: string;
    content: string;
}

export default function QuizModal({ isOpen, onClose, onComplete, topicTitle, content }: QuizModalProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    // Load Quiz
    useEffect(() => {
        if (isOpen && questions.length === 0) {
            setLoading(true);
            fetch("/api/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topicTitle, content })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.quiz) setQuestions(data.quiz);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [isOpen, topicTitle, content]);

    const handleAnswer = (index: number) => {
        setSelectedOption(index);
        setShowFeedback(true);
        if (index === questions[currentIndex].correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const nextQuestion = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
        } else {
            setQuizFinished(true);
            // If Passed (2/3 or better)
            const isPass = (score + (selectedOption === questions[currentIndex].correctIndex ? 1 : 0)) >= 2;
            if (isPass) {
                setTimeout(onComplete, 2000); // Auto close after success? Or let user click finish
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Challenge Quiz</h2>
                        <p className="text-sm opacity-80">{topicTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">✕</button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 animate-pulse">Generating Challenge Questions...</p>
                            <p className="text-xs text-gray-400">Consulting the Oracle...</p>
                        </div>
                    ) : quizFinished ? (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">{score >= 2 ? "🏆" : "📚"}</div>
                            <h3 className="text-2xl font-bold mb-2">{score >= 2 ? "Challenge Passed!" : "Needs Review"}</h3>
                            <p className="text-gray-500 mb-6">You scored {score} / {questions.length}</p>

                            {score >= 2 ? (
                                <button onClick={onComplete} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 hover:scale-105 transition">
                                    Claim Reward
                                </button>
                            ) : (
                                <button onClick={onClose} className="bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition">
                                    Try Again Later
                                </button>
                            )}
                        </div>
                    ) : questions.length > 0 ? (
                        <div className="space-y-6">
                            {/* Progress */}
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <span>Question {currentIndex + 1} of {questions.length}</span>
                                <span>Score: {score}</span>
                            </div>

                            {/* Question */}
                            <h3 className="text-lg font-medium leading-relaxed">{questions[currentIndex].question}</h3>

                            {/* Options */}
                            <div className="grid gap-3">
                                {questions[currentIndex].options.map((opt, idx) => {
                                    const isSelected = selectedOption === idx;
                                    const isCorrect = idx === questions[currentIndex].correctIndex;

                                    let btnClass = "p-4 rounded-xl text-left border-2 transition-all ";
                                    if (showFeedback) {
                                        if (isCorrect) btnClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                                        else if (isSelected) btnClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                                        else btnClass += "border-gray-200 dark:border-gray-700 opacity-50";
                                    } else {
                                        btnClass += "border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !showFeedback && handleAnswer(idx)}
                                            disabled={showFeedback}
                                            className={btnClass}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Feedback */}
                            {showFeedback && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                                        <span className="font-bold">Explanation:</span> {questions[currentIndex].explanation}
                                    </p>
                                    <button onClick={nextQuestion} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                                        {currentIndex + 1 === questions.length ? "See Results" : "Next Question →"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-red-500">Failed to load quiz. Please try again.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
