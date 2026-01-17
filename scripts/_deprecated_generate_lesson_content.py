import google.genai as genai
import os
import json
import time
import re
from pathlib import Path

# List of models to try in order of preference
MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"]

MODEL_NAME = "gemini-2.5-flash" # Default/Fallback

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

def generate_with_retry(client, prompt, source_text):
    """Attempt generation across multiple models with smart backoff."""
    
    for model_name in MODELS_TO_TRY:
        print(f"  Attempting with model: {model_name}...")
        
        # Try up to 3 times per model for transient errors
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        system_instruction=f"You are a strict Greek Tutor. Here is the Textbook content you must teach from:\n\n{source_text[:100000]}..."
                    )
                )
                
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:-3]
                elif text.startswith("```"):
                    text = text[3:-3]
                
                # Validation: Simple check if it looks like JSON
                if text.strip().startswith("{") and text.strip().endswith("}"):
                    return text
                else:
                    raise ValueError("Output does not look like valid JSON")

            except Exception as e:
                print(f"    Error ({model_name}, attempt {attempt+1}): {e}")
                
                # Check for Quota/Rate Limits
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    # If it's a daily quota limit, break and try next model
                    if "GenerateRequestsPerDay" in str(e) or "limit: 0" in str(e):
                         print(f"    Daily quota exhausted for {model_name}. Switching models...")
                         break # Break inner loop, move to next model in outer loop
                    
                    # If it's a rate limit (RPM), wait and retry same model
                    match = re.search(r"Please retry in (\d+(\.\d+)?)s", str(e))
                    if match:
                        wait_time = float(match.group(1)) + 1.0
                        if wait_time < 20: wait_time = 20 # Enforce min 20s for 3 RPM (Safe for 5 RPM limit)
                        print(f"    Rate limited (RPM). Sleeping {wait_time:.2f}s...")
                        time.sleep(wait_time)
                    else:
                        print(f"    Rate limited. Sleeping 20s...")
                        time.sleep(20)
                else:
                    # Non-rate-limit error (e.g. server error), short sleep and retry
                    time.sleep(20)
        
        # If we exhausted attempts for this model, or broke due to daily limit, continue to next model
        print(f"  Skipping {model_name} due to errors/quota.")

    return None

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
        
        # Check if already exists and is valid
        if output_file.exists():
            try:
                with open(output_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if "audio_script" in data and len(data["audio_script"]) > 100:
                        if "quiz_questions" in data and len(data["quiz_questions"]) >= 10:
                            print(f"Skipping {topic['id']} (Already Valid Deep Content + Quiz)")
                            continue
                        else:
                             print(f"Updating {topic['id']} (Missing Quiz Questions)...")
                    else:
                        print(f"Regenerating {topic['id']} (Invalid Content)...")
            except:
                pass # If invalid JSON, regenerate
        
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
  "audio_script": "A detailed, engaging script for the TTS engine. It should explain the concept using the examples. Use '...' for pauses.",
  "quiz_questions": [
    {{
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation..."
    }}
  ]
}}
"""
        result_text = generate_with_retry(client, prompt, source_text)

        if result_text:
            # Save raw strict JSON
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(result_text)
            print(f"Success for {topic['id']}! Sleeping 20s (3 RPM limit)...")
            time.sleep(20)
        else:
            print(f"FAILED to generate content for {topic['id']} with all models.")
            # Optional: stop completely if one fails? Or try next?
            # Let's try next topic in case it was a specific content filter issue, 
            # though usually quota affects all.




if __name__ == "__main__":
    generate_content()
