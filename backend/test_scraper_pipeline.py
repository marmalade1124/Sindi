import asyncio
from app.services.scraper import FacebookScraper

async def test_scraper():
    print("Initializing Scraper...")
    scraper = FacebookScraper(['nordecoinc'])
    
    print("Running Scraper...")
    results = await scraper.run()
    
    print(f"\nTotal posts returned: {len(results)}")
    for i, post in enumerate(results):
        print(f"\n--- Post {i+1} ---")
        print(f"URL: {post.source_post_url}")
        print(f"Text snippet: {post.post_text[:100]}...")
        if post.extracted_data:
            print("Extracted Data:")
            print(f"  Is Outage: {post.extracted_data.is_outage}")
            print(f"  Type: {post.extracted_data.outage_type}")
            print(f"  Reason: {post.extracted_data.reason}")
            print(f"  Locations: {post.extracted_data.affected_locations}")
            print(f"  Start Time: {post.extracted_data.start_datetime}")
            print(f"  End Time: {post.extracted_data.estimated_restore_datetime}")
            print(f"  Confidence: {post.extracted_data.confidence_score}")
        else:
             print("No AI data extracted.")

if __name__ == "__main__":
    asyncio.run(test_scraper())
