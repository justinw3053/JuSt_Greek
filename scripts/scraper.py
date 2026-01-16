#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import argparse
import os
from pathlib import Path
from datetime import datetime

# Configuration for Kathimerini (example target)
TARGET_URL = "https://www.kathimerini.gr/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

BASE_DIR = Path(__file__).parent.parent
LIBRARY_DIR = BASE_DIR / "02_Library" / "B1-B2"

def get_headlines():
    """Fetch headlines from the main page."""
    try:
        response = requests.get(TARGET_URL, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # This selector is generic and might need adjustment based on the actual site structure
        # Targeting common article title classes found in Greek news portals
        articles = []
        for article in soup.find_all('h3', limit=10):
            link = article.find('a')
            if link:
                title = link.get_text().strip()
                href = link['href']
                articles.append({'title': title, 'url': href})
        
        return articles
    except Exception as e:
        print(f"Error fetching headlines: {e}")
        return []

def download_article(url):
    """Download article text to the library."""
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Attempt to find the main content
        title_tag = soup.find('h1')
        title = title_tag.get_text().strip() if title_tag else "Unknown Title"
        
        # Typical article body container (needs adjustment per site)
        # Using a generic approach that captures paragraphs
        content_div = soup.find('div', class_='entry-content') or soup.find('article')
        if not content_div:
            # Fallback: just get all paragraphs
            text = "\n\n".join([p.get_text() for p in soup.find_all('p')])
        else:
            text = "\n\n".join([p.get_text() for p in content_div.find_all('p')])
            
        # Save to file
        safe_title = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).strip().replace(' ', '_')
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"{date_str}_{safe_title}.txt"
        filepath = LIBRARY_DIR / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"Title: {title}\n")
            f.write(f"Source: {url}\n")
            f.write("="*40 + "\n\n")
            f.write(text)
            
        print(f"[Success] Saved to: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"Error downloading article: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Greek News Scraper")
    parser.add_argument("--headlines", action="store_true", help="Show latest headlines")
    parser.add_argument("--download", type=str, help="URL of article to download")
    
    args = parser.parse_args()
    
    if args.headlines:
        print(f"Fetching headlines from {TARGET_URL}...\n")
        articles = get_headlines()
        for idx, art in enumerate(articles, 1):
            print(f"{idx}. {art['title']}")
            print(f"   {art['url']}\n")
            
    elif args.download:
        download_article(args.download)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
