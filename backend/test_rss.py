import urllib.request

instances = [
    "https://rss-bridge.org/bridge01/",
    "https://bridge.suumitsu.eu/",
    "https://rss-bridge.bubu-1.eu/",
    "https://rss-bridge.snopyta.org/"
]

query = "?action=display&bridge=Facebook&context=Username&u=nordecoinc&media_type=all&format=Atom"

for base in instances:
    url = base + query
    print(f"Testing {base}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read().decode('utf-8')
            if "<feed" in content or "<rss" in content:
                print(f"SUCCESS on {base}!")
                print(content[:200])
            else:
                print("Failed: No RSS/Atom content.")
    except Exception as e:
         print(f"Failed: {e}")
