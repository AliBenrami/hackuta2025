import os
import google.generativeai as genai

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    print("No API key found")
    exit(1)

genai.configure(api_key=api_key)

print("Available models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"  - {m.name}")
