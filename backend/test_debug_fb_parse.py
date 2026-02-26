import asyncio
import os
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

load_dotenv()

async def debug_scrape():
    c_user = os.getenv("FB_C_USER", "").strip('"\'')
    xs = os.getenv("FB_XS", "").strip('"\'')
    url = "https://www.facebook.com/nordecoinc"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1280, 'height': 2000}
        )
        await context.add_cookies([
            {"name": "c_user", "value": c_user, "domain": ".facebook.com", "path": "/"},
            {"name": "xs", "value": xs, "domain": ".facebook.com", "path": "/"}
        ])
        
        page = await context.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        for _ in range(5):
            await page.keyboard.press("PageDown")
            await page.wait_for_timeout(2000)
            
        html = await page.content()
        await browser.close()

    soup = BeautifulSoup(html, "lxml")
    divs = soup.find_all('div', dir='auto')
    
    with open("fb_debug_posts.txt", "w", encoding="utf-8") as f:
        f.write("--- ALL DIR=AUTO BLOCKS ---\\n")
        seen = set()
        for d in divs:
            text = d.get_text(separator=' ', strip=True)
            if len(text) > 40 and text not in seen:
                seen.add(text)
                f.write(f"[{len(text)} chars]: {text[:300]}...\\n\\n")

if __name__ == "__main__":
    asyncio.run(debug_scrape())
