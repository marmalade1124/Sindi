import os
import time
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

load_dotenv()

def test_authed_playwright():
    c_user = os.getenv("FB_C_USER").strip('"\'')
    xs = os.getenv("FB_XS").strip('"\'')
    
    print(f"Testing Authed Playwright Scraper for nordecoinc...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        # Add session cookies
        context.add_cookies([
            {"name": "c_user", "value": c_user, "domain": ".facebook.com", "path": "/"},
            {"name": "xs", "value": xs, "domain": ".facebook.com", "path": "/"}
        ])
        
        page = context.new_page()
        response = page.goto("https://www.facebook.com/nordecoinc", wait_until="domcontentloaded")
        
        print(f"Status: {response.status if response else 'Unknown'}")
        
        page.wait_for_timeout(5000)
        
        # Scroll to load a few posts
        page.mouse.wheel(0, 2000)
        page.wait_for_timeout(3000)
        
        body_text = page.content()
        with open("fb_authed_playwright.html", "w", encoding="utf-8") as f:
            f.write(body_text)
            
        print("Scraped length:", len(body_text))
        
        # Check for posts
        if "outage" in body_text.lower() or "power interruption" in body_text.lower():
            print("Found outage keywords in the text! Successfully bypassed login wall.")
        else:
            print("Could not find expected keywords.")
            
        browser.close()

if __name__ == "__main__":
    test_authed_playwright()
