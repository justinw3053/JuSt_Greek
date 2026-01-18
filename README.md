# JuSt Greek 🇬🇷

**JuSt Greek** is a personalized, AI-augmented language learning platform designed to take a student from **Absolute Beginner (A1)** to **Fluent**. It combines a structured curriculum with a modern web app and automated content generation.

## 📂 Project Structure

*   **`web_app/`**: The Student Interface.
    *   **Stack**: Next.js 14 (App Router), AWS Amplify (Gen 2), TailwindCSS.
    *   **Goal**: visualizes the curriculum, tracks progress (XP, Streaks), and provides interactive practice.
*   **`scripts/`**: The "Backend" Automation.
    *   **Stack**: Python 3.
    *   **Goal**: Manages the syllabus, generates course content (using LLMs), synthesizes audio (Polly), and seeds the Amplify database.
*   **`01_Curriculum/`**: The Source of Truth.
    *   Markdown files defining the 12-week A1 syllabus.
*   **`00_Admin/`**: Project Management.
    *   Study logs, NotebookLM manifests, and status tracking.

## 🚀 Getting Started

### 1. The Web App
```bash
cd web_app
npm install
npm run dev
# Open http://localhost:3000
```

### 2. The Python Tools
First, ensure you have the dependencies:
```bash
cd scripts
pip install -r requirements.txt
```

**Common Commands:**
*   **Log a Study Session**:
    ```bash
    ./manager.py log 1.5 "Reading" --notes "Finished Chapter 1"
    ```
*   **Check Status**:
    ```bash
    ./manager.py status
    ```
*   **Generate Content** (Coming Soon):
    ```bash
    python generate_lesson_content.py --topic 1.1
    ```

## 🧠 The Methodology: PRIME -> OUTPUT

1.  **PRIME**: User reviews flashcards/vocab.
2.  **INPUT**: User reads the grammar notes (in Web App).
3.  **LAB**: User listens to audio and speaks (Voice Lab).
4.  **OUTPUT**: User writes sentences or takes a quiz.
