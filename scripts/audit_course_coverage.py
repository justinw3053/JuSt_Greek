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

def check_coverage(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding {file_path}")
            return []

    learning_content = get_learning_content(data)
    # Create a set of words for faster lookup, filtering out small common words if needed
    # But for now, simple substring check or token check involves less risk of lemma issues.
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
        # e.g. "Οι γυναίκες (The women)" -> check for "γυναίκες" or "women"
        # We want to be lenient: if *part* of the answer is in the text, it's likely covered.
        answer_tokens = normalize_text(correct_answer).split()
        
        # Filter out very common/generic stop words might be overkill, let's just see.
        # Check if at least ONE meaningful word from the answer exists in the content
        found = False
        
        # We can also check expectations. If it's a "Translate X" question, X should be in content.
        # But checking the ANSWER is a good proxy for "can the user Pick this?"
        
        # Heuristic: If >50% of the long words (>2 chars) in the answer are missing, flag it.
        long_tokens = [t for t in answer_tokens if len(t) > 2]
        
        if not long_tokens:
             # Answer might be "A" or "1". Check exact match.
             if normalize_text(correct_answer) in learning_tokens:
                 found = True
        else:
            # Check overlap
            matches = [t for t in long_tokens if t in learning_tokens]
            # If we match specific greek words, we are good.
            if len(matches) > 0:
                found = True
        
        if not found:
            # Last ditch: check if the whole answer string appears as a substring (handling phrases)
            if normalize_text(correct_answer) in learning_content:
                found = True
                
        if not found:
            # Maybe the question explains it? "What is the capital of Greece (Athens)?" 
            # unlikely, but let's check Question text too just in case it's a self-contained logic puzzle.
            # actually strict audit is better: content must be in LEARNING material.
            missing_items.append(f"Q{idx+1} Ans: '{correct_answer}' not found in text.")

    if missing_items:
        return [f"\nFile: {os.path.basename(file_path)}"] + [f"  - {m}" for m in missing_items]
    return []

def main():
    base_dir = "../01_Curriculum/A1/detailed_content"
    files = sorted(glob.glob(os.path.join(base_dir, "*.json")))
    
    print(f"Scanning {len(files)} lesson files for quiz coverage...\n")
    
    total_issues = 0
    files_with_issues = 0
    
    for file_path in files:
        issues = check_coverage(file_path)
        if issues:
            print("\n".join(issues))
            total_issues += len(issues) - 1 # subtract filename header
            files_with_issues += 1
            
    print(f"\nAudit Complete.")
    print(f"Files flagged: {files_with_issues}/{len(files)}")
    print(f"Total potentially uncovered questions: {total_issues}")

if __name__ == "__main__":
    main()
