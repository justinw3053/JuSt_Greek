#!/usr/bin/env python3
import argparse
import subprocess
import os
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "03_Voice_Lab" / "user_practice"

def record_audio(filename):
    """Record audio using ALSA (arecord) until interrupted."""
    
    # Ensure filename ends in .wav
    if not filename.endswith(".wav"):
        filename += ".wav"
        
    filepath = OUTPUT_DIR / filename
    
    # Standard CD quality: 44.1kHz, 16-bit, Mono (good for voice)
    # auto-file-name handling is manual here
    cmd = [
        "arecord",
        "-f", "cd", 
        "-c", "1",
        "-t", "wav",
        str(filepath)
    ]
    
    print(f"\n🎙️  Recording to: {filename}")
    print("Press CTRL+C to stop recording...")
    print("-" * 30)
    
    try:
        # Start recording process
        process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Keep main thread alive showing timer
        start_time = time.time()
        while True:
            elapsed = time.time() - start_time
            sys.stdout.write(f"\rRecording: {elapsed:.1f}s")
            sys.stdout.flush()
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        # Stop cleanly
        print("\n\n🛑 Stopping...")
        process.terminate()
        try:
            process.wait(timeout=1)
        except subprocess.TimeoutExpired:
            process.kill()
            
        print(f"✅ Saved: {filepath}")
        
    except FileNotFoundError:
        print("\n[Error] 'arecord' not found. Is this a Linux system?")
    except Exception as e:
        print(f"\n[Error] {e}")

def main():
    parser = argparse.ArgumentParser(description="JuSt_Greek Voice Recorder")
    parser.add_argument("name", nargs="?", help="Name of the recording (e.g. 'day1_attempt')")
    
    args = parser.parse_args()
    
    # If no name provided, generate timestamp
    if not args.name:
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        name = f"practice_{timestamp}"
    else:
        name = args.name
        
    record_audio(name)

if __name__ == "__main__":
    main()
