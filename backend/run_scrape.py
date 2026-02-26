"""
Clear all data and run a fresh scrape of NORDECO's Facebook page.
Runs Playwright outside of uvicorn to avoid Windows asyncio issues.
"""
import asyncio
import sys
import io

# Fix Windows asyncio policy for Playwright
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    # Fix stdout encoding for Windows
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from datetime import datetime
from app.db.database import init_db, SessionLocal
from app.db.db_models import OutageRecord, AffectedArea
from app.services.scraper import FacebookScraper

TARGET_PAGES = ["https://www.facebook.com/nordecoinc"]


def clear_db():
    db = SessionLocal()
    deleted_areas = db.query(AffectedArea).delete()
    deleted_outages = db.query(OutageRecord).delete()
    db.commit()
    db.close()
    print(f"[CLEAR] Deleted {deleted_outages} outages and {deleted_areas} affected areas.")


def parse_datetime(dt_str):
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str)
    except (ValueError, TypeError):
        return None


def determine_status(start_dt, end_dt):
    now = datetime.utcnow()
    if start_dt and start_dt > now:
        return "upcoming"
    if end_dt and end_dt < now:
        return "resolved"
    if start_dt and start_dt <= now:
        return "active"
    return "upcoming"


async def scrape_and_save():
    print(f"[SCRAPE] Starting scrape of {TARGET_PAGES}...")
    scraper = FacebookScraper(TARGET_PAGES)
    results = await scraper.run()

    print(f"[SCRAPE] Got {len(results)} posts from scraper.")

    db = SessionLocal()
    saved = 0

    for post in results:
        if not post.extracted_data or not post.extracted_data.is_outage:
            print(f"  [SKIP] Not an outage: {post.post_text[:60]}...")
            continue

        data = post.extracted_data
        start_dt = parse_datetime(data.start_datetime)
        end_dt = parse_datetime(data.estimated_restore_datetime)

        record = OutageRecord(
            source_post_url=post.source_post_url,
            post_text=post.post_text,
            outage_type=data.outage_type,
            start_datetime=start_dt,
            estimated_restore_datetime=end_dt,
            reason=data.reason,
            confidence_score=data.confidence_score,
            status=determine_status(start_dt, end_dt),
        )
        db.add(record)
        db.flush()

        for location in data.affected_locations:
            for barangay in location.barangays:
                db.add(AffectedArea(
                    outage_id=record.id,
                    city=location.city,
                    barangay=barangay,
                ))

        saved += 1
        print(f"  [SAVED] {data.reason}")

    db.commit()
    total = db.query(OutageRecord).count()
    areas = db.query(AffectedArea).count()
    db.close()

    print(f"\n[DONE] Saved {saved} outages with total {areas} affected areas.")
    print(f"[DONE] Total records in DB: {total}")


async def main():
    init_db()
    clear_db()
    await scrape_and_save()


if __name__ == "__main__":
    asyncio.run(main())
