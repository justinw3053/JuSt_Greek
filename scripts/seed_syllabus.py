import boto3
import uuid
import re
import json
from pathlib import Path

from datetime import datetime

# Configuration
TABLE_NAME = "Syllabus-ffnjl4uilzhe7itrtirtk7lchi-NONE"
REGION = "eu-central-1"
PROFILE = "greek-tutor"

BASE_DIR = Path(__file__).parent.parent
SYLLABUS_FILE = BASE_DIR / "01_Curriculum" / "A1" / "A1_Quarterly_Syllabus.md"

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
                
                entry = {
                    "topicId": topic_id,
                    "chapter": current_chapter,
                    "month": current_month,
                    "title": title,
                    "description": f"Lesson for Chapter {current_chapter}: {title}",
                    "content": f"Content for {title}. Detailed Greek lesson goes here."
                }
                syllabus.append(entry)
                
    return syllabus

def seed_database():
    session = boto3.Session(profile_name=PROFILE, region_name=REGION)
    dynamodb = session.client('dynamodb')
    
    items = parse_syllabus()
    print(f"Parsed {len(items)} items from syllabus.")

    json_dir = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"
    
    for item in items:
        # Try to load detailed content
        json_path = json_dir / f"{item['topicId']}.json"
        if json_path.exists():
            try:
                with open(json_path, 'r') as f:
                    details = json.load(f)
                    
                # Format content for the frontend
                # We store the full JSON object as a string so the frontend can parse it
                item['content'] = json.dumps(details, ensure_ascii=False)
                print(f"📖 Loaded content for {item['topicId']}")
            except Exception as e:
                print(f"⚠️ Failed to load JSON for {item['topicId']}: {e}")

        # Construct DynamoDB Item
        # PK: id (UUID)
        # Attrs: topicId, week, month, title, description, content
        # System: __typename, createdAt, updatedAt
        
        # Use UUIDv5 (SHA-1 hash of namespace + name) for deterministic IDs
        # This prevents duplicates if we run the seed script multiple times
        deterministic_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"justgreek.syllabus.{item['topicId']}"))
        
        now = datetime.utcnow().isoformat() + "Z"
        
        ddb_item = {
            'id': {'S': deterministic_id},
            'topicId': {'S': item['topicId']},
            'chapter': {'N': str(item['chapter'])},
            'month': {'S': item['month']},
            'title': {'S': item['title']},
            'description': {'S': item['description']},
            'content': {'S': item['content']},
            '__typename': {'S': 'Syllabus'},
            'createdAt': {'S': now},
            'updatedAt': {'S': now}
        }

        try:
            dynamodb.put_item(
                TableName=TABLE_NAME,
                Item=ddb_item
            )
            print(f"✅ inserted {item['topicId']}: {item['title']}")
        except Exception as e:
            print(f"❌ Failed to insert {item['topicId']}: {e}")

if __name__ == "__main__":
    seed_database()
