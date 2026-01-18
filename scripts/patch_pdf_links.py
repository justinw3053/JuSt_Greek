import json
import os
import re
from pathlib import Path

# Mapping of Chapter/Topic Prefix to PDF Page
# Based on Source Material TOC
PAGE_MAPPING = {
    "1.": 2,    # Alphabet
    "2.": 21,   # Nouns & Verbs Grammar
    "3.": 35,   # Nom/Acc Cases
    "4.": 52,   # Present Tense
    "5.": 66,   # Adjectives/Articles
    "6.": 82,   # Pronouns
    "7.": 95,   # Adverbs
    "8.": 113,  # Past Tense
    "9.": 125,  # Future Tense
    "10.": 139, # Genitive
    "11.": 149, # Vocab
    "12.": 162  # Basic Verbs Appendix
}

BASE_DIR = Path("/Users/justin/JuSt_Greek/01_Curriculum/A1/detailed_content")

def patch_files():
    files = list(BASE_DIR.glob("*.json"))
    print(f"Found {len(files)} files to check for PDF links.")

    for json_file in files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        topic_id = data.get("topicId", "")
        if not topic_id:
            continue
            
        # Determine Page Number
        page_num = 1 # Default
        prefix_match = False
        
        for prefix, page in PAGE_MAPPING.items():
            if topic_id.startswith(prefix):
                page_num = page
                prefix_match = True
                break
        
        if not prefix_match:
            # Maybe it's a sub-topic that didn't match perfectly, defaulting to Title Page 1
            pass

        # Check 'reading_english'
        content = data.get("reading_english", "")
        
        # Check if already linked (avoid double patching)
        if "(/assets/grammar.pdf" in content:
            print(f"Skipping {topic_id} (Already linked)")
            continue

        # Strategy 1: Look for existing text like "(Page 44)" and linkify it
        # Regex: \(Page (\d+)\) -> [(See Page $1)](/assets/grammar.pdf#page=$1)
        
        def linkify(match):
            p = match.group(1)
            return f"[(See Page {p})](/assets/grammar.pdf#page={p})"

        new_content = re.sub(r'\(Page (\d+)\)', linkify, content)

        # Strategy 2: If no "Page X" text was found/replaced, append it to the Header line
        if new_content == content:
            # Find the first line (usually "GRAMMAR: TITLE")
            lines = content.split('\n')
            if lines and "GRAMMAR" in lines[0]:
                lines[0] += f" [(See Page {page_num})](/assets/grammar.pdf#page={page_num})"
                new_content = "\n".join(lines)
            else:
                # Prepend if no clear header
                new_content = f"**Reference**: [(See Page {page_num})](/assets/grammar.pdf#page={page_num})\n\n" + content

        # Save back
        if new_content != content:
            data["reading_english"] = new_content
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✅ Patched {topic_id} -> Page {page_num}")
        else:
            print(f"⚠️ No changes needed for {topic_id}")

if __name__ == "__main__":
    patch_files()
