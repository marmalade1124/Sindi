import asyncio
from scrapling import AsyncStealthyFetcher

async def test_fb_scrape():
    url = "https://www.facebook.com/nordecoinc"
    print(f"Fetching {url} using Scrapling StealthyFetcher...")
    
    try:
        # AsyncStealthyFetcher handles Playwright setup and stealth logic automatically
        async with AsyncStealthyFetcher(headless=True) as fetcher:
            response = await fetcher.get(url)
            print(f"Status: {response.status}")
            
            # Use Playwright's page object directly if needed to wait for posts
            page = response.page
            print("Status: Wait for page load...")
            
            # Wait a few seconds for Facebook's dynamic content to load
            await page.wait_for_timeout(5000)
            
            # Get the fully rendered HTML
            body_text = await page.content()
            
            with open("fb_scrapling_test.html", "w", encoding="utf-8") as f:
                f.write(body_text)
                
            print("Scraped length:", len(body_text))
            
            if "outage" in body_text.lower() or "power interruption" in body_text.lower():
                print("Found outage keywords in the text!")
                
            print("Done. Check fb_scrapling_test.html")
            
    except Exception as e:
        print(f"Error scraping: {e}")

if __name__ == "__main__":
    asyncio.run(test_fb_scrape())
