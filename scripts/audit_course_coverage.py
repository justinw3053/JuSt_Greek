import json
import os
import re
import glob

def normalize_text(text):
    if not text:
        return ""
    # Lowercase and remove punctuation
    text = text.lower()
    # Remove common punctuation chars
    text = re.sub(r'[.,;()?!\[\]\-\n\r]', ' ', text)
    # Simplify multiple spaces
    return re.sub(r'\s+', ' ', text).strip()

def get_learning_content(data):
    # Combine all "source of truth" content fields
    content = ""
    if "reading_greek" in data:
        content += " " + data["reading_greek"]
    if "reading_english" in data:
        content += " " + data["reading_english"]
    if "audio_script" in data:
        content += " " + data["audio_script"]
    return normalize_text(content)

def check_coverage(file_path, all_files_content=None):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding {file_path}")
            return []

    # 1. Get Local Content
    learning_content = get_learning_content(data)
    
    # 2. If Exam, append content from ENTIRE chapter
    topic_id = data.get("topicId", "")
    if "Exam" in data.get("title", "") and "." in topic_id:
        chapter_prefix = topic_id.split(".")[0] + "." # e.g. "1."
        if all_files_content:
            for other_id, other_content in all_files_content.items():
                if other_id.startswith(chapter_prefix) and other_id != topic_id:
                    learning_content += " " + other_content

    learning_tokens = set(learning_content.split())
    
    missing_items = []
    
    if "quiz_questions" not in data:
        return []

    for idx, q in enumerate(data["quiz_questions"]):
        correct_idx = q.get("correctIndex", 0)
        options = q.get("options", [])
        
        if correct_idx >= len(options):
            missing_items.append(f"Q{idx+1}: Invalid correctIndex")
            continue
            
        correct_answer = options[correct_idx]
        
        # We clean the answer to extracting key terms. 
        answer_tokens = normalize_text(correct_answer).split()
        
        # Heuristic: If >50% of the long words (>2 chars) in the answer are missing, flag it.
        long_tokens = [t for t in answer_tokens if len(t) > 2]
        
        found = False
        if not long_tokens:
             # Answer might be "A" or "1". Check exact match.
             if normalize_text(correct_answer) in learning_tokens:
                 found = True
        else:
            # Check overlap - strict! we want at least ONE significant word to be found
            matches = [t for t in long_tokens if t in learning_tokens]
            if len(matches) > 0:
                found = True
        
        if not found:
            # Last ditch: check if the whole answer string appears as a substring (handling phrases)
            if normalize_text(correct_answer) in learning_content:
                found = True
                
        if not found:
            missing_items.append(f"Q{idx+1} Ans: '{correct_answer}' not found in Chapter text.")

    if missing_items:
        return [f"\nFile: {os.path.basename(file_path)}"] + [f"  - {m}" for m in missing_items]
    return []

def main():
    base_dir = "../01_Curriculum/A1/detailed_content"
    files = sorted(glob.glob(os.path.join(base_dir, "*.json")))
    
    print(f"Scanning {len(files)} lesson files for quiz coverage...\n")
    
    # Pre-load all content for fast chapter lookups
    all_content_map = {} # { "1.1": "text...", "1.2": "text..." }
    for file_path in files:
        with open(file_path, 'r') as f:
            d = json.load(f)
            tid = d.get("topicId", "")
            all_content_map[tid] = get_learning_content(d)

    total_issues = 0
    files_with_issues = 0
    
    for file_path in files:
        issues = check_coverage(file_path, all_files_content=all_content_map)
        if issues:
            print("\n".join(issues))
            total_issues += len(issues) - 1 # subtract filename header
            files_with_issues += 1
            
    print(f"\nAudit Complete.")
    print(f"Files flagged: {files_with_issues}/{len(files)}")
    print(f"Total potential gaps: {total_issues}")


if __name__ == "__main__":
    main()
