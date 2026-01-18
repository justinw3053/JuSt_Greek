"use client";

import { useState, useEffect } from "react";
import { generateAlgorithmicQuiz } from "../lib/quiz_algorithm";

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
    preloadedQuestions?: Question[];
}

export default function QuizModal({ isOpen, onClose, onComplete, topicTitle, content, preloadedQuestions }: QuizModalProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    // Load Quiz
    useEffect(() => {
        if (!isOpen) return;

        // 1. Priority: Pre-loaded Questions (e.g. from DB/Batch)
        if (preloadedQuestions && preloadedQuestions.length > 0) {
            const shuffled = [...preloadedQuestions].sort(() => 0.5 - Math.random());
            setTimeout(() => {
                setQuestions(shuffled.slice(0, 5));
                setLoading(false);
            }, 0);
            return;
        }

        // 2. Fallback: Algorithmic Generation (Client-Side, Instant)
        try {
            if (content) {
                const parsed = JSON.parse(content);
                if (parsed.reading_greek && parsed.reading_english) {
                    const algoQuestions = generateAlgorithmicQuiz(parsed.reading_greek, parsed.reading_english);
                    if (algoQuestions.length >= 3) {
                        setTimeout(() => {
                            setQuestions(algoQuestions);
                            setLoading(false);
                        }, 0);
                        return;
                    }
                }
            }
        } catch (e) {
            console.error("Algorithmic generation failed", e);
        }

        // 3. Last Resort: API Fetch (Only if 1 and 2 failed)
        if (questions.length === 0) {
            setTimeout(() => setLoading(true), 0);
            fetch("/api/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topicTitle, content })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.quiz && data.quiz.length > 0) {
                        setQuestions(data.quiz);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [isOpen, topicTitle, content, preloadedQuestions]);

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
            setShowExplanation(false);
        } else {
            setQuizFinished(true);
            // If Passed (> 60%)
            const finalScore = score + (selectedOption === questions[currentIndex].correctIndex ? 1 : 0);
            const passed = (finalScore / questions.length) >= 0.6;

            if (passed) {
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
                            <div className="text-6xl mb-4">{(score / questions.length) >= 0.6 ? "🏆" : "📚"}</div>
                            <h3 className="text-2xl font-bold mb-2">{(score / questions.length) >= 0.6 ? "Challenge Passed!" : "Needs Review"}</h3>
                            <p className="text-gray-500 mb-6">You scored {score} / {questions.length}</p>

                            {(score / questions.length) >= 0.6 ? (<button onClick={onComplete} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 hover:scale-105 transition">
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
                                    const isGreek = /[\u0370-\u03FF]/.test(opt);

                                    let btnClass = "p-4 rounded-xl text-left border-2 transition-all relative group ";
                                    if (showFeedback) {
                                        if (isCorrect) btnClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                                        else if (isSelected) btnClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                                        else btnClass += "border-gray-200 dark:border-gray-700 opacity-50";
                                    } else {
                                        btnClass += "border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20";
                                    }

                                    return (
                                        <div key={idx} className={btnClass}>
                                            <button
                                                onClick={() => !showFeedback && handleAnswer(idx)}
                                                disabled={showFeedback}
                                                className="w-full text-left outline-none"
                                            >
                                                {opt}
                                            </button>

                                            {isGreek && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-black/50 rounded-lg p-1 backdrop-blur-sm shadow-sm z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const u = new SpeechSynthesisUtterance(opt);
                                                            u.lang = 'el-GR';
                                                            u.rate = 1.0;
                                                            window.speechSynthesis.speak(u);
                                                        }}
                                                        className="hover:scale-110 active:scale-95 text-blue-600 p-1"
                                                        title="Play Audio"
                                                    >
                                                        🔊
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const u = new SpeechSynthesisUtterance(opt);
                                                            u.lang = 'el-GR';
                                                            u.rate = 0.5; // Snail speed
                                                            window.speechSynthesis.speak(u);
                                                        }}
                                                        className="hover:scale-110 active:scale-95 text-purple-600 p-1"
                                                        title="Play Slow (50%)"
                                                    >
                                                        🐢
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Feedback */}
                            {showFeedback && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex gap-3 mb-3">
                                        <button
                                            onClick={nextQuestion}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
                                        >
                                            {currentIndex + 1 === questions.length ? "See Results" : "Next Question →"}
                                        </button>

                                        <button
                                            onClick={() => setShowExplanation(!showExplanation)}
                                            className="px-4 py-3 bg-white dark:bg-black/20 text-blue-600 dark:text-blue-300 rounded-xl font-bold border-2 border-blue-100 dark:border-blue-800 hover:bg-blue-50 transition flex items-center gap-2"
                                        >
                                            <span>{showExplanation ? "Hide" : "💡 Explain"}</span>
                                        </button>
                                    </div>

                                    {showExplanation && (
                                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg text-sm leading-relaxed text-blue-900 dark:text-blue-100 animate-in zoom-in-95 duration-200">
                                            <span className="font-bold block mb-1 uppercase text-xs tracking-wider opacity-70">Explanation</span>
                                            {questions[currentIndex].explanation}
                                        </div>
                                    )}
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
