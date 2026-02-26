import requests
import json

url = "https://smashballoon.com/custom-facebook-feed/find-facebook-id/"
# Try to figure out their API
# They have an AJAX endpoint usually

# Let's try another one: https://codeofaninja.com/tools/find-facebook-id/
# It uses an API: https://api.codeofaninja.com/api/v1/facebook/id
# Let's hit it.

api_url = "https://api.codeofaninja.com/api/v1/facebook/id"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
data = {
    'url': 'https://www.facebook.com/nordecoinc'
}
try:
    print("Testing codeofaninja API...")
    res = requests.post(api_url, data=data, headers=headers)
    print("Status:", res.status_code)
    print("Content:", res.text)
except Exception as e:
    print(e)
