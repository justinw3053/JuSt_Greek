# JuSt_Greek Operational Strategy

This document defines your **Daily Protocol**, **Milestones**, and the **pass/fail criteria** to ensure you are actually learning, not just reading.

## 1. The Daily Loop (1 Hour Protocol)

Repeat this cycle 5-6 days a week.

| Phase | Time | Activity | Tool |
| :--- | :--- | :--- | :--- |
| **1. Prime** | 5 min | Review yesterday's Flashcards/Vocab. | `flashcards_.csv` (or Anki) |
| **2. Input** | 20 min | **Option A**: Read a PDF chapter.<br>**Option B**: Use the "Reading Generator" prompt from `prompts.md` to have NotebookLM write a fresh story for you. | NotebookLM |
| **3. Lab** | 15 min | **Speak**: Generate audio for today's words (`voice_tutor.py`), listen, and repeat. Record yourself and compare. | `voice_tutor` + Recorder |
| **4. Output** | 15 min | **Write**: Write 5 sentences using today's grammar. Feed them to NotebookLM for correction. | NotebookLM |
| **5. Log** | 5 min | Log hours to track consistency. | `manager.py log 1.0 ...` |

## 2. Learning Path & Milestones

### Phase 1: The Foundation (A1)
*   **Focus**: Survival. "I can introduce myself and buy water."
*   **Milestone 1**: The Alphabet & Reading (Unit 1)
*   **Milestone 2**: "To Be" & "To Have" (Unit 3)
*   **Milestone 3**: The Nominative vs. Accusative Barrier (Unit 4)
*   **Exit Criteria**: You can read a menu and order food without English.

### Phase 2: The Builder (A2)
*   **Focus**: Routine. "I can describe my day and my family."
*   **Milestone**: The Past Tense (Unit 7).
*   **Exit Criteria**: You can write a 100-word email about your weekend.

### Phase 3: The Explorer (B1/B2)
*   **Focus**: Independence. "I can read the news."
*   **Milestone**: Passive Voice & Subjunctive.
*   **Exit Criteria**: You read a `scraper.py` news article and understand 70% without a dictionary.

## 3. Pass/Fail Indicators (The "Friday Exam")

At the end of each Unit, you must Pass to proceed.

**How to administer the test:**
1.  Open NotebookLM.
2.  Prompt: *"Act as my examiner. Create a 10-question quiz (multiple choice and fill-in-the-blank) based on the 'Modern Greek Grammar' source, specifically covering [Current Unit Topic]. Do not show answers until I respond."*

**Status Definition:**
*   **FAIL (< 70%)**:
    *   *Action*: Repeat the Unit. Re-read the PDF section. Generate new practice audio.
*   **PASS (70% - 89%)**:
    *   *Action*: Review incorrect answers. Move to next Unit.
*   **DISTINCTION (> 90%)**:
    *   *Action*: Move to next Unit. Skip the "Prime" phase tomorrow.

## 4. How to Grade Your Audio (The "Lab" Phase)

Since we are self-studying, you have two ways to grade your pronunciation:

**Method A: The "Ear Match" (Daily)**
1.  Play the **Tutor Audio** (`voice_tutor output`).
2.  Play **Your Recording** (`recorder output`).
3.  **Pass Criteria**: Does the rhythm identify? Is the stress on the same syllable? (e.g., *KA-li-me-ra* vs *ka-li-ME-ra*).

**Method B: The "AI Compliance Check" (Weekly)**
1.  Upload your `.wav` recording to **NotebookLM** (or Gemini Web).
2.  Prompt: *"Transcribe this audio file exactly. Do not correct errors."*
3.  **Pass Criteria**: If the AI transcribes exactly what you intended to say, your pronunciation is clear enough for a native machine to understand. If it hallucinates or writes wrong words, you **Fail**.

## 5. Tracking
Use the `manager.py` to keep yourself honest.
*   **Green Status**: > 5 hours/week.
*   **Yellow Status**: 2-5 hours/week.
*   **Red Status**: < 2 hours/week (Risk of regression).
