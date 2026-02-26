import requests

url = "http://graph.facebook.com/nordecoinc/picture"
print(f"Fetching redirect for {url}...")

try:
    # Set allow_redirects=False to inspect the Location header
    r = requests.get(url, allow_redirects=False)
    
    if r.status_code in (301, 302):
        location = r.headers.get('Location', '')
        print(f"Redirected to: {location}")
        
        # Usually looks like: https://scontent.../v/t1.6435-9/...?_nc_cat=103&...
        # Wait, the traditional trick redirects to platform-lookaside with asid=...
        import urllib.parse as urlparse
        from urllib.parse import parse_qs
        parsed = urlparse.urlparse(location)
        if 'asid' in parse_qs(parsed.query):
             print(f"Found ID via asid: {parse_qs(parsed.query)['asid'][0]}")
             
        # Or let's just use requests to follow it and see if the ID comes up
    else:
        print(f"Status: {r.status_code}")
        print(r.text)

except Exception as e:
    print(f"Error: {e}")
