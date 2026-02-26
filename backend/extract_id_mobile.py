import urllib.request
import re

url = "https://m.facebook.com/nordecoinc"
print(f"Fetching {url}...")

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'})

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8', errors='ignore')
        
        # In mobile HTML, page id is often explicitly in 'page_id' variables
        matches = re.finditer(r'page_id[=:]"?(\d{10,20})', html)
        ids = [m.group(1) for m in matches]
        
        # also entity_id
        matches2 = re.finditer(r'entity_id[=:]"?(\d{10,20})', html)
        ids.extend([m.group(1) for m in matches2])
        
        # standard 15-digit ids
        matches3 = re.finditer(r'profile_id[=:]"?(\d{10,20})', html)
        ids.extend([m.group(1) for m in matches3])
        
        from collections import Counter
        print("Candidates:", Counter(ids).most_common(5))
        
        if not ids:
             # Just look for any 15-16 digit number
             large_nums = re.findall(r'(\d{14,16})', html)
             print("Large numbers:", Counter(large_nums).most_common(5))
             
except Exception as e:
    print(f"Error: {e}")
