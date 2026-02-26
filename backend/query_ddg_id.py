import requests
import re

ddg_url = "https://html.duckduckgo.com/html/"
payload = {'q': 'site:facebook.com/nordecoinc/ "page_id"'}
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

print("Querying DDG...")
res = requests.post(ddg_url, data=payload, headers=headers)

matches = re.findall(r'(\d{14,16})', res.text)
if matches:
     from collections import Counter
     print(f"Found large numbers via DDG: {Counter(matches).most_common(5)}")
else:
     print("No numbers found.")
