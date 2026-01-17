
import csv
import json
import argparse
import sys
from pathlib import Path
import random

def ingest_csv(csv_path: str, topic_id: str, curriculum_dir: str = "01_Curriculum/A1/detailed_content"):
    csv_file = Path(csv_path)
    if not csv_file.exists():
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)

    # Locate the target JSON file
    target_file = None
    curriculum_path = Path(curriculum_dir)
    
    # Try direct path first
    candidate = curriculum_path / f"{topic_id}.json"
    if candidate.exists():
        target_file = candidate
    else:
        # Search recursively if needed (though structure is flat-ish)
        for f in curriculum_path.rglob(f"{topic_id}.json"):
            target_file = f
            break
    
    if not target_file:
        print(f"Error: Topic JSON for '{topic_id}' not found in {curriculum_dir}")
        sys.exit(1)

    print(f"📖 Reading CSV: {csv_file}")
    
    new_questions = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader, None) # Skip header if present, or detect it?
        
        # Heuristic: Check if first row looks like a header (e.g. "Question", "Front")
        # For simplicity, we assume row 0 is header if it contains specific keywords, else data.
        # But standard CSV exports usually have headers.
        
        for row_idx, row in enumerate(reader, start=1):
            if len(row) < 2:
                continue
            
            # Flexible Mapping:
            # Col 0: Question / Front
            # Col 1: Answer / Back
            # Col 2: Explanation / Context (Optional)
            question_text = row[0].strip()
            correct_answer = row[1].strip()
            explanation_text = row[2].strip() if len(row) > 2 else correct_answer
            
            if not question_text or not correct_answer:
                continue

            # Generate Distractors?
            # Since the CSV only has Q/A, we need distractors for multiple choice.
            # Strategy: Use answers from OTHER rows as distractors.
            # We defer this until we have read all rows.
            
            new_questions.append({
                "question": question_text,
                "correct_answer": correct_answer, 
                "explanation": explanation_text 
            })

    print(f"✅ Parsed {len(new_questions)} items.")
    
    if len(new_questions) == 0:
        print("No questions found.")
        sys.exit(0)

    # Finalize Questions (Generate Options)
    final_quiz = []
    all_answers = [q["correct_answer"] for q in new_questions]
    
    for item in new_questions:
        # Pick 3 random distractors from other answers
        distractors = [a for a in all_answers if a != item["correct_answer"]]
        
        if len(distractors) < 3:
            # Not enough data for distractors
            selected_distractors = distractors
        else:
            selected_distractors = random.sample(distractors, 3)
            
        options = [item["correct_answer"]] + selected_distractors
        random.shuffle(options)
        
        try:
            correct_index = options.index(item["correct_answer"])
        except ValueError:
            correct_index = 0

        final_quiz.append({
            "question": item["question"],
            "options": options,
            "correctIndex": correct_index,
            "explanation": item['explanation']
        })

    # Update JSON
    try:
        with open(target_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Backup old checks? No, purely overwriting as requested "Upgrade"
        data["quiz_questions"] = final_quiz
        
        with open(target_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"🎉 Successfully injected {len(final_quiz)} questions into {target_file.name}")
        
    except Exception as e:
        print(f"Error updating JSON: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest CSV Flashcards into Curriculum JSON")
    parser.add_argument("--csv", required=True, help="Path to CSV file")
    parser.add_argument("--topic", required=True, help="Topic ID (e.g. 1.1)")
    
    args = parser.parse_args()
    ingest_csv(args.csv, args.topic)
