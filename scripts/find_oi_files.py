
import json
import glob
from pathlib import Path
import re

# Same config as generator
BASE_DIR = Path(__file__).parent.parent
CONTENT_DIR = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"

def clean_text_simple(text):
    text = re.sub(r'\([a-zA-Z\s]+\)', '', text)
    text = text.replace('**', '').replace('*', '')
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
    return text.strip()

def has_greek(text):
    return bool(re.search(r'[α-ωΑ-Ω]', text))

def main():
    files = sorted(glob.glob(str(CONTENT_DIR / "*.json")))
    target_files = []
    
    print("Scanning for lines starting with 'Οι' ...")
    
    for file_path in files:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
        except:
            continue
            
        topic_id = data.get('topicId', 'unknown')
        safe_id = topic_id.replace('.', '_')
        raw_content = data.get('reading_greek', '')
        
        if not raw_content:
            continue

        lines = raw_content.split('\n')
        
        for idx, line in enumerate(lines):
            line = line.strip()
            if not line or not has_greek(line):
                continue
                
            txt = clean_text_simple(line)
            
            # Check for the problematic pattern anywhere as a whole word
            # Matches "Οι" at start, middle, or end.
            if re.search(r'\bΟι\b', txt):
                mp3_name = f"topic_{safe_id}_{idx}.mp3"
                print(f"MATCH: [{topic_id}] Line {idx}: '{txt}' -> {mp3_name}")
                target_files.append(mp3_name)

    print(f"\nFound {len(target_files)} files to regenerate.")
    # Save list to file for easy deletion
    with open("files_to_delete.txt", "w") as f:
        for tf in target_files:
            f.write(tf + "\n")

if __name__ == "__main__":
    main()
