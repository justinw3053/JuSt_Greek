#!/usr/bin/env python3
import os
import re
import json
import asyncio
from pathlib import Path

import sys
import edge_tts

BASE_DIR = Path(__file__).parent.parent
SYLLABUS_FILE = BASE_DIR / "01_Curriculum" / "A1" / "A1_Quarterly_Syllabus.md"
WEB_APP_DATA_DIR = BASE_DIR / "web_app" / "data"
AUDIO_OUTPUT_DIR = BASE_DIR / "web_app" / "public" / "audio"
VOICE = "el-GR-NestorasNeural"

def parse_syllabus():
    """Parse the markdown syllabus into a structured list."""
    if not SYLLABUS_FILE.exists():
        print(f"Syllabus file not found: {SYLLABUS_FILE}")
        return []

    with open(SYLLABUS_FILE, 'r') as f:
        lines = f.readlines()

    syllabus = []
    current_week = 0
    current_month = ""

    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect Month
        if line.startswith("## Month"):
            current_month = line.split(":")[1].strip()
            continue

        # Detect Week
        if line.startswith("### Week"):
            # Extract week number
            match = re.search(r"Week (\d+)", line)
            if match:
                current_week = int(match.group(1))
            continue

        # Detect Topic
        # Format: *   **Topic 1.1**: The Alphabet...
        if line.startswith("*") and "**Topic" in line:
            # clean up
            # Remove * **Topic X.Y**: 
            # We want ID (1.1) and Title (The Alphabet...)
            match = re.search(r"\*\*Topic (\d+\.\d+)\*\*: (.+)", line)
            if match:
                topic_id = match.group(1)
                title = match.group(2)
                
                # Create entry
                entry = {
                    "id": topic_id,
                    "week": current_week,
                    "month": current_month,
                    "title": title,
                    "description": f"Lesson for Week {current_week}: {title}",
                    # Placeholder content until we have real Greek text
                    "content": f"Kalimera. This is the audio lesson for {title}. Listen and repeat." 
                }
                syllabus.append(entry)
                
    return syllabus

async def generate_assets(syllabus):
    """Generate JSON and Audio."""
    WEB_APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Save JSON
    json_path = WEB_APP_DATA_DIR / "syllabus.json"
    with open(json_path, 'w') as f:
        json.dump(syllabus, f, indent=2)
    print(f"✅ Generated Syllabus JSON: {json_path}")

    # 2. Generate Audio
    print("🎙️  Generating Audio Assets (Hyperspeed via Edge-TTS)...")
    for item in syllabus:
        filename = f"topic_{item['id'].replace('.', '_')}.mp3"
        output_path = AUDIO_OUTPUT_DIR / filename
        
        if output_path.exists():
            print(f"   [Skip] {filename} exists.")
            continue
            
        print(f"   [Gen] {filename}...")
        try:
            communicate = edge_tts.Communicate(item['content'], VOICE)
            await communicate.save(str(output_path))
        except Exception as e:
            print(f"   [Error] Failed to generate {filename}: {e}")

    print("\n✅ All Assets Generated.")

if __name__ == "__main__":
    syllabus = parse_syllabus()
    asyncio.run(generate_assets(syllabus))
