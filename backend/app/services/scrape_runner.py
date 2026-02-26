"""
Standalone scraper runner — invoked as a subprocess by the worker.
Outputs JSON to stdout so the parent process can parse results.

Usage: python -m app.services.scrape_runner
"""
import asyncio
import sys
import os
import json
import io

# Fix Windows encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
load_dotenv()

from app.services.scraper import FacebookScraper

TARGET_PAGES = [
    "https://www.facebook.com/nordecoinc",
]


async def main():
    scraper = FacebookScraper(TARGET_PAGES)
    results = await scraper.run()

    # Convert to JSON-serializable format
    output = []
    for post in results:
        if not post.extracted_data or not post.extracted_data.is_outage:
            continue

        data = post.extracted_data
        output.append({
            "is_outage": True,
            "source_url": post.source_post_url,
            "post_text": post.post_text,
            "outage_type": data.outage_type,
            "start_datetime": data.start_datetime,
            "estimated_restore_datetime": data.estimated_restore_datetime,
            "reason": data.reason,
            "confidence_score": data.confidence_score,
            "affected_locations": [
                {"city": loc.city, "barangays": loc.barangays}
                for loc in data.affected_locations
            ],
        })

    # Output JSON to stdout (the worker will parse this)
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
