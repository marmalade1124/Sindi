import requests
import re
import json

url = "https://graph.facebook.com/nordecoinc/picture?width=800"
print(f"Fetching {url}...")

try:
    r = requests.get(url, allow_redirects=True)
    print(f"Final URL: {r.url}")
    
    # URL might contain the ID. 
    # Try looking for _nc_eui2=... or something similar, but maybe it doesn't have the ID anymore.
    # Let's try to search the web using duckduckgo html version via requests
    
    ddg_url = "https://html.duckduckgo.com/html/"
    payload = {'q': '"fb://page/" "nordeco" OR "Northern Davao Electric Cooperative"'}
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    
    print("\nQuerying DDG...")
    res = requests.post(ddg_url, data=payload, headers=headers)
    
    matches = re.findall(r'fb://page/(\d+)', res.text)
    if matches:
         from collections import Counter
         print(f"Found IDs via DDG: {Counter(matches).most_common()}")
    else:
         print("No IDs found via DDG.")
         # Look for 15 digit numbers in the search results
         large_nums = re.findall(r'>(\d{14,16})<', res.text)
         if large_nums:
             print(f"Found large numbers: {Counter(large_nums).most_common(5)}")
         
         # Print Snippets
         from bs4 import BeautifulSoup
         soup = BeautifulSoup(res.text, "lxml")
         for a in soup.find_all('a', class_='result__snippet'):
              print(f"Snippet: {a.text}")

except Exception as e:
    print(f"Error: {e}")
