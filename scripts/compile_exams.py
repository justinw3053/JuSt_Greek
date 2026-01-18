import json
import os
import glob
from pathlib import Path

BASE_DIR = Path("/Users/justin/JuSt_Greek/01_Curriculum/A1/detailed_content")

def compile_exams():
    # 1. Group files by Chapter
    chapter_map = {} # { "1": ["1.1.json", "1.2.json"...], "2": [...] }
    
    files = sorted(list(BASE_DIR.glob("*.json")))
    for f in files:
        with open(f, 'r') as json_file:
            data = json.load(json_file)
            tid = data.get("topicId", "")
            if not tid: continue
            
            # Chapter is the integer part
            chapter = tid.split('.')[0]
            if chapter not in chapter_map:
                chapter_map[chapter] = []
            chapter_map[chapter].append({
                "path": f,
                "data": data
            })
            
    # 2. Process each Chapter
    for chapter, lessons in chapter_map.items():
        # Find the Exam file (usually the last one, or title contains "Exam")
        exam_lesson = None
        source_lessons = []
        
        # Sort by topic ID to be safe
        lessons.sort(key=lambda x: float(x["data"]["topicId"]))
        
        # Heuristic: The last lesson is usually the exam
        # Or check title
        for lesson in lessons:
            if "Exam" in lesson["data"]["title"] or "Review" in lesson["data"]["title"]:
                exam_lesson = lesson
            else:
                source_lessons.append(lesson)
        
        if not exam_lesson:
            print(f"⚠️ No Exam file found for Chapter {chapter}. Skipping aggregation.")
            continue
            
        print(f"Validating Exam for Chapter {chapter} ({exam_lesson['data']['topicId']})...")
        print(f"   - Sources: {[l['data']['topicId'] for l in source_lessons]}")
        
        # 3. Aggregate Questions
        all_questions = []
        seen_questions = set()
        
        # First, include original exam questions (if they are unique)
        for q in exam_lesson["data"].get("quiz_questions", []):
            q_text = q["question"]
            if q_text not in seen_questions:
                all_questions.append(q)
                seen_questions.add(q_text)
                
        # Then, append questions from sources
        for src in source_lessons:
            src_qs = src["data"].get("quiz_questions", [])
            for q in src_qs:
                q_text = q["question"]
                if q_text not in seen_questions:
                    # Optional: Tag the question source for debugging?
                    # q["explanation"] += f" (Review from {src['data']['topicId']})"
                    all_questions.append(q)
                    seen_questions.add(q_text)
        
        print(f"   - Total Questions: {len(all_questions)}")
        
        # 4. Save Updates
        # Only update if the count changed significantly (avoid constant rewrites if already done)
        if len(all_questions) > len(exam_lesson["data"].get("quiz_questions", [])):
            exam_lesson["data"]["quiz_questions"] = all_questions
            # Update the intro text to warn the user
            exam_lesson["data"]["audio_script"] = f"Welcome to the Chapter {chapter} Final Exam. This is the ultimate test. It includes {len(all_questions)} questions covering every topic in this chapter. Take a deep breath. Good luck!"
            
            with open(exam_lesson["path"], 'w', encoding='utf-8') as f:
                json.dump(exam_lesson["data"], f, ensure_ascii=False, indent=2)
            print(f"✅ Updated {exam_lesson['data']['topicId']} with {len(all_questions)} questions.")
        else:
            print(f"   - No changes needed (Already has {len(all_questions)} Qs).")

if __name__ == "__main__":
    compile_exams()
