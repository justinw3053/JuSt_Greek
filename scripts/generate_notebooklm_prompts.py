
import json
import glob
from pathlib import Path

# Config
BASE_DIR = Path(__file__).parent.parent
CONTENT_DIR = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"
OUTPUT_FILE = BASE_DIR / "notebooklm_prompts.md"

def clean_text(text):
    if not text: return ""
    return text.replace('\n', ' ').replace('  ', ' ').strip()

def generate_prompt_for_lesson(data, chapter_summary=None):
    topic_id = data.get('topicId', 'Unknown')
    title = data.get('title', 'Unknown Title')
    script = data.get('audio_script', '')
    grammar = data.get('reading_english', '')
    vocab = data.get('vocabulary', [])
    
    is_exam = "Exam" in title
    
    # Extract top 5 vocab items if available
    vocab_list = ""
    if vocab:
        items = [f"- {v['item']} ({v['match']})" for v in vocab[:8]]
        vocab_list = "\n".join(items)
    
    # Custom Instructions for Exams
    if is_exam and chapter_summary:
        custom_instructions = f"""
1. **Chapter Review**: This is a Milestone Exam. Do NOT teach new grammar.
2. **Summary**: Briefly recap what we learned in Chapter {topic_id.split('.')[0]}:
{chapter_summary}
3. **Motivation**: Congratulate the student on finishing the chapter.
4. **The Test**: Remind them that this is a test of everything they learned. Good luck!
"""
    else:
        custom_instructions = f"""
1. **Introduction**: Stavros introduces the concept simply.
2. **The "Aha" Moment**: Justin asks a clarifying question about the rule "{clean_text(grammar[:100])}...".
3. **Drills**: Practice 3 key examples from the text.
4. **Challenge**: End with a quiz for the listener.
"""

    prompt = f"""
## Lesson {topic_id}: {title}

**Paste this into NotebookLM "Add Source" (Paste Text) or Upload as PDF**:

***SOURCE DATA START***
TOPIC: {title}

INTRODUCTION:
{script}

GRAMMAR NOTES:
{grammar}

KEY VOCABULARY:
{vocab_list}

CHAPTER CONTEXT (If Exam):
{chapter_summary if is_exam else "N/A"}
***SOURCE DATA END***

---

**Paste this into "Customize Audio Overview" (Instructions)**:
You are Stavros (Native Greek Teacher) and Justin (Enthusiastic Student).
Podcast Topic: **{title}**.
Goal: {"Review the Chapter and Prepare for the Exam." if is_exam else "Teach the listener the key grammar concept and drill the pronunciation."}

{custom_instructions.strip()}
"""
    return prompt

def main():
    files = sorted(glob.glob(str(CONTENT_DIR / "*.json")))
    
    # Pre-scan for chapter contents
    chapter_map = {} # { "1": ["1.1 Alphabet", "1.2 ..."] }
    
    for f in files:
        with open(f, 'r') as file:
            d = json.load(file)
            tid = d.get('topicId', '')
            title = d.get('title', '')
            if '.' in tid:
                chap = tid.split('.')[0]
                if chap not in chapter_map: chapter_map[chap] = []
                # Don't add the Exam itself to the summary details
                if "Exam" not in title:
                    chapter_map[chap].append(f"- {tid}: {title}")

    with open(OUTPUT_FILE, 'w') as out:
        out.write("# JuSt Greek: NotebookLM Prompt Sheet\n")
        out.write("Use these prompts to generate podcasts for each lesson.\n")
        out.write("After generating video, drop it in `web_app/public/videos/` with name `intro_{id_replaced}.mp4`.\n\n")
        
        for f in files:
            if "8.1.json" in f: continue
            
            with open(f, 'r') as file:
                data = json.load(file)
                
            topic_id = data.get('topicId', '')
            chap = topic_id.split('.')[0] if '.' in topic_id else ""
            
            # Get summary of PREVIOUS lessons in this chapter
            summary = "\n".join(chapter_map.get(chap, []))
            
            try:
                block = generate_prompt_for_lesson(data, chapter_summary=summary)
                out.write(block)
                out.write("\n" + "="*50 + "\n")
            except Exception as e:
                print(f"Skipping {f}: {e}")

    print(f"✅ Generated prompts in {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
