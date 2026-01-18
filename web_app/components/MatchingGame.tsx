"use client";

import { useState, useEffect } from "react";

interface MatchPair {
    id: string;
    item: string;
    match: string;
}

interface MatchingGameProps {
    pairs: MatchPair[];
    onComplete?: () => void;
}

interface GameItem {
    id: string; // The pair ID (to check match)
    text: string;
    uniqueId: string; // To handle UI state
    isResolved: boolean;
}

export default function MatchingGame({ pairs, onComplete }: MatchingGameProps) {
    const generateItems = (currentPairs: MatchPair[]) => {
        const allItems: GameItem[] = [];
        currentPairs.forEach((p, idx) => {
            allItems.push({ id: p.id, text: p.item, uniqueId: `term-${idx}`, isResolved: false });
            allItems.push({ id: p.id, text: p.match, uniqueId: `def-${idx}`, isResolved: false });
        });

        // Fisher-Yates Shuffle
        for (let i = allItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
        }
        return allItems;
    };

    const [items, setItems] = useState<GameItem[]>(() => generateItems(pairs));
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hasCompleted, setHasCompleted] = useState(false);

    // Reset if pairs change (deep comparison or just length?)
    useEffect(() => {
        setTimeout(() => {
            setItems(generateItems(pairs));
            setHasCompleted(false);
        }, 0);
    }, [pairs]);

    const handleCardClick = (uniqueId: string, pairId: string) => {
        if (selectedId === null) {
            // First selection
            setSelectedId(uniqueId);
        } else {
            // Second selection
            if (selectedId === uniqueId) return; // Clicked same card

            const firstItem = items.find(i => i.uniqueId === selectedId);
            if (firstItem && firstItem.id === pairId) {
                // MATCH!
                setItems(prev => prev.map(i =>
                    (i.uniqueId === selectedId || i.uniqueId === uniqueId)
                        ? { ...i, isResolved: true }
                        : i
                ));
                setSelectedId(null);
            } else {
                // NO MATCH
                setSelectedId(uniqueId);
            }
        }
    };

    // Check completion
    useEffect(() => {
        if (items.length === 0) return;

        const isComplete = items.every(i => i.isResolved);
        if (isComplete && !hasCompleted) {
            // Defer state update to avoid render loop
            setTimeout(() => {
                setHasCompleted(true);
                if (onComplete) {
                    setTimeout(onComplete, 1500);
                }
            }, 0);
        }
    }, [items, hasCompleted, onComplete]);

    const isComplete = items.length > 0 && items.every(i => i.isResolved);

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 uppercase text-gray-400 tracking-widest">
                Matching Exercise {isComplete && "✅"}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => {
                    if (item.isResolved) return null;

                    const isSelected = selectedId === item.uniqueId;

                    return (
                        <button
                            key={item.uniqueId}
                            onClick={() => handleCardClick(item.uniqueId, item.id)}
                            className={`p-4 rounded-xl text-sm font-bold shadow-sm transition-all
                                ${isSelected
                                    ? "bg-blue-600 text-white scale-105"
                                    : "bg-white dark:bg-zinc-700 hover:bg-blue-50 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200"
                                }
                            `}
                        >
                            {item.text}
                        </button>
                    );
                })}
            </div>

            {isComplete && (
                <div className="text-center mt-8 animate-bounce">
                    <p className="text-2xl font-bold text-green-500">Perfect Match!</p>
                </div>
            )}
        </div>
    );
}
