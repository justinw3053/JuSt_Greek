import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { topicTitle, content } = await req.json();
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Google API Key not configured." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are a Socratic Greek Tutor. 
        Your goal is to create a "Challenge Quiz" for the student based on the following lesson content.
        
        The Lesson Content often contains deep Grammar Rules from the textbook (PDF) that the Audio might have skimmed.
        Your questions should NOT just test recall ("What did the speaker say?").
        Instead, they should test APPLICATION of the rules ("Which of these sentences is grammatically correct based on the rule?").

        LESSON CONTEXT:
        Title: ${topicTitle}
        Content: ${content?.substring(0, 10000)}

        INSTRUCTIONS:
        1. Identify the key Grammar Rule(s) in the text.
        2. Create 3 Multiple Choice Questions.
        3. For each question, provide an "explanation" that teaches the rule.
        4. Return ONLY valid JSON.

        JSON FORMAT:
        [
            {
                "question": "string",
                "options": ["string", "string", "string", "string"],
                "correctIndex": number (0-3),
                "explanation": "string (The teaching moment)"
            }
        ]
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const quizData = JSON.parse(jsonStr);

        return NextResponse.json({ quiz: quizData });

    } catch (error) {
        console.error("Quiz Gen Error:", error);
        return NextResponse.json(
            { error: "Failed to generate quiz." },
            { status: 500 }
        );
    }
}
