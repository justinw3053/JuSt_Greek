#!/usr/bin/env python3
"""
JuSt_Greek Audio Manager (Amazon Polly)
---------------------------------------
Generates granular audio clips for Greek phrases using AWS Polly Neural format.
Output Structure: web_app/public/audio/[MD5_HASH].mp3
Features:
- Caching (checks if hash exists)
- Neural Engine (Eleni)
- Markdown Cleaning
"""
import argparse
import hashlib
import json
import os
import re
from pathlib import Path
from typing import List, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env (for AWS_PROFILE etc if needed)
load_dotenv()

BASE_DIR = Path(__file__).parent.parent
LIBRARY_DIR = BASE_DIR / "02_Library" / "A1"
OUTPUT_DIR = BASE_DIR / "web_app" / "public" / "audio"
MANIFEST_FILE = OUTPUT_DIR / "audio_manifest.json"

# Voice Settings
POLLY_VOICE_ID = "Vasilis"   # Eleni appears missing/deprecated in this context
POLLY_ENGINE = "standard"  
POLLY_REGION = "us-east-1"

class AudioJob(BaseModel):
    text: str
    source_file: str
    hash_key: str = ""

    def __init__(self, **data):
        super().__init__(**data)
        # Create hash from clean text
        self.hash_key = hashlib.md5(self.text.strip().encode('utf-8')).hexdigest()

def clean_text_for_polly(text: str) -> str:
    """Prepare text for TTS (strip md, fix common Greek quirks)."""
    # Remove markdown links, bold, headers
    text = re.sub(r'#+\s+', '', text)
    text = re.sub(r'\*\*|\*', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'`', '', text)
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)
    
    # Simple fix for Greek semicolons (question marks)
    text = text.replace(';', '?') 
    
    return text.strip()

def extract_phrases_from_file(file_path: Path) -> List[AudioJob]:
    """
    Parses a markdown/text file and extracts lines that contain Greek characters.
    """
    jobs = []
    if not file_path.exists():
        print(f"Warning: File not found {file_path}")
        return jobs

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    greek_pattern = re.compile(r'[α-ωΑ-Ω]')

    for line in lines:
        cleaned = clean_text_for_polly(line)
        if not cleaned:
            continue
            
        # Strategy: If line has Greek, we generate audio for it.
        # This covers vocab lists and dialogue lines.
        if greek_pattern.search(cleaned):
            jobs.append(AudioJob(text=cleaned, source_file=file_path.name))

    return jobs

class PollyManager:
    def __init__(self):
        try:
            self.client = boto3.client('polly', region_name=POLLY_REGION)
            print("[Init] AWS Polly Client connected.")
        except Exception as e:
            print(f"[Error] Failed to connect to AWS: {e}")
            self.client = None

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.manifest = {}
        if MANIFEST_FILE.exists():
            with open(MANIFEST_FILE, 'r') as f:
                self.manifest = json.load(f)

    def generate(self, job: AudioJob, force=False):
        filename = f"{job.hash_key}.mp3"
        output_path = OUTPUT_DIR / filename
        
        # Check Cache
        if output_path.exists() and not force:
            # print(f"[Skip] {job.text[:20]}... (Exists)")
            return True

        if not self.client:
            return False

        print(f"[Gen] {job.text[:40]}...")
        
        try:
            response = self.client.synthesize_speech(
                Text=job.text,
                OutputFormat='mp3',
                VoiceId=POLLY_VOICE_ID,
                Engine=POLLY_ENGINE
            )
        except (BotoCoreError, ClientError) as error:
            print(f"[Error] Polly Synthesis failed: {error}")
            return False

        if "AudioStream" in response:
            with open(output_path, 'wb') as f:
                f.write(response["AudioStream"].read())
            
            # Update Manifest
            self.manifest[job.hash_key] = {"text": job.text, "file": filename}
            return True
        
        return False

    def list_voices(self):
        try:
            response = self.client.describe_voices()
            print("\ndebug: checking first few voices...")
            for i, v in enumerate(response['Voices'][:3]):
                print(f"Sample: {v['Name']} - {v.get('LanguageName')}")

            print("\nAvailable Greek Voices (el-GR):")
            for v in response['Voices']:
                if v.get('LanguageCode') == 'el-GR':
                    print(f"- {v['Name']} ({v['LanguageName']}) Engine: {v['SupportedEngines']}")
        except Exception as e:
            print(f"Error listing voices: {e}")

    def save_manifest(self):
        with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.manifest, f, indent=2, ensure_ascii=False)
        print(f"[Done] Updated manifest with {len(self.manifest)} entries.")

def main():
    parser = argparse.ArgumentParser(description="Polly Audio Manager")
    parser.add_argument("--process-all", action="store_true", help="Process all files in 02_Library")
    parser.add_argument("--force", action="store_true", help="Force regenerate existing files")
    parser.add_argument("--list-voices", action="store_true", help="List available Greek voices")
    args = parser.parse_args()

    manager = PollyManager()

    if args.list_voices:
        manager.list_voices()
        return

    if args.process_all:
        files = [
            LIBRARY_DIR / "vocab_top_verbs.txt",
            LIBRARY_DIR / "vocab_nouns_adjectives.md",
            LIBRARY_DIR / "reading_practice.md"
        ]
        
        total_jobs = 0
        success_count = 0
        
        for p in files:
            print(f"\nProcessing {p.name}...")
            jobs = extract_phrases_from_file(p)
            for job in jobs:
                total_jobs += 1
                if manager.generate(job, force=args.force):
                    success_count += 1
        
        manager.save_manifest()
        print(f"\nCompleted: {success_count}/{total_jobs} audio files ready.")

if __name__ == "__main__":
    main()
