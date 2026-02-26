import asyncio
from scrapling import AsyncFetcher

async def test_scraper():
    target_url = "https://www.facebook.com/nortecdavao/"
    print(f"Fetching {target_url}...")
    
    # Enable bypass mechanisms
    fetcher = AsyncFetcher()
    response = await fetcher.get(target_url)
    
    print(f"Status Code: {response.status}")
    print("-- First 1000 chars of HTML --")
    print(response.text[:1000])

if __name__ == "__main__":
    asyncio.run(test_scraper())
