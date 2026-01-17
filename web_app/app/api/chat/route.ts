import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        // Expect 'messages' array for history, and 'context' for lesson details
        const { messages, context } = await req.json();
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Google API Key not configured on server." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use 2.5-flash for speed/smart balance
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are an expert Greek Language Tutor for the "JuSt_Greek" course.
            
            YOUR ROLE:
            1.  **The Bridge**: The user is listening to concise audio lessons. Your job is to fill in the gaps. If the audio mentions a rule briefly, you must be ready to explain the "Why" and "How" in depth.
            2.  **The Context**: You are currently discussing:
                ${context || "General Greek Grammar"}
            3.  **Pedagogy**: 
                - Correct the user's mistakes gently.
                - Use the Greek Alphabet for Greek words (limit transliteration unless asked).
                - Be encouraging but rigorous.
            
            Start by answering the user's last message directly.`
        });

        // Convert frontend messages (role: 'user'|'bot') to Gemini format (role: 'user'|'model')
        // We take all but the last one as history
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === "bot" ? "model" : "user",
            parts: [{ text: m.text }],
        }));

        const lastMessage = messages[messages.length - 1].text;

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(lastMessage);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate response." },
            { status: 500 }
        );
    }
}
