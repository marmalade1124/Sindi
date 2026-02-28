import asyncio
import subprocess
import sys
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta, timezone
from app.db.database import SessionLocal
from app.db.db_models import OutageRecord, AffectedArea
from app.services.push_notifications import send_push_notifications

# Target FB pages for the MVP
TARGET_PAGES = [
    "https://www.facebook.com/nordecoinc",
]

scheduler = AsyncIOScheduler()


# Philippine timezone offset (UTC+8)
PHT_OFFSET = timedelta(hours=8)


def _parse_datetime(dt_str: str | None) -> datetime | None:
    """Safely parse an ISO datetime string and convert from PHT to UTC.
    The AI extracts Philippine Time, so we subtract 8 hours for UTC storage."""
    if not dt_str:
        return None
    try:
        dt = datetime.fromisoformat(dt_str)
        # If naive (no timezone info), assume it's PHT and convert to UTC
        if dt.tzinfo is None:
            dt = dt - PHT_OFFSET
        return dt
    except (ValueError, TypeError):
        return None


def _determine_status(start_dt: datetime | None, end_dt: datetime | None) -> str:
    """Determine the outage status based on times."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if end_dt and end_dt < now:
        return "resolved"
    if start_dt and start_dt > now:
        return "upcoming"
    if start_dt and start_dt <= now:
        # If it started more than 12 hours ago and has no end time, assume it's resolved
        if not end_dt and (now - start_dt).total_seconds() > 12 * 3600:
            return "resolved"
        return "active"
    return "upcoming"


async def scrape_job():
    """
    Run the scraper in a separate subprocess to avoid Windows asyncio issues
    with Playwright, then process the results.
    """
    print("[Job] Starting scheduled scraping job via subprocess...")

    try:
        # Run the scraper as a subprocess — avoids Windows asyncio event loop issues
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")

        # Use system python if venv not found
        if not os.path.exists(venv_python):
            venv_python = sys.executable

        result = subprocess.run(
            [venv_python, "-m", "app.services.scrape_runner"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            encoding="utf-8",
            errors="replace",
        )

        if result.returncode != 0:
            print(f"[Job] Scraper subprocess failed: {result.stderr[:500]}")
            return

        # Parse the JSON output from scrape_runner
        import json
        output = result.stdout.strip()

        # Find the JSON output line (starts with [)
        json_line = None
        for line in output.split("\n"):
            line = line.strip()
            if line.startswith("["):
                json_line = line
                break

        if not json_line:
            print(f"[Job] No JSON output from scraper. stdout: {output[:300]}")
            return

        posts = json.loads(json_line)
        print(f"[Job] Received {len(posts)} classified posts from subprocess.")

        # Process and save to DB
        db = SessionLocal()
        saved_count = 0

        try:
            for post in posts:
                if not post.get("is_outage"):
                    continue

                # Deduplication
                cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
                existing = db.query(OutageRecord).filter(
                    OutageRecord.source_post_url == post.get("source_url", ""),
                    OutageRecord.reason == post.get("reason"),
                    OutageRecord.created_at >= cutoff,
                ).first()

                if existing:
                    print(f"[Job] Skipping duplicate: {post.get('reason', '')[:50]}...")
                    continue

                start_dt = _parse_datetime(post.get("start_datetime"))
                end_dt = _parse_datetime(post.get("estimated_restore_datetime"))

                record = OutageRecord(
                    source_post_url=post.get("source_url", ""),
                    post_text=post.get("post_text", ""),
                    outage_type=post.get("outage_type", "advisory"),
                    start_datetime=start_dt,
                    estimated_restore_datetime=end_dt,
                    reason=post.get("reason"),
                    confidence_score=post.get("confidence_score", 1.0),
                    status=_determine_status(start_dt, end_dt),
                )
                db.add(record)
                db.flush()

                # Save affected areas
                affected_cities = []
                affected_barangays = []
                for loc in post.get("affected_locations", []):
                    city = loc.get("city", "")
                    for barangay in loc.get("barangays", []):
                        area = AffectedArea(
                            outage_id=record.id,
                            city=city,
                            barangay=barangay,
                        )
                        db.add(area)
                        if city not in affected_cities:
                            affected_cities.append(city)
                        affected_barangays.append(barangay)

                saved_count += 1
                print(f"[Job] ✅ Saved outage: {post.get('reason', 'Unknown')}")

                # Send push notifications for new outage
                db.commit()  # Commit first so the outage has an ID
                send_push_notifications(
                    db=db,
                    outage_reason=post.get("reason", "Power interruption detected"),
                    outage_type=post.get("outage_type", "advisory"),
                    affected_cities=affected_cities,
                    affected_barangays=affected_barangays,
                    outage_id=record.id,
                )

            db.commit()
            print(f"[Job] Done. Saved {saved_count} new outage(s).")

        except Exception as e:
            db.rollback()
            print(f"[Job] Error saving to DB: {e}")
        finally:
            db.close()

    except subprocess.TimeoutExpired:
        print("[Job] Scraper subprocess timed out after 5 minutes.")
    except Exception as e:
        print(f"[Job] Error running scraper: {e}")


def start_scheduler():
    """Start the APScheduler to run scraping immediately, then every 10 minutes."""
    scheduler.add_job(
        scrape_job, 
        "interval", 
        minutes=10, 
        id="scrape_job", 
        replace_existing=True,
        next_run_time=datetime.now()
    )
    scheduler.start()
    print("[Scheduler] Started. Monitoring pages every 10 minutes.")


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Scheduler] Stopped.")
