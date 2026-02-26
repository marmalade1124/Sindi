import requests

url = "https://findmyfbid.in/"
data = {"url": "https://www.facebook.com/nordecoinc"}
headers = {
    'User-Agent': 'Mozilla/5.0'
}

print("Fetching ID from findmyfbid.in...")
response = requests.post(url, data=data, headers=headers)
if response.status_code == 200:
    print(response.text[:1000])
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(response.text, "lxml")
    id_tag = soup.find(id="id")
    # or span class="id-wrapper" or similar
    if id_tag:
        print("Found ID tag:", id_tag.text)
    
    # regex fallback
    import re
    match = re.search(r'([0-9]{14,16})', response.text)
    if match:
         print("Found possible ID:", match.group(1))

else:
    print(f"Failed: {response.status_code}")
