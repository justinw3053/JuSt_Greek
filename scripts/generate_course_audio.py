import requests
import json
import os
import re
import glob
import argparse
from pathlib import Path

# Config
BASE_DIR = Path(__file__).parent.parent
API_KEY_FILE = BASE_DIR / "00_Admin" / "murf_ai_API.txt"
CONTENT_DIR = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"
OUTPUT_DIR = BASE_DIR / "web_app" / "public" / "audio"

# Murf Config
BASE_URL = "https://api.murf.ai/v1/speech"
VOICE_ID = "el-GR-stavros"

def get_api_key():
    if not API_KEY_FILE.exists():
        raise FileNotFoundError(f"API Key file not found at {API_KEY_FILE}")
    with open(API_KEY_FILE, 'r') as f:
        return f.read().strip()

def has_greek(text):
    # Expanded range to cover extended Greek characters often used in polytonic or specific encodings
    # Basic Greek block is 0370-03FF.
    return bool(re.search(r'[\u0370-\u03FF]', text))

def clean_text_for_speech(text):
    """
    Remove Markdown, parenthesis hints, and structural artifacts.
    """
    text = re.sub(r'\([a-zA-Z\s]+\)', '', text)
    text = text.replace('**', '').replace('*', '')
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
    
    text = text.strip()

    # TTS Fixes
    text = re.sub(r'\bΟι\b', 'Η', text) 
    text = re.sub(r'\bοι\b', 'η', text)

    return text

def generate_audio(api_key, text, filename, force=False):
    """Generate audio via Murf and save to file."""
    file_path = OUTPUT_DIR / filename
    
    if file_path.exists() and not force:
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
    try:
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
    except Exception as e:
        print(f"!!! Exception during gen: {e}")
        return False

def process_lesson(api_key, json_path, force=False, dry_run=False):
    """Parse a single lesson file and generate audio for its Greek lines."""
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {json_path}: {e}")
        return

    topic_id = data.get('topicId', 'unknown')
    safe_id = topic_id.replace('.', '_')
    
    print(f"Processing {topic_id}: {data.get('title', 'Unknown')}")
    
    # 1. Identify Target Files (Reading)
    raw_content = data.get('reading_greek', '')
    target_files = set()
    
    if raw_content:
        lines = raw_content.split('\n')
        for idx, line in enumerate(lines):
            line = line.strip()
            if not line: continue
            if not has_greek(line): continue
            
            clean_text = clean_text_for_speech(line)
            if not clean_text: continue
            
            filename = f"topic_{safe_id}_{idx}.mp3"
            target_files.add(filename)
            
            if not dry_run:
                generate_audio(api_key, clean_text, filename, force=force)

    # 2. Identify Target Files (Vocabulary)
    vocabulary = data.get('vocabulary', [])
    if vocabulary:
        for item in vocabulary:
            vocab_id = item.get('id')
            greek_text = item.get('item')
            if not vocab_id or not greek_text: continue
            
            clean_text = clean_text_for_speech(greek_text)
            filename = f"vocab_{safe_id}_{vocab_id}.mp3"
            target_files.add(filename)
            
            if not dry_run:
                generate_audio(api_key, clean_text, filename, force=force)

    # 3. Cleanup Orphans
    if not dry_run:
        # List all existing files for this topic
        # Patterns: topic_{safe_id}_*.mp3 AND vocab_{safe_id}_*.mp3
        existing_topic_files = set(f.name for f in OUTPUT_DIR.glob(f"topic_{safe_id}_*.mp3"))
        existing_vocab_files = set(f.name for f in OUTPUT_DIR.glob(f"vocab_{safe_id}_*.mp3"))
        
        all_existing = existing_topic_files.union(existing_vocab_files)
        
        # Orphans = Existing - Target
        orphans = all_existing - target_files
        
        if orphans:
            print(f"   [Cleanup] Removing {len(orphans)} orphan files...")
            for orphan in orphans:
                print(f"     X Deleting {orphan}")
                (OUTPUT_DIR / orphan).unlink()

def main():
    parser = argparse.ArgumentParser(description="JuSt Greek Audio Factory")
    parser.add_argument("--force", action="store_true", help="Force regeneration of existing files")
    parser.add_argument("--topic", type=str, help="Specific topic ID to process (e.g. 1.1)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without calling API or deleting files")
    
    args = parser.parse_args()

    print(f"--- JuSt Greek Audio Factory ---")
    print(f"Source: {CONTENT_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Force Mode: {args.force}")
    
    if not OUTPUT_DIR.exists():
        os.makedirs(OUTPUT_DIR)
        
    try:
        key = get_api_key()
    except Exception as e:
        print(str(e))
        return

    # Find all JSONs
    files = sorted(glob.glob(str(CONTENT_DIR / "*.json")))
    
    for file_path in files:
        # Filter if topic specified
        if args.topic:
            # Check if filename matches
            if f"{args.topic}.json" not in str(file_path):
                continue
                
        process_lesson(key, file_path, force=args.force, dry_run=args.dry_run)

if __name__ == "__main__":
    main()
