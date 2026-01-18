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

def scan_detailed_content():
    """Scan the JSON files in detail_content directory."""
    json_dir = BASE_DIR / "01_Curriculum" / "A1" / "detailed_content"
    
    syllabus_items = []
    
    # Iterate over all .json files
    # Sort them by filename (which corresponds to 1.1, 1.2 etc) to be safe
    # Actually, simplistic string sort '10.1' vs '1.1' is tricky, but for scanning it doesn't matter much
    # as long as we insert them all. The frontend does the sorting.
    
    for json_file in sorted(json_dir.glob("*.json")):
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
                
            # Extract metadata
            topic_id = data.get("topicId", json_file.stem) # Fallback to filename
            
            # Infer chapter from topicId (e.g. "1.5" -> 1)
            try:
                chapter = int(topic_id.split('.')[0])
            except:
                chapter = 0
                
            title = data.get("title", f"Topic {topic_id}")
            month = data.get("month", "Month 1")
            
            entry = {
                "topicId": topic_id,
                "chapter": chapter,
                "month": month,
                "title": title,
                "description": f"Detailed Lesson {topic_id}",
                "content": json.dumps(data, ensure_ascii=False)
            }
            syllabus_items.append(entry)
            
        except Exception as e:
            print(f"⚠️ Failed to parse {json_file.name}: {e}")
            
    return syllabus_items

def seed_database():
    # Use default credentials
    session = boto3.Session(region_name=REGION)
    dynamodb = session.client('dynamodb')
    
    # Switch to scanning JSONs directly
    items = scan_detailed_content()
    print(f"Found {len(items)} lesson files.")
    
    for item in items:
        # Content is already loaded in item['content']
        print(f"📖 Processing {item['topicId']}")

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
