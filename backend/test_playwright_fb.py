from playwright.sync_api import sync_playwright
import time

def test_playwright_fb():
    url = "https://www.facebook.com/nordecoinc"
    print(f"Fetching {url} using Playwright...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a realistic user agent
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Go to URL
        response = page.goto(url, wait_until="networkidle")
        print(f"Status: {response.status if response else 'Unknown'}")
        
        # Wait a bit for React to hydrate and render posts
        page.wait_for_timeout(5000)
        
        # Scroll down a bit to trigger lazy loading of posts
        page.mouse.wheel(0, 2000)
        page.wait_for_timeout(3000)
        
        body_text = page.content()
        
        with open("fb_playwright_test.html", "w", encoding="utf-8") as f:
            f.write(body_text)
            
        print("Scraped length:", len(body_text))
        
        if "outage" in body_text.lower() or "power interruption" in body_text.lower() or "advisory" in body_text.lower():
            print("Found outage keywords in the text!")
            
        browser.close()
        print("Done. Check fb_playwright_test.html")

if __name__ == "__main__":
    test_playwright_fb()
