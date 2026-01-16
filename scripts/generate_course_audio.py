#!/usr/bin/env python3
import os
import re
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).parent.parent
LIBRARY_DIR = BASE_DIR / "02_Library" / "A1"
INPUT_DIR = BASE_DIR / "03_Voice_Lab" / "input"
SCRIPT_PATH = BASE_DIR / "scripts" / "voice_tutor.py"

def clean_text(text):
    """Remove Markdown formatting for clearer audio."""
    # Remove headers (#, ##, etc.)
    text = re.sub(r'#+\s+', '', text)
    # Remove bold/italic (* and **)
    text = re.sub(r'\*\*|\*', '', text)
    # Remove links [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # Remove code blocks
    text = re.sub(r'`', '', text)
    # Remove list markers
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)
    return text

def process_file(source_file, output_name):
    """Read source, clean it, save to input dir, and run voice_tutor."""
    if not source_file.exists():
        print(f"[Skip] Not found: {source_file}")
        return

    print(f"Processing {source_file.name}...")
    
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()

    cleaned = clean_text(content)
    
    # Save to input dir
    input_path = INPUT_DIR / f"{output_name}.txt"
    with open(input_path, 'w', encoding='utf-8') as f:
        f.write(cleaned)
        
    # Execute voice_tutor
    # We use os.system or subprocess to call the other script
    cmd = f"{BASE_DIR}/venv/bin/python3 {SCRIPT_PATH} --file {output_name}.txt"
    os.system(cmd)

def main():
    # 1. Verbs
    process_file(LIBRARY_DIR / "vocab_top_verbs.txt", "course_verbs")
    
    # 2. Nouns & Adjectives
    process_file(LIBRARY_DIR / "vocab_nouns_adjectives.md", "course_nouns_essentials")
    
    # 3. Reading Practice (Dialogues)
    process_file(LIBRARY_DIR / "reading_practice.md", "course_dialogues")
    
    print("\n✅ Batch Audio Generation Complete.")
    print(f"Check {BASE_DIR}/03_Voice_Lab/output/")

if __name__ == "__main__":
    main()
