import urllib.request
import re

url = "https://www.facebook.com/nordecoinc"
print(f"Fetching {url} to extract Page ID...")

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
        # Look for android applink
        match = re.search(r'fb://page/(\d+)', html)
        if match:
            print(f"Found Page ID: {match.group(1)}")
        else:
            # Look for page_id
            match2 = re.search(r'"pageID":"(\d+)"', html)
            if match2:
                 print(f"Found Page ID: {match2.group(1)}")
            else:
                 print("Could not find Page ID in HTML.")
except Exception as e:
    print(f"Error: {e}")
