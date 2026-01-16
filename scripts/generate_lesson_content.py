import google.genai as genai
import os
import json
import time
import re
from pathlib import Path

# Configuration
# USING gemini-2.0-flash FOR HIGH INTELLIGENCE w/ REFERENCE MATERIAL
MODEL_NAME = "gemini-2.0-flash" 

BASE_DIR = Path(__file__).parent.parent
SYLLABUS_FILE = BASE_DIR / "01_Curriculum" / "A1" / "A1_Quarterly_Syllabus.md"
SOURCE_MATERIAL_FILE = BASE_DIR / "02_Library" / "A1" / "source_material.txt"
OUTPUT_DIR = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def load_source_material():
    """Load the PDF text content."""
    if not SOURCE_MATERIAL_FILE.exists():
        print(f"Error: {SOURCE_MATERIAL_FILE} not found. Extract it first.")
        return ""
    with open(SOURCE_MATERIAL_FILE, "r", encoding="utf-8") as f:
        return f.read()

def parse_syllabus():
    """Parse format: * **Topic 1.1**: Title"""
    with open(SYLLABUS_FILE, 'r') as f:
        lines = f.readlines()
    
    topics = []
    current_chapter = 0
    
    for line in lines:
        if "### Chapter" in line:
            try:
                current_chapter = int(re.search(r"Chapter (\d+)", line).group(1))
            except:
                pass
                
        if "**Topic" in line:
            match = re.search(r"\*\*Topic (\d+\.\d+)\*\*: (.+)", line)
            if match:
                topics.append({
                    "id": match.group(1),
                    "title": match.group(2).strip(),
                    "chapter": current_chapter
                })
    return topics

def generate_content():
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable not set.")
        return

    client = genai.Client(api_key=api_key)
    
    source_text = load_source_material()
    if not source_text:
        return

    topics = parse_syllabus()
    print(f"Found {len(topics)} topics. Loaded source material ({len(source_text)} chars).")

    for topic in topics:
        output_file = OUTPUT_DIR / f"{topic['id']}.json"
        
        if output_file.exists():
            print(f"Skipping {topic['id']} (already exists)")
            continue

        print(f"Generating {topic['id']}: {topic['title']}...")

        prompt = f"""
You are an expert Greek Curriculum Developer.
Your task is to create a detailed lesson for:
Topic: {topic['title']} (Chapter {topic['chapter']})

### SOURCE MATERIAL (GROUND TRUTH)
The following text is extracted from the course textbook ("Modern Greek Grammar Notes").
Use this text as your PRIMARY source of truth.
If the specific topic is covered in the text, use the examples and explanations from there.
If the topic is NOT explicitly covered, stick to standard A1 Greek grammar but ensure it aligns with the style of the text.

--- BEGIN SOURCE SUMMARY ---
(The full text is available to you contextually. Focus on Chapter {topic['chapter']} content if mapped correctly, otherwise search relevant keywords: "{topic['title']}")
--- END SOURCE SUMMARY ---

### GUARDRAILS & INSTRUCTIONS
1. **NO HALLUCINEATIONS**: Do not invent fake Greek words or grammar rules.
2. **ALIGNMENT**: The user requested that we follow the PDF depth. If the PDF has 10 examples, provide at least 5-6 relevant ones.
3. **AUDIO SCRIPT**: Create a script that sounds like a friendly tutor walking the student through the PDF content.

### OUTPUT FORMAT (JSON ONLY)
{{
  "topicId": "{topic['id']}",
  "week": {topic['chapter']}, 
  "month": "Month 1",
  "title": "{topic['title']}",
  "reading_greek": "A substantial reading passage or set of examples in Greek, covering the full depth of the topic.",
  "reading_english": "English translation matching the Greek exactly.",
  "audio_script": "A detailed, engaging script for the TTS engine. It should explain the concept using the examples. Use '...' for pauses."
}}
"""
        # We pass the full source text as system instruction to ground the model
        max_retries = 5
        base_delay = 10
        
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        system_instruction=f"You are a strict Greek Tutor. Here is the Textbook content you must teach from:\n\n{source_text[:100000]}..." # Truncating if too large, but 100k chars is fine for flash/pro usually. 2.0 Flash context is huge.
                    )
                )
                
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:-3]
                elif text.startswith("```"):
                    text = text[3:-3]
                
                # Save raw strict JSON
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(text)
                    
                time.sleep(2) # Rate limit safety
                break # Success
                
            except Exception as e:
                print(f"Attempt {attempt+1} failed for {topic['id']}: {e}")
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    wait_time = base_delay * (2 ** attempt)
                    print(f"Rate limited. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    time.sleep(5) # Other error, short wait and retry or break?
                    # For now we retry all errors


if __name__ == "__main__":
    generate_content()
