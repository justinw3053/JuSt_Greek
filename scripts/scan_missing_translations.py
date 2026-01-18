
import json
import glob
from pathlib import Path
import re

BASE_DIR = Path(__file__).parent.parent
CONTENT_DIR = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"

def has_greek(text):
    return bool(re.search(r'[α-ωΑ-Ω]', text))

def has_translation(text):
    # Quick check for content in parentheses
    return bool(re.search(r'\(.*[a-zA-Z].*\)', text))

def main():
    files = sorted(glob.glob(str(CONTENT_DIR / "*.json")))
    count = 0
    
    print("Scanning for Greek lines missing English translations (parentheses)...")
    
    for file_path in files:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
        except:
            continue
            
        topic_id = data.get('topicId', 'unknown')
        if "Exam" in data.get('title', ''):
             # Exams often have just questions or simple lists, but let's check anyway
             pass

        raw_content = data.get('reading_greek', '')
        if not raw_content:
            continue

        lines = raw_content.split('\n')
        missing_in_file = []
        
        for idx, line in enumerate(lines):
            line = line.strip()
            if not line: continue
            
            # If it has Greek but NO parentheses with English text
            if has_greek(line) and not has_translation(line):
                missing_in_file.append((idx, line))

        if missing_in_file:
            print(f"\n[{topic_id}] {data.get('title')}")
            for idx, line in missing_in_file:
                print(f"  Line {idx}: {line}")
                count += 1

    print(f"\nTotal lines missing translation: {count}")

if __name__ == "__main__":
    main()
