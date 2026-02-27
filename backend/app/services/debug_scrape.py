import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
load_dotenv()

from app.services.scraper import FacebookScraper

async def test():
    scraper = FacebookScraper(["https://www.facebook.com/nordecoinc"])
    raw_posts = await scraper.scrape_page("https://www.facebook.com/nordecoinc")
    
    with open("blocks_dump.txt", "w", encoding="utf-8") as f:
        f.write(f"Found {len(raw_posts)} blocks:\n\n")
        for i, post in enumerate(raw_posts):
            f.write(f"--- Block {i+1} ---\n")
            f.write(post.post_text + "\n\n")

if __name__ == "__main__":
    asyncio.run(test())
