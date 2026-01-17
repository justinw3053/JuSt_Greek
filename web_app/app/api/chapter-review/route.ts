import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { chapterContent } = await req.json();
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
        You are an expert Greek Curriculum Designer.
        
        GOAL: Create a "End of Chapter Review" based on the provided lesson text.
        
        CONTENT:
        ${chapterContent.substring(0, 25000)}

        INSTRUCTIONS:
        1. **Summary**: Write a concise paragraph summarizing the key grammar and topics covered.
        2. **Keywords**: Identify the 10 most important conceptual terms or vocabulary words (Greek : English).
        3. **Matching**: Create 5 pairs for a "Matching Game". These can be "Greek Word -> English Meaning" OR "Grammar Concept -> Example".
        
        RETURN JSON ONLY:
        {
            "summary": "string",
            "keywords": [
                { "greek": "string", "english": "string" }
            ],
            "matchingPairs": [
                { "id": "1", "item": "string (Term)", "match": "string (Definition)" }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Robust JSON extraction
        let jsonStr = text;
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1) {
            jsonStr = text.substring(firstOpen, lastClose + 1);
        } else {
            // Fallback cleanup if braces not found (unlikely)
            jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        const data = JSON.parse(jsonStr);

        return NextResponse.json({ review: data });

    } catch (error) {
        console.error("Chapter Review Gen Error:", error);
        return NextResponse.json(
            { error: "Failed to generate review." },
            { status: 500 }
        );
    }
}
