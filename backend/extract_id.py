import re

try:
    with open("fb_debug.html", "r", encoding="utf-8") as f:
        html = f.read()

    print("Searching for Page ID signatures in fb_debug.html...")
    m1 = re.search(r'"pageID":"(\d+)"', html)
    m2 = re.search(r'fb://page/(\d+)', html)
    m3 = re.search(r'"entity_id":"(\d+)"', html)
    m4 = re.search(r'page_id=(\d+)', html)
    m5 = re.search(r'ownerData\\":\{\\"id\\":\\"(\d+)\\"\}', html)

    if m1: print(f"Format 1: {m1.group(1)}")
    if m2: print(f"Format 2: {m2.group(1)}")
    if m3: print(f"Format 3: {m3.group(1)}")
    if m4: print(f"Format 4: {m4.group(1)}")
    if m5: print(f"Format 5: {m5.group(1)}")
    
    # Brute force search for any 15-16 digit numbers that might be IDs
    if not any([m1, m2, m3, m4, m5]):
        print("No exact matches found. Looking for large numerical IDs...")
        candidates = re.findall(r'"(\d{14,16})"', html)
        from collections import Counter
        print(Counter(candidates).most_common(5))

except Exception as e:
    print(e)
