# NotebookLM Tutor Prompts

Use these prompts to turn NotebookLM into an active teacher. Copy and paste them into the chat OR use the Studio features as directed.

## 0. The "Manager" Prompt
*Use this to find your place.*

> **Prompt:**
> "Review my uploaded **'Current Student Status'** file.
> 1. Identify my **Last Completed Topic**.
> 2. Look at the **'A1 Quarterly Syllabus'**.
> 3. Tell me exactly what **Topic** I must do today and list the specific inputs/outputs required."

## 1. The Reading Generator (Input Phase)
*Use this in Chat to generate a daily reading assignment.*

> **Prompt:**
> "Review the uploaded **'A1 Quarterly Syllabus'**. I am currently on **Week [X], Topic [Y]**.
> 
> Write a short story (100 words) about **[Topic]** using ONLY the grammar and vocabulary concepts introduced up to this Week.
>
> Requirements:
> 1. Strictly adhere to the grammar limits of Week [X].
> 2. Highlight 3 key grammar points from today's lesson.
> 3. Provide a vocab list for any new words."

## 2. The Comprehension Check (Tracking)
*Use this in Chat after reading.*

> **Prompt:**
> "I have just read the text about [Topic].
> Please generate 3 multiple-choice comprehension questions and 1 translation exercise based on that text.
> Do not show me the answers yet. Wait for my response, then grade me."

## 3. The Cumulative Flashcard Generator (Studio Tab)
*Use this in the "Customize Flashcards" popup shown in the Studio tab.*

**Settings:**
*   **Sources**: Select 'A1 Quarterly Syllabus' and 'Vocabulary Lists'.
*   **Card Count**: Standard or More.

**"What should the topic be?" (Copy/Paste this):**
> "Core vocabulary words and grammar rules from **Week 1** through **Week [Insert Current Week]** of the Syllabus source."

*Note: This forces NotebookLM to scan your syllabus history.*

## 4. The Grammar Drill
*Use this in Chat.*

> **Prompt:**
> "Create a drill exercise for **[Grammar Point, e.g., The Accusative Case]**.
> Give me 5 sentences in the Nominative case (e.g., 'The water is cold') and ask me to convert them to Accusative (e.g., 'I want the water')."

## 5. The Friday Exam (Pass/Fail)
*Use this in Chat.*

> **Prompt:**
> "Review our chat history and the uploaded 'Grammar Notes'.
> Create a final test for **Unit [X]**.
> *   5 Vocabulary Questions
> *   5 Grammar Questions
> *   1 Short Writing Prompt
> Grade my response on a scale of 0-100% and tell me if I pass (Pass mark: 70%)."
