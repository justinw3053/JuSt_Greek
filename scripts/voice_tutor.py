#!/usr/bin/env python3
import argparse
import os
import asyncio
from pathlib import Path
import edge_tts

BASE_DIR = Path(__file__).parent.parent
INPUT_DIR = BASE_DIR / "03_Voice_Lab" / "input"
OUTPUT_DIR = BASE_DIR / "03_Voice_Lab" / "output"

# Voice Options: el-GR-AthinaNeural (Female), el-GR-NestorasNeural (Male)
VOICE = "el-GR-NestorasNeural"

async def generate_audio_async(text, filename="output.mp3"):
    """Generate audio from text using Microsoft Edge TTS (Neural)."""
    try:
        output_path = OUTPUT_DIR / filename
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(str(output_path))
        
        print(f"[Success] Audio saved to: {output_path}")
        return output_path
            
    except Exception as e:
        print(f"[Error] Edge-TTS failed: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="JuSt_Greek Voice Tutor (Edge-TTS Neural)")
    parser.add_argument("--say", type=str, help="Text to speak immediately")
    parser.add_argument("--file", type=str, help="Text file to read from (in 03_Voice_Lab/input)")
    
    args = parser.parse_args()
    
    # Create output dir if not exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    if args.say:
        asyncio.run(generate_audio_async(args.say, "interactive_test.mp3"))
    elif args.file:
        input_path = INPUT_DIR / args.file
        if not input_path.exists():
            print(f"File not found: {input_path}")
            return
        
        with open(input_path, 'r', encoding='utf-8') as f:
            text = f.read()
            
        output_name = input_path.stem + ".mp3"
        asyncio.run(generate_audio_async(text, output_name))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
