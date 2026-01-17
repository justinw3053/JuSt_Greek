"use client";

import { useState, useEffect } from "react";

interface MatchPair {
    id: string;
    item: string;
    match: string;
}

interface MatchingGameProps {
    pairs: MatchPair[];
}

interface GameItem {
    id: string; // The pair ID (to check match)
    text: string;
    uniqueId: string; // To handle UI state
    isResolved: boolean;
}

export default function MatchingGame({ pairs }: MatchingGameProps) {
    const [items, setItems] = useState<GameItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null); // uniqueId
    const [isMatched, setIsMatched] = useState(false);

    useEffect(() => {
        // Break pairs into individual items and shuffle
        const allItems: GameItem[] = [];
        pairs.forEach((p, idx) => {
            allItems.push({ id: p.id, text: p.item, uniqueId: `term-${idx}`, isResolved: false });
            allItems.push({ id: p.id, text: p.match, uniqueId: `def-${idx}`, isResolved: false });
        });

        // Fisher-Yates Shuffle
        for (let i = allItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
        }

        setItems(allItems);
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
                setSelectedId(uniqueId); // Just switch selection? Or flash error? 
                // Let's simpler: switch selection to new card implies "Wrong, trying this one"
                // Or maybe clear selection?
                // Let's implement auto-clear with small delay for UX, but for now simple switch is faster.
                // Actually, standard memory game behavior:
                // Show both, then hide. But here text is always visible.
                // So if mismatch, just update selection to the new one.
                setSelectedId(uniqueId);
            }
        }
    };

    const isComplete = items.length > 0 && items.every(i => i.isResolved);

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 uppercase text-gray-400 tracking-widest">
                Matching Exercise {isComplete && "✅"}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => {
                    if (item.isResolved) return null; // Hide matched items? Or show as faded? hiding is cleaner.

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
