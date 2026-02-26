"""
Add a real DANECO (Davao del Norte Electric Cooperative) post to the database.
"""
from datetime import datetime
from app.db.database import init_db, SessionLocal
from app.db.db_models import OutageRecord, AffectedArea

init_db()
db = SessionLocal()

# The real DANECO post the user shared
record = OutageRecord(
    source_post_url="https://www.facebook.com/DANECOInc/posts/real_post",
    post_text="""SCHEDULED POWER INTERRUPTION
February 28, 2026 (Saturday)
8:00 AM-4:00 PM (8 hours)
REASONS:
-To install and transfer poles
-To conduct line vegetation clearing
Know that your electric cooperative is working for you. We will conduct these activities to prevent future power outages.
AFFECTED AREAS:
8:00 AM-4:00 PM
Puroks Popular, Durian & Maharlika, City Motorpool going to DMS Motorpool, TWD Pumpstation, Tagum City Police Station going to Tagum City Hall
8:00 AM-9:00 AM and 3:00 PM-4:00 PM
Lorenzo, Angelica Homes 1 & 2, Daneco Village, Rupenta 1, St. Thomas More School and Dawnaville, Magugpo East, Tagum City
Please be guided. Thank you!""",
    outage_type="planned",
    start_datetime=datetime(2026, 2, 28, 8, 0, 0),
    estimated_restore_datetime=datetime(2026, 2, 28, 16, 0, 0),
    reason="Pole installation, transfer, and line vegetation clearing",
    confidence_score=0.96,
    status="upcoming",
)
db.add(record)
db.flush()

# Add affected areas for Tagum City
areas = [
    "Purok Popular",
    "Purok Durian",
    "Purok Maharlika",
    "City Motorpool",
    "Magugpo East",
    "Lorenzo",
    "Angelica Homes",
    "Daneco Village",
    "Rupenta 1",
    "Dawnaville",
]

for area_name in areas:
    db.add(AffectedArea(outage_id=record.id, city="Tagum City", barangay=area_name))

db.commit()

total = db.query(OutageRecord).count()
print(f"[OK] Added DANECO Tagum City outage. Total records now: {total}")
db.close()
