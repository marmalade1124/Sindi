from facebook_scraper import get_posts

for post in get_posts('nordecoinc', pages=3):
    print("Found post!")
    print(post['text'][:100])
    print("---")
