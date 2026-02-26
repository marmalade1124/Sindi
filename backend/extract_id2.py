import requests
import re

url = "https://www.facebook.com/nordecoinc"
print(f"Fetching {url}...")

# Sometimes a direct requests call gets the basic HTML with meta tags
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
html = r.text

print("Searching for Page ID signatures...")
m1 = re.search(r'"pageID":"(\d+)"', html)
m2 = re.search(r'fb://page/(\d+)', html)
m3 = re.search(r'"entity_id":"(\d+)"', html)
m4 = re.search(r'page_id=(\d+)', html)
m5 = re.search(r'ownerData\\":\{\\"id\\":\\"(\d+)\\"\}', html)
m6 = re.search(r'al:android:url" content="fb://page/(\d+)"', html)

if m1: print(f"Format 1: {m1.group(1)}")
if m2: print(f"Format 2: {m2.group(1)}")
if m3: print(f"Format 3: {m3.group(1)}")
if m4: print(f"Format 4: {m4.group(1)}")
if m5: print(f"Format 5: {m5.group(1)}")
if m6: print(f"Meta Tag: {m6.group(1)}")

if not any([m1, m2, m3, m4, m5, m6]):
    print("No exact matches found. Looking for large numerical IDs...")
    candidates = re.findall(r'"(\d{14,16})"', html)
    from collections import Counter
    print(Counter(candidates).most_common(5))
