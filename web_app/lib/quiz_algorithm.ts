
interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export function generateAlgorithmicQuiz(readingGreek: string, readingEnglish: string): Question[] {
    const greekLines = readingGreek.split('\n').filter(line => line.trim() !== '');
    const englishLines = readingEnglish.split('\n').filter(line => line.trim() !== '');

    const questions: Question[] = [];

    // Strategy 1: Simple Line-by-Line Translation
    // We assume the lines are roughly aligned (which they are in the JSONs).
    // We take up to 5 pairs.
    const limit = Math.min(greekLines.length, englishLines.length, 10);

    for (let i = 0; i < limit; i++) {
        // Skip headers or unrelated lines if we can detect them, but for now take all.
        // We intentionally randomize the order later or pick random ones.

        const greekLine = greekLines[i].trim();
        const englishLine = englishLines[i].trim();

        if (greekLine.length < 3 || englishLine.length < 3) continue;

        // Type A: Translate Greek -> English
        // We need 3 distractors. We pick 3 *other* random english lines.
        const distractors = englishLines
            .filter((_, idx) => idx !== i)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        if (distractors.length < 3) continue; // Not enough content for distractors

        const options = [englishLine, ...distractors].sort(() => 0.5 - Math.random());
        const correctIndex = options.indexOf(englishLine);

        questions.push({
            question: `Translate this to English: "${greekLine}"`,
            options: options,
            correctIndex: correctIndex,
            explanation: `"${greekLine}" translates to "${englishLine}".`
        });

        // Strategy 2: Cloze (Fill-in-the-blank) for longer sentences
        // Only if line has spaces (more than 1 word)
        if (greekLine.includes(' ') && greekLine.split(' ').length > 2) {
            const words = greekLine.split(' ');
            // Pick a random word to blank out (not small words ideally, but random is ok for v1)
            const validWordIndices = words
                .map((w, idx) => ({ w, idx }))
                .filter(item => item.w.length > 2); // Only words > 2 chars

            if (validWordIndices.length > 0) {
                const target = validWordIndices[Math.floor(Math.random() * validWordIndices.length)];
                const blankedSentence = words.map((w, idx) => idx === target.idx ? '_____' : w).join(' ');

                // Distractors: We need random words from other lines? 
                // Or simpler, just reuse the logic from Translation for now to be safe.
                // Actually, Cloze options need to be single words. 
                // Let's stick to Translation for now as it's robust. 
                // Cloze is risky without Part-of-Speech tagging (might pick 'the').
            }
        }
    }

    // Shuffle and Pick 5
    return questions.sort(() => 0.5 - Math.random()).slice(0, 5);
}
