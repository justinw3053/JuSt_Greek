import os
import re
import json
import asyncio
import boto3
import edge_tts
from pathlib import Path

# Configuration
BUCKET_NAME = "amplify-d17shqklh4ctgf-ma-justgreekassetsbucketfc3-mnyvzzh8wcdr"
PROFILE = "greek-tutor"
REGION = "eu-central-1"
VOICE = "el-GR-NestorasNeural"

BASE_DIR = Path(__file__).parent.parent
SYLLABUS_FILE = BASE_DIR / "01_Curriculum" / "A1" / "A1_Quarterly_Syllabus.md"
TEMP_AUDIO_DIR = BASE_DIR / "temp_audio"

def parse_syllabus():
    """Parse the markdown syllabus structure."""
    if not SYLLABUS_FILE.exists():
        print(f"Error: {SYLLABUS_FILE} not found.")
        return []

    with open(SYLLABUS_FILE, 'r') as f:
        lines = f.readlines()

    syllabus = []
    current_chapter = 0
    current_month = ""

    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        if line.startswith("## Month"):
            current_month = line.split(":")[1].strip()
            continue

        if line.startswith("### Chapter"):
            match = re.search(r"Chapter (\d+)", line)
            if match:
                current_chapter = int(match.group(1))
            continue

        if line.startswith("*") and "**Topic" in line:
            match = re.search(r"\*\*Topic (\d+\.\d+)\*\*: (.+)", line)
            if match:
                topic_id = match.group(1)
                title = match.group(2)
                
                # Create a simple spoken prompt for now
                spoken_text = f"Welcome to Chapter {current_chapter}. This is topic {topic_id}: {title}. Listen closely to the Greek pronunciations."

                # Check for AI-generated content
                json_path = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content" / f"{topic_id}.json"
                if json_path.exists():
                    try:
                        with open(json_path, 'r') as json_file:
                            data = json.load(json_file)
                            if data.get("audio_script"):
                                spoken_text = data.get("audio_script")
                                print(f"   📖 Loaded audio script for {topic_id}")
                    except Exception as e:
                        print(f"   ⚠️ Failed to load JSON for {topic_id}: {e}")

                entry = {
                    "topicId": topic_id,
                    "title": title,
                    "content": spoken_text
                }
                syllabus.append(entry)
                
    return syllabus

async def generate_and_upload():
    # Setup AWS Session
    session = boto3.Session(profile_name=PROFILE, region_name=REGION)
    s3 = session.client('s3')
    
    TEMP_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    
    syllabus = parse_syllabus()
    print(f"Found {len(syllabus)} topics. Starting generation and upload...")

    for item in syllabus:
        safe_id = item['topicId'].replace('.', '_')
        filename = f"topic_{safe_id}.mp3"
        local_path = TEMP_AUDIO_DIR / filename
        s3_key = f"audio/{filename}"

        # 1. Generate Audio if not exists
        if not local_path.exists():
            print(f"🎙️ Generating {filename}...")
            try:
                communicate = edge_tts.Communicate(item['content'], VOICE)
                await communicate.save(str(local_path))
            except Exception as e:
                print(f"❌ Generation failed for {filename}: {e}")
                continue
        else:
            print(f"📄 Found local {filename}, skipping generation.")

        # 2. Upload to S3
        print(f"☁️ Uploading {filename} to s3://{BUCKET_NAME}/{s3_key}...")
        try:
            s3.upload_file(str(local_path), BUCKET_NAME, s3_key)
            print("   ✅ Upload success")
        except Exception as e:
            print(f"   ❌ Upload failed: {e}")

    print("\n🎉 All operations completed.")

if __name__ == "__main__":
    asyncio.run(generate_and_upload())
