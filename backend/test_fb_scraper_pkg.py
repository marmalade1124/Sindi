from facebook_scraper import get_posts
import time
import json

def test_fb_scraper():
    print("Testing facebook-scraper for nordecoinc...")
    try:
        # get_posts returns a generator
        posts = []
        for post in get_posts('nordecoinc', pages=5):
            # Just grab the first few
            posts.append({
                'text': post.get('text', '')[:100],
                'time': str(post.get('time')),
                'url': post.get('post_url')
            })
            if len(posts) >= 3:
                break
                
        print(f"Successfully scraped {len(posts)} posts!")
        for i, p in enumerate(posts):
            print(f"Post {i+1}:")
            print(json.dumps(p, indent=2))
            
    except Exception as e:
        print(f"Error scraping with facebook-scraper: {e}")

if __name__ == '__main__':
    test_fb_scraper()
