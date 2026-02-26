import os
import asyncio
from typing import List
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.async_api import async_playwright

from app.models.outage import OutagePost
from app.services.ai_engine import extract_outage_data_from_text

load_dotenv()


def safe_print(msg: str):
    """Print safely on Windows consoles that can't handle unicode."""
    print(msg.encode('ascii', 'replace').decode())


class FacebookScraper:
    def __init__(self, target_pages: List[str]):
        """
        Expects a list of full Facebook URLs or just usernames.
        e.g., ["https://www.facebook.com/nordecoinc", "another_coop"]
        """
        self.target_pages = target_pages

    def _get_page_url(self, page_identifier: str) -> str:
        if "facebook.com/" in page_identifier:
            return page_identifier
        return f"https://www.facebook.com/{page_identifier}"

    async def scrape_page(self, page_identifier: str) -> List[OutagePost]:
        url = self._get_page_url(page_identifier)
        safe_print(f"Scraping natively via Playwright: {url}")

        c_user = os.getenv("FB_C_USER", "").strip('"\'')
        xs = os.getenv("FB_XS", "").strip('"\'')

        if not c_user or not xs:
            print("Error: FB_C_USER and/or FB_XS environment variables are missing.")
            return []

        results = []
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )

                await context.add_cookies([
                    {"name": "c_user", "value": c_user, "domain": ".facebook.com", "path": "/"},
                    {"name": "xs", "value": xs, "domain": ".facebook.com", "path": "/"}
                ])

                page = await context.new_page()
                await page.goto(url, wait_until="domcontentloaded")

                # Wait for initial load
                await page.wait_for_timeout(5000)

                # Scroll multiple times to load dynamic posts and get past the "Featured" section
                for _ in range(4):
                    await page.mouse.wheel(0, 2500)
                    await page.wait_for_timeout(2000)

                # Use JavaScript to force-click all "See more" buttons
                await page.evaluate('''
                    document.querySelectorAll('div[role="button"]').forEach(el => {
                        if(el.innerText && el.innerText.includes('See more')) {
                            el.click();
                        }
                    });
                ''')
                await page.wait_for_timeout(2000)

                await page.screenshot(path="debug_facebook.png", full_page=True)
                html_content = await page.content()
                await browser.close()

                soup = BeautifulSoup(html_content, "lxml")
                message_blocks = soup.find_all(attrs={"data-ad-preview": "message"})
                
                if not message_blocks:
                    message_blocks = soup.find_all(role="article")

                seen_texts = set()

                for block in message_blocks:
                    post_text = block.get_text(separator=' ', strip=True)
                    if len(post_text) > 50 and post_text not in seen_texts:
                        seen_texts.add(post_text)
                        post = OutagePost(
                            source_post_url=url,
                            post_text=post_text,
                            extracted_data=None
                        )
                        results.append(post)

                print(f"Parsed {len(results)} potential post text blocks.")
                return results

        except Exception as e:
            safe_print(f"Scraping error on {page_identifier}: {e}")
            return []

    async def run(self):
        all_results = []
        for page in self.target_pages:
            raw_posts = await self.scrape_page(page)

            for post in raw_posts:
                # Heuristic vocabulary based on common Philippine utility announcements
                kw = [
                    "brownout", "power interruption", "outage", "maintenance",
                    "advisory", "energized", "restored", "kuryente", "abiso",
                    "serbisyo", "opisyal nga pamahayag", "scheduled",
                    "interruption", "affected area", "power supply",
                    "paalala", "babala", "pamahayag",
                ]
                if any(k in post.post_text.lower() for k in kw):
                    try:
                        safe_print(f"\nProcessing candidate post with AI: '{post.post_text[:50]}...'")
                        extracted_data = await extract_outage_data_from_text(post.post_text)
                        post.extracted_data = extracted_data
                        all_results.append(post)
                    except Exception as e:
                        safe_print(f"AI Extraction failed: {e}")

            await asyncio.sleep(2)
        return all_results
