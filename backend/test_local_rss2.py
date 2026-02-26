import urllib.request
import traceback

page_id = "540552847465280"
url = f"http://localhost:3000/?action=display&bridge=FB2Bridge&u={page_id}&format=Atom"

print(f"Testing local RSS-Bridge with Page ID: {url}")
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as response:
        content = response.read().decode('utf-8')
        if "<feed" in content or "<rss" in content:
            print("SUCCESS! Got valid RSS/Atom feed.")
            print(content[:500])
        else:
            print("Failed: No RSS/Atom content.")
            print("Content received:", content[:200])
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.reason}")
    print(e.read().decode('utf-8')[:500])
except Exception as e:
    print(f"Failed: {e}")
    traceback.print_exc()
