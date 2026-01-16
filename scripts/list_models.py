import os
import google.generativeai as genai

if not os.environ.get("GOOGLE_API_KEY"):
    print("Error: GOOGLE_API_KEY environment variable not set.")
    exit(1)

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

print("Listing available models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
