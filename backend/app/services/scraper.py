import os
import asyncio
from typing import List
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

from app.models.outage import OutagePost
from app.services.ai_engine import extract_outage_data_from_text

load_dotenv()

# Maximum retry attempts for scraping
MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = [5, 15, 30]  # Exponential-ish backoff


class CookieExpiredError(Exception):
    """Raised when Facebook cookies have expired and a login redirect is detected."""
    pass


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

    def _detect_login_redirect(self, page_url: str) -> bool:
        """Check if the current URL indicates a login redirect (cookie expired)."""
        login_indicators = [
            "/login", "/checkpoint", "login_attempt",
            "facebook.com/login", "facebook.com/checkpoint"
        ]
        return any(indicator in page_url.lower() for indicator in login_indicators)

    async def _scrape_page_attempt(self, page_identifier: str) -> List[OutagePost]:
        """Single scrape attempt. May raise CookieExpiredError."""
        url = self._get_page_url(page_identifier)
        safe_print(f"Scraping natively via Playwright: {url}")

        c_user = os.getenv("FB_C_USER", "").strip('"\'')
        xs = os.getenv("FB_XS", "").strip('"\'')

        if not c_user or not xs:
            print("Error: FB_C_USER and/or FB_XS environment variables are missing.")
            return []

        results = []
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
            await stealth_async(page)
            await page.goto(url, wait_until="domcontentloaded")

            # ── Cookie expiry detection ──
            current_url = page.url
            if self._detect_login_redirect(current_url):
                await browser.close()
                raise CookieExpiredError(
                    f"Facebook redirected to login page ({current_url}). "
                    "FB_C_USER and FB_XS cookies have likely expired. "
                    "Please update them in your environment variables."
                )

            # Wait for initial load
            try:
                await page.wait_for_selector('div[role="article"]', timeout=15000)
            except Exception:
                safe_print("Warning: Timed out waiting for an article to load. Proceeding anyway.")
                await page.wait_for_timeout(5000)

                # Double-check: after timeout, if we're on login page, cookies expired
                if self._detect_login_redirect(page.url):
                    await browser.close()
                    raise CookieExpiredError(
                        "Facebook session expired. No articles loaded and page redirected to login."
                    )

            # Scroll multiple times to load dynamic posts
            for _ in range(4):
                await page.mouse.wheel(0, 2500)
                await page.wait_for_timeout(2000)
                
                # Click "See more" buttons as new posts load
                try:
                    await page.evaluate('''
                        document.querySelectorAll('div[role="button"]').forEach(el => {
                            if(el.innerText && (el.innerText.includes('See more') || el.innerText.includes('See More'))) {
                                el.click();
                            }
                        });
                    ''')
                except Exception as e:
                    safe_print(f"Error clicking 'See more': {e}")
            
            # One final pass after all scrolls
            await page.evaluate('''
                document.querySelectorAll('div[role="button"]').forEach(el => {
                    if(el.innerText && (el.innerText.includes('See more') || el.innerText.includes('See More'))) {
                        el.click();
                    }
                });
            ''')
            await page.wait_for_timeout(2000)

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

    async def scrape_page(self, page_identifier: str) -> List[OutagePost]:
        """Scrape a page with retry logic and exponential backoff."""
        last_error = None

        for attempt in range(MAX_RETRIES):
            try:
                result = await self._scrape_page_attempt(page_identifier)
                return result

            except CookieExpiredError as e:
                # Cookie expiry is not retryable — fail immediately with a clear message
                safe_print(f"🔴 COOKIE EXPIRED: {e}")
                print("ACTION REQUIRED: Update FB_C_USER and FB_XS in your environment variables.")
                raise  # Re-raise so the runner can report it

            except Exception as e:
                last_error = e
                backoff = RETRY_BACKOFF_SECONDS[attempt] if attempt < len(RETRY_BACKOFF_SECONDS) else 30
                safe_print(f"⚠️ Scrape attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    safe_print(f"   Retrying in {backoff}s...")
                    await asyncio.sleep(backoff)

        safe_print(f"🔴 All {MAX_RETRIES} scrape attempts failed for {page_identifier}: {last_error}")
        return []

    async def run(self):
        all_results = []
        for page in self.target_pages:
            try:
                raw_posts = await self.scrape_page(page)
            except CookieExpiredError:
                # Already logged, continue to next page (though probably all will fail)
                continue

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
