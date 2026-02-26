import sys
from scrapling import Fetcher

target_url = "https://www.facebook.com/nordecoinc"
fetcher = Fetcher(auto_match=True)
print(f"Fetching {target_url}...")

response = fetcher.get(target_url)
print(f"Status: {response.status}")

from bs4 import BeautifulSoup
soup = BeautifulSoup(response.text, "lxml")
for script in soup(["script", "style"]):
    script.extract()
    
texts = soup.get_text(separator="\n").splitlines()

found = 0
for t in set(texts):
    if len(t.strip()) > 30 and "facebook" not in t.lower() and "browser" not in t.lower():
        print(f"> {t.strip()}")
        found += 1

print(f"\nTotal: {found} chunks")

# Write full raw HTML to file to inspect manually
with open("raw_fb.html", "w", encoding="utf-8") as f:
     f.write(response.text)
