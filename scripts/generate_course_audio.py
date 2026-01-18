import requests
import json
import os
import re
import glob
from pathlib import Path

# Config
BASE_DIR = Path(__file__).parent.parent
API_KEY_FILE = BASE_DIR / "00_Admin" / "murf_ai_API.txt"
CONTENT_DIR = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"
OUTPUT_DIR = BASE_DIR / "web_app" / "public" / "audio"

# Murf Config
BASE_URL = "https://api.murf.ai/v1/speech"
VOICE_ID = "el-GR-stavros"  # Hardcoded based on Discovery

def get_api_key():
    if not API_KEY_FILE.exists():
        raise FileNotFoundError(f"API Key file not found at {API_KEY_FILE}")
    with open(API_KEY_FILE, 'r') as f:
        return f.read().strip()

def has_greek(text):
    return bool(re.search(r'[α-ωΑ-Ω]', text))

def clean_text_for_speech(text):
    """
    Remove Markdown, parenthesis hints, and structural artifacts.
    Example: "Γειά (Hello) **world**" -> "Γειά world"
    """
    # Remove English translations in parens often found in text: "Καλημέρα (Good morning)"
    text = re.sub(r'\([a-zA-Z\s]+\)', '', text)
    # Remove Markdown bold/italic
    text = text.replace('**', '').replace('*', '')
    # Remove links
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
    
    text = text.strip()

    # TTS Fix: "Οι" (The - plural) is often read as letters O-I.
    # We substitute it with "Η" (The - femoral singular) which makes the EXACT same "ee" sound
    # but is reliably read as a word.
    # Match whole word 'Οι' -> 'Η', 'οι' -> 'η'
    text = re.sub(r'\bΟι\b', 'Η', text) 
    text = re.sub(r'\bοι\b', 'η', text)

    return text

def generate_audio(api_key, text, filename):
    """Generate audio via Murf and save to file."""
    # Check if exists first
    file_path = OUTPUT_DIR / filename
    if file_path.exists():
        print(f"   [Skip] Exists: {filename}")
        return True

    url = f"{BASE_URL}/generate"
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "voiceId": VOICE_ID,
        "text": text,
        "style": "General",
        "rate": 0,
        "pitch": 0,
        "sampleRate": 48000,
        "format": "MP3",
        "channel": "STEREO"
    }
    
    print(f"   [Gen] '{text[:20]}...' -> {filename}")
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code != 200:
        print(f"!!! Error {response.status_code}: {response.text}")
        return False
    
    data = response.json()
    audio_url = data.get('audioFile')
    
    if not audio_url:
        print("!!! No URL in response")
        return False
        
    # Download
    audio_data = requests.get(audio_url)
    with open(file_path, 'wb') as f:
        f.write(audio_data.content)
        
    return True

def process_lesson(api_key, json_path):
    """Parse a single lesson file and generate audio for its Greek lines."""
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {json_path}: {e}")
        return

    topic_id = data.get('topicId', 'unknown')
    # Sanitize topic ID for filename (e.g., "1.1" -> "1_1")
    safe_id = topic_id.replace('.', '_')
    
    title = data.get('title', 'Unknown')
    print(f"Processing {topic_id}: {title}")
    
    # Extract lines from "reading_greek"
    raw_content = data.get('reading_greek', '')
    if not raw_content:
        return

    lines = raw_content.split('\n')
    
    # We use a simple counter for lines to match Frontend logic
    # Frontend will splits('\n') and map index -> audio file
    for idx, line in enumerate(lines):
        line = line.strip()
        if not line: 
            continue
            
        # Only speak lines with Greek content (skip headers like "DIALOGUE")
        if not has_greek(line):
            continue
            
        clean_text = clean_text_for_speech(line)
        if not clean_text:
            continue
            
        # Naming Convention: topic_{safe_id}_{index}.mp3
        # Example: topic_1_1_3.mp3
        filename = f"topic_{safe_id}_{idx}.mp3"
        
        generate_audio(api_key, clean_text, filename)

    # Process Vocabulary (New Feature)
    vocabulary = data.get('vocabulary', [])
    if vocabulary:
        print(f"   Processing {len(vocabulary)} vocabulary items...")
        for item in vocabulary:
            # { "id": "v1", "item": "Μένω", "match": "I live" }
            vocab_id = item.get('id')
            greek_text = item.get('item')
            
            if not vocab_id or not greek_text:
                continue
                
            # Clean text (remove parens if any)
            clean_text = clean_text_for_speech(greek_text)
            
            # Naming: vocab_{topic}_{id}.mp3
            # Example: vocab_8_1_v1.mp3
            filename = f"vocab_{safe_id}_{vocab_id}.mp3"
            
            generate_audio(api_key, clean_text, filename)

def main():
    print(f"--- JuSt Greek Audio Factory ---")
    print(f"Source: {CONTENT_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    
    if not OUTPUT_DIR.exists():
        os.makedirs(OUTPUT_DIR)
        
    try:
        key = get_api_key()
    except Exception as e:
        print(str(e))
        return

    # Find all JSONs
    files = sorted(glob.glob(str(CONTENT_DIR / "*.json")))
    print(f"Found {len(files)} lesson files.")
    
    # Confirmation for bulk cost protection
    # In a real CLI we'd input(), but here we will just limit scope or run fully
    # Since verified cost is <$1, we proceed.
    
    for file_path in files:
        process_lesson(key, file_path)

if __name__ == "__main__":
    main()
