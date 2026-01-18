
import json
import os
import re
import subprocess
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import requests

# Config
BASE_DIR = Path(__file__).parent.parent
API_KEY_FILE = BASE_DIR / "00_Admin" / "murf_ai_API.txt"
CONTENT_DIR = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"
OUTPUT_DIR = BASE_DIR / "web_app" / "public" / "videos"
TEMP_DIR = BASE_DIR / "temp_video_assets"

# Murf Config
BASE_URL = "https://api.murf.ai/v1/speech"
VOICE_ID = "el-GR-stavros"  # Using the Greek voice for consistency

def get_api_key():
    if not API_KEY_FILE.exists():
        raise FileNotFoundError(f"API Key file not found at {API_KEY_FILE}")
    with open(API_KEY_FILE, 'r') as f:
        return f.read().strip()

def ensure_dirs():
    if not OUTPUT_DIR.exists():
        os.makedirs(OUTPUT_DIR)
    if not TEMP_DIR.exists():
        os.makedirs(TEMP_DIR)

def clean_text_for_speech(text):
    # Remove Markdown bold/italic
    text = text.replace('**', '').replace('*', '')
    # Remove links
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
    return text.strip()

def generate_audio(api_key, text, filename):
    """Generate audio via Murf."""
    file_path = TEMP_DIR / filename
    if file_path.exists():
        return file_path

    url = f"{BASE_URL}/generate"
    headers = {"api-key": api_key, "Content-Type": "application/json", "Accept": "application/json"}
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
    
    print(f"   [Audio] Generating: {text[:30]}...")
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code != 200:
        print(f"Error generating audio: {response.text}")
        return None
    
    data = response.json()
    audio_url = data.get('audioFile')
    if not audio_url: return None
        
    audio_data = requests.get(audio_url)
    with open(file_path, 'wb') as f:
        f.write(audio_data.content)
        
    return file_path

def create_slide(text, filename):
    """Create a 1920x1080 'Whiteboard' image."""
    W, H = 1920, 1080
    # Background: Dark Gray (like the app)
    # bg_color = (28, 28, 30) # #1C1C1E
    # text_color = (229, 229, 229) 
    
    # Background: White (Whiteboard style as requested)
    bg_color = (255, 255, 255)
    text_color = (0, 0, 0)
    accent_color = (0, 122, 255) # Blue

    img = Image.new('RGB', (W, H), color=bg_color)
    d = ImageDraw.Draw(img)
    
    # Attempt to load a nice font, fallback to default
    try:
        # MacOS system font
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 90)
    except:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()

    # Draw Decoration (Blue bar on left)
    d.rectangle([(0, 0), (40, H)], fill=accent_color)

    # Wrap Text
    wrapper = textwrap.TextWrapper(width=50) 
    lines = wrapper.wrap(text)
    
    # Calculate text height to center it
    line_height = 80
    total_text_height = len(lines) * line_height
    y_text = (H - total_text_height) / 2

    for line in lines:
        # Center horizontally
        bbox = d.textbbox((0, 0), line, font=font)
        text_w = bbox[2] - bbox[0]
        x_text = (W - text_w) / 2
        d.text((x_text, y_text), line, font=font, fill=text_color)
        y_text += line_height

    file_path = TEMP_DIR / filename
    img.save(file_path)
    return file_path

def create_video_segment(image_path, audio_path, output_filename):
    """Merge Image + Audio into MP4 segment."""
    output_path = TEMP_DIR / output_filename
    
    # Check if exists
    if output_path.exists():
        # Clean up to ensure freshness if inputs changed? 
        # For now, assumes immutable.
        return output_path

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(image_path),
        "-i", str(audio_path),
        "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p", "-shortest",
        str(output_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path

def concat_videos(video_files, final_output):
    """Concatenate video segments."""
    list_file = TEMP_DIR / "file_list.txt"
    with open(list_file, 'w') as f:
        for v in video_files:
            f.write(f"file '{v}'\n")
            
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-c", "copy",
        str(final_output)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"✅ Video created: {final_output}")

def process_lesson(api_key, json_path):
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    topic_id = data.get('topicId')
    safe_topic = topic_id.replace('.', '_')
    script = data.get('audio_script', '')
    
    if not script:
        return

    print(f"Start Video: {topic_id}")
    
    # Split script into paragraphs/sentences
    # We split by newlines as natural "slides"
    segments = [s.strip() for s in script.split('\n') if s.strip()]
    
    video_segments = []
    
    for idx, text in enumerate(segments):
        clean_text = clean_text_for_speech(text)
        
        # Audio
        audio_file = generate_audio(api_key, clean_text, f"{safe_topic}_seg_{idx}.mp3")
        if not audio_file: continue
            
        # Image
        img_file = create_slide(text, f"{safe_topic}_seg_{idx}.png")
        
        # Video Segment
        vid_file = create_video_segment(img_file, audio_file, f"{safe_topic}_seg_{idx}.mp4")
        video_segments.append(vid_file)
        
    if video_segments:
        final_out = OUTPUT_DIR / f"intro_{safe_topic}.mp4"
        concat_videos(video_segments, final_out)
        
        # Update JSON to point to video?
        # Ideally, yes. But for now, frontend will infer it or we manually verify.
        data['intro_video'] = f"/videos/intro_{safe_topic}.mp4"
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
def main():
    ensure_dirs()
    key = get_api_key()
    
    # For prototype, only target Lesson 8.1
    target_lesson = CONTENT_DIR / "8.1.json"
    process_lesson(key, target_lesson)

if __name__ == "__main__":
    main()
