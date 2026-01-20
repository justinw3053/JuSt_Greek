
import glob
import os
import json
import re
from pathlib import Path

# Config
BASE_DIR = Path(__file__).parent.parent
CONTENT_DIR = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"
VIDEO_DIR = BASE_DIR / "web_app" / "public" / "videos"

def get_normalized_name(original_name):
    # "Lesson 1.1.mp4" -> "intro_1_1.mp4"
    # "Lesson 2.6.mp4" -> "intro_2_6.mp4"
    
    # Strip extension
    stem = Path(original_name).stem # "Lesson 1.1"
    
    # Extract numbers
    match = re.search(r'([0-9]+)\.([0-9]+)', stem)
    if match:
        return f"intro_{match.group(1)}_{match.group(2)}.mp4"
    
    return None

def main():
    print("🎬 Syncing Video Metadata...")
    
    # 1. Rename Files
    video_files = glob.glob(str(VIDEO_DIR / "*.mp4"))
    
    for v_path in video_files:
        path_obj = Path(v_path)
        original_name = path_obj.name
        
        # Skip already standardized names
        if original_name.startswith("intro_") and "Lesson" not in original_name:
            continue
            
        new_name = get_normalized_name(original_name)
        if new_name:
            new_path = VIDEO_DIR / new_name
            print(f"   RENAME: {original_name} -> {new_name}")
            os.rename(v_path, new_path)
    
    # 2. Update JSONs
    # Scan all standardized videos now
    current_videos = glob.glob(str(VIDEO_DIR / "intro_*.mp4"))
    
    updated_count = 0
    
    for v_path in current_videos:
        filename = Path(v_path).name # intro_1_1.mp4
        
        # Extract ID: intro_1_1.mp4 -> 1.1
        match = re.search(r'intro_([0-9]+)_([0-9]+)\.mp4', filename)
        if not match: continue
        
        lesson_id = f"{match.group(1)}.{match.group(2)}"
        json_path = CONTENT_DIR / f"{lesson_id}.json"
        
        if not json_path.exists():
            print(f"   ⚠️ Warning: Video {filename} exists but {lesson_id}.json does not.")
            continue
            
        # Update JSON
        with open(json_path, 'r') as f:
            data = json.load(f)
            
        target_path = f"/videos/{filename}"
        
        if data.get('intro_video') != target_path:
            data['intro_video'] = target_path
            with open(json_path, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"   ✅ Linked {lesson_id} -> {target_path}")
            updated_count += 1
        else:
            # print(f"   (Skipping {lesson_id}, already linked)")
            pass

    print(f"Done. Updated {updated_count} lesson files.")

if __name__ == "__main__":
    main()
