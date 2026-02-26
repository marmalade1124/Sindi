import os
from dotenv import load_dotenv
from facebook_scraper import get_posts
import json

load_dotenv()

def test_authenticated_scrape():
    c_user = os.getenv("FB_C_USER")
    xs = os.getenv("FB_XS")
    
    if not c_user or not xs:
        print("Error: Please set FB_C_USER and FB_XS in your .env file.")
        return
        
    print(f"Testing facebook-scraper for nordecoinc with provided cookies...")
    
    # Pass the session cookies to the scraper
    cookies = {
        "c_user": c_user,
        "xs": xs
    }
    
    try:
        posts = []
        # Increase pages limit to 5 just in case the first few pages are empty
        for post in get_posts('nordecoinc', pages=5, cookies=cookies):
            posts.append({
                'text': post.get('text', '')[:100].replace('\n', ' '),
                'time': str(post.get('time')),
                'url': post.get('post_url')
            })
            if len(posts) >= 3:
                break
                
        print(f"Successfully scraped {len(posts)} posts!")
        for i, p in enumerate(posts):
            print(f"\nPost {i+1}:")
            print(json.dumps(p, indent=2))
            
    except Exception as e:
        print(f"Error scraping with cookies: {e}")

if __name__ == "__main__":
    test_authenticated_scrape()
