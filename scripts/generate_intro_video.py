
import glob
import json
from pathlib import Path

CONTENT_DIR = Path(__file__).parent.parent / "01_Curriculum" / "A1" / "detailed_content"

def main():
    files = glob.glob(str(CONTENT_DIR / "*.json"))
    for f in files:
        if "8.1.json" in f: continue
        
        with open(f, 'r') as file:
            data = json.load(file)
            
        if "intro_video" in data:
            print(f"Cleaning {f}")
            del data["intro_video"]
            
            with open(f, 'w') as file:
                json.dump(data, file, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
