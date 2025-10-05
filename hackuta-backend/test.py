import os
import sys
from gemini_wrapper import analyze_ad_image_with_gemini

def main(path: str):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        sys.exit(1)
    mime = "image/png" if path.lower().endswith(".png") else "image/jpeg"
    with open(path, "rb") as f:
        data = f.read()
    try:
        result = analyze_ad_image_with_gemini(data, mime)
        print("OK:\n")
        print(result.get("analysis_text") or result)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test.py /path/to/image.{png|jpg}")
        sys.exit(2)
    if not (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")):
        print("Missing GOOGLE_API_KEY or GEMINI_API_KEY in environment")
        sys.exit(3)
    main(sys.argv[1])


