import urllib.request
from bs4 import BeautifulSoup

url = "http://localhost:3000/"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        soup = BeautifulSoup(html, "lxml")
        
        # Find Facebook bridge
        fb_section = None
        for h2 in soup.find_all("h2"):
            if "Facebook" in h2.text:
                fb_section = h2.find_parent("section")
                break
                
        if fb_section:
            print("Found Facebook Bridge configuration:")
            labels = fb_section.find_all("label")
            for label in labels:
                print(f"- {label.text}")
            
            inputs = fb_section.find_all("input")
            for inp in inputs:
                name = inp.get("name", "")
                val = inp.get("value", "")
                if name:
                    print(f"  Input: {name} (Default: {val})")
        else:
            print("Could not find Facebook bridge in UI")
            
except Exception as e:
    print(f"Error: {e}")
