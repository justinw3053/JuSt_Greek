from generate_course_audio import generate_audio, get_api_key, clean_text_for_speech

def main():
    try:
        api_key = get_api_key()
    except Exception as e:
        print(f"Error getting API key: {e}")
        return

    # Testing "O" (The - masculine)
    original_text = "Ο δρόμος"
    cleaned_text = clean_text_for_speech(original_text)
    
    print(f"DEBUG: Original: '{original_text}'")
    print(f"DEBUG: Cleaned: '{cleaned_text}'")
    
    filename = "test_o_check.mp3"
    
    print(f"Generating: {filename}...")
    success = generate_audio(api_key, cleaned_text, filename)
    
    if success:
        print(f"SUCCESS: Generated {filename}")
    else:
        print("FAILURE")

if __name__ == "__main__":
    main()
