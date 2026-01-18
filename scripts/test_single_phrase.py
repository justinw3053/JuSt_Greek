from generate_course_audio import generate_audio, get_api_key, clean_text_for_speech

def main():
    try:
        api_key = get_api_key()
    except Exception as e:
        print(f"Error getting API key: {e}")
        return

    # The problematic phrase
    original_text = "Οι γυναίκες"
    
    # Apply the cleaning logic which contains our patch
    cleaned_text = clean_text_for_speech(original_text)
    
    print(f"DEBUG: Original Text: '{original_text}'")
    print(f"DEBUG: Transformed Text (Sent to API): '{cleaned_text}'")
    
    # Generate a single test file in the public/audio directory
    # We'll overwrite the specific file associated with lesson 5.1 line 1 if we wanted, 
    # but let's make a distinct test file first to be safe, or just overwrite it if we are confident?
    # User said "only create one test file". Let's create 'test_oi_fix.mp3'.
    filename = "test_oi_fix.mp3"
    
    print(f"Generating single audio file: {filename}...")
    success = generate_audio(api_key, cleaned_text, filename)
    
    if success:
        print(f"SUCCESS: Generated {filename}")
        print("You can verify this file in 'web_app/public/audio/test_oi_fix.mp3'")
    else:
        print("FAILURE: Could not generate audio.")

if __name__ == "__main__":
    main()
