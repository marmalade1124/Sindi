from bs4 import BeautifulSoup

def extract_posts(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()
        
    soup = BeautifulSoup(html, 'lxml')
    
    # In modern Facebook, posts are often inside divs with role="article" or similar attributes.
    # We can also try getting text where `dir="auto"` which is commonly used for post text.
    
    posts = []
    
    # Try looking for article roles
    articles = soup.find_all(role="article")
    print(f"Found {len(articles)} elements with role='article'")
    
    for i, article in enumerate(articles):
         # Extract text, removing massive SVG dumps
         for svg in article.find_all('svg'):
              svg.decompose()
              
         post_text = article.get_text(separator=' ', strip=True)
         
         # Filter out short or completely irrelevant elements that just have role="article"
         if len(post_text) > 100 and "nordeco" in post_text.lower():
              posts.append(post_text)
              
    print(f"Filtered down to {len(posts)} potential posts.")
    for i, p in enumerate(posts[:3]):
         print(f"\n--- Post {i+1} ---")
         print(p[:300] + "...")

if __name__ == "__main__":
    extract_posts("fb_authed_playwright.html")
