
import boto3
import uuid
import time

TABLE_NAME = "Syllabus-ffnjl4uilzhe7itrtirtk7lchi-NONE"
AWS_REGION = "eu-central-1"
PROFILE_NAME = "greek-tutor"

try:
    session = boto3.Session(profile_name=PROFILE_NAME)
    dynamodb = session.client('dynamodb', region_name=AWS_REGION)
except Exception as e:
    print(f"Error checking credentials: {e}")
    exit(1)

def get_deterministic_id(topic_id):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"justgreek.syllabus.{topic_id}"))

def main():
    print("Scanning table for duplicates...")
    
    paginator = dynamodb.get_paginator('scan')
    response_iterator = paginator.paginate(TableName=TABLE_NAME)
    
    items_to_delete = []
    total_items = 0
    kept_items = 0
    
    for page in response_iterator:
        for item in page['Items']:
            total_items += 1
            item_id = item['id']['S']
            topic_id = item['topicId']['S']
            
            expected_id = get_deterministic_id(topic_id)
            
            if item_id != expected_id:
                print(f"❌ MARK DELETE: {topic_id} (ID: {item_id} != {expected_id})")
                items_to_delete.append(item_id)
            else:
                print(f"✅ KEEP: {topic_id} (ID matches)")
                kept_items += 1

    print(f"\nFound {total_items} total items.")
    print(f"Keeping {kept_items} correct items.")
    print(f"Deleting {len(items_to_delete)} legacy duplicates...")
    
    if items_to_delete:
        # Batch delete
        for i in range(0, len(items_to_delete), 25):
            batch = items_to_delete[i:i+25]
            request_items = {
                TABLE_NAME: [{'DeleteRequest': {'Key': {'id': {'S': pid}}}} for pid in batch]
            }
            
            print(f"Processing batch {i} to {i+len(batch)}...")
            dynamodb.batch_write_item(RequestItems=request_items)
            time.sleep(1)
            
    print("Cleanup complete.")

if __name__ == "__main__":
    main()
