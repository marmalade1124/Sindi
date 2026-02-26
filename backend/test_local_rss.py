import feedparser
from bs4 import BeautifulSoup

url = "http://localhost:3000/?action=display&bridge=FB2Bridge&u=nordecoinc&format=Atom"
feed = feedparser.parse(url)

print(f"Num entries: {len(feed.entries)}")
for i, entry in enumerate(feed.entries):
    print(f"\n--- ENTRY {i} ---")
    html_content = ""
    if 'content' in entry and len(entry.content) > 0:
        html_content = entry.content[0].value
    elif 'summary' in entry:
         html_content = entry.summary
         
    soup = BeautifulSoup(html_content, "lxml")
    post_text = soup.get_text(separator="\n").strip()
    print(post_text)
