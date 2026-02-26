import asyncio
from app.services.scraper import FacebookScraper

async def main():
    # Test Cooperative endpoints
    target_pages = [
        "https://www.facebook.com/nordecoinc" # User specified target page for NORDECO
    ]
    
    print("Starting Sindi Scraping Job...")
    scraper = FacebookScraper(target_pages)
    results = await scraper.run()
    
    print(f"\nFinished scraping. Found {len(results)} relevant posts processed by AI.")
    
    # Print the AI extracted results
    for post in results:
        if post.extracted_data and post.extracted_data.is_outage:
            print(f"\n🚨 OUTAGE DETECTED 🚨")
            print(f"Type: {post.extracted_data.outage_type}")
            print(f"Start: {post.extracted_data.start_datetime}")
            print(f"Restore: {post.extracted_data.estimated_restore_datetime}")
            print(f"Reason: {post.extracted_data.reason}")
            print(f"Areas:")
            for area in post.extracted_data.affected_locations:
                print(f"  - {area.city}: {', '.join(area.barangays)}")
            print(f"Confidence: {post.extracted_data.confidence_score}")
        else:
             print("\nPost processed, but was NOT classified as an outage by AI.")
             print(f"Snippet: {post.post_text[:200]}...")

if __name__ == "__main__":
    asyncio.run(main())
