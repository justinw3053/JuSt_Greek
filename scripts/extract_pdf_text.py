
import os
from pathlib import Path
from pypdf import PdfReader

BASE_DIR = Path(__file__).parent.parent
PDF_PATH = BASE_DIR / "02_Library/A1/Modern Greek Grammar Notes for Absolute Beginners.pdf"
OUTPUT_PATH = BASE_DIR / "02_Library/A1/source_material.txt"

def extract_text():
    if not PDF_PATH.exists():
        print(f"Error: PDF not found at {PDF_PATH}")
        return

    print(f"Extracting text from {PDF_PATH}...")
    
    try:
        reader = PdfReader(str(PDF_PATH))
        full_text = []
        
        # Add metadata header
        full_text.append(f"Title: {reader.metadata.title or 'Unknown'}")
        full_text.append(f"Pages: {len(reader.pages)}")
        full_text.append("-" * 40)

        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                full_text.append(f"\n--- Page {i+1} ---\n")
                full_text.append(text)
        
        final_content = "\n".join(full_text)
        
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            f.write(final_content)
            
        print(f"✅ Extracted {len(full_text)} pages to {OUTPUT_PATH}")
        print(f"Total characters: {len(final_content)}")
        
    except Exception as e:
        print(f"Error extracting text: {e}")

if __name__ == "__main__":
    extract_text()
