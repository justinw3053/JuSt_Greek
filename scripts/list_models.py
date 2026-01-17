
import os
import google.genai as genai

def list_models():
    api_key = os.environ.get("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    
    print("Listing models...")
    for model in client.models.list(config={"page_size": 100}):
        print(f"- {model.name}")

if __name__ == "__main__":
    list_models()
