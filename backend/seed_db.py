"""
Seed the database with realistic Philippine electric cooperative outage data
for testing the mobile app end-to-end.
"""
from datetime import datetime, timedelta
from app.db.database import init_db, SessionLocal
from app.db.db_models import OutageRecord, AffectedArea

init_db()
db = SessionLocal()

# Clear existing test data
db.query(AffectedArea).delete()
db.query(OutageRecord).delete()
db.commit()

now = datetime.utcnow()

outages_data = [
    {
        "source_post_url": "https://www.facebook.com/nordecoinc/posts/1001",
        "post_text": "POWER INTERRUPTION ADVISORY\n\nDear consumers, please be advised of the scheduled power interruption on February 27, 2026 from 8:00 AM to 5:00 PM due to line upgrading and pole replacement activities.\n\nAffected areas:\n- Brgy. San Jose, Laoag City\n- Brgy. Sta. Monica, Bacarra\n- Brgy. Pasuquin Centro\n\nWe apologize for any inconvenience. Thank you for your understanding.",
        "outage_type": "planned",
        "start_datetime": now + timedelta(hours=12),
        "estimated_restore_datetime": now + timedelta(hours=21),
        "reason": "Line upgrading and pole replacement activities",
        "confidence_score": 0.95,
        "status": "upcoming",
        "areas": [
            {"city": "Laoag City", "barangay": "San Jose"},
            {"city": "Bacarra", "barangay": "Sta. Monica"},
            {"city": "Pasuquin", "barangay": "Centro"},
        ],
    },
    {
        "source_post_url": "https://www.facebook.com/nordecoinc/posts/1002",
        "post_text": "EMERGENCY POWER INTERRUPTION\n\nBe informed that an emergency power interruption is currently affecting parts of Batac City due to a fallen tree that hit the primary line along Barangay Palongpong. Crews have been dispatched and are working to restore power. Estimated restoration: 3 hours.\n\nAffected areas:\n- Brgy. Palongpong, Batac City\n- Brgy. Cadaratan, Batac City\n- Brgy. San Julian, Batac City\n\nPlease stay safe and away from fallen power lines.",
        "outage_type": "emergency",
        "start_datetime": now - timedelta(hours=1),
        "estimated_restore_datetime": now + timedelta(hours=2),
        "reason": "Fallen tree hit primary line along Brgy. Palongpong",
        "confidence_score": 0.92,
        "status": "active",
        "areas": [
            {"city": "Batac City", "barangay": "Palongpong"},
            {"city": "Batac City", "barangay": "Cadaratan"},
            {"city": "Batac City", "barangay": "San Julian"},
        ],
    },
    {
        "source_post_url": "https://www.facebook.com/nordecoinc/posts/1003",
        "post_text": "SCHEDULED MAINTENANCE ADVISORY\n\nNORDECO informs its consumers of the scheduled maintenance on February 28, 2026 from 6:00 AM to 4:00 PM for substation upgrading and transformer load balancing.\n\nAffected areas:\n- Brgy. Ricarte, Laoag City\n- Brgy. Buttong, Laoag City\n- Brgy. La Paz Proper, Laoag City\n- Brgy. Gaang, Laoag City\n\nThank you for your patience and cooperation.",
        "outage_type": "planned",
        "start_datetime": now + timedelta(days=1, hours=6),
        "estimated_restore_datetime": now + timedelta(days=1, hours=16),
        "reason": "Substation upgrading and transformer load balancing",
        "confidence_score": 0.97,
        "status": "upcoming",
        "areas": [
            {"city": "Laoag City", "barangay": "Ricarte"},
            {"city": "Laoag City", "barangay": "Buttong"},
            {"city": "Laoag City", "barangay": "La Paz Proper"},
            {"city": "Laoag City", "barangay": "Gaang"},
        ],
    },
    {
        "source_post_url": "https://www.facebook.com/nordecoinc/posts/1004",
        "post_text": "POWER RESTORATION NOTICE\n\nWe are pleased to inform our consumers that power has been restored in the following areas after the emergency repair of the damaged cut-out fuse along Feeder 3.\n\nRestored areas:\n- Brgy. Vintar Centro\n- Brgy. Alsem, Vintar\n\nThank you for your patience.",
        "outage_type": "emergency",
        "start_datetime": now - timedelta(hours=8),
        "estimated_restore_datetime": now - timedelta(hours=2),
        "reason": "Emergency repair of damaged cut-out fuse along Feeder 3",
        "confidence_score": 0.88,
        "status": "resolved",
        "areas": [
            {"city": "Vintar", "barangay": "Centro"},
            {"city": "Vintar", "barangay": "Alsem"},
        ],
    },
    {
        "source_post_url": "https://www.facebook.com/BELCOPhilippines/posts/2001",
        "post_text": "ABISO: BROWNOUT SCHEDULE\n\nIpapaalam po namin sa aming mga konsyumer na magkakaroon ng scheduled brownout sa March 1, 2026 mula 9:00 AM hanggang 3:00 PM para sa maintenance ng transmission line.\n\nApektadong lugar:\n- Brgy. Poblacion, Bangui\n- Brgy. Nagsurot, Bangui\n\nPasensya na po sa abala.",
        "outage_type": "planned",
        "start_datetime": now + timedelta(days=3, hours=1),
        "estimated_restore_datetime": now + timedelta(days=3, hours=7),
        "reason": "Scheduled maintenance ng transmission line",
        "confidence_score": 0.90,
        "status": "upcoming",
        "areas": [
            {"city": "Bangui", "barangay": "Poblacion"},
            {"city": "Bangui", "barangay": "Nagsurot"},
        ],
    },
]

for data in outages_data:
    record = OutageRecord(
        source_post_url=data["source_post_url"],
        post_text=data["post_text"],
        outage_type=data["outage_type"],
        start_datetime=data["start_datetime"],
        estimated_restore_datetime=data["estimated_restore_datetime"],
        reason=data["reason"],
        confidence_score=data["confidence_score"],
        status=data["status"],
    )
    db.add(record)
    db.flush()

    for area in data["areas"]:
        db.add(AffectedArea(outage_id=record.id, city=area["city"], barangay=area["barangay"]))

db.commit()

# Verify
total = db.query(OutageRecord).count()
areas = db.query(AffectedArea).count()
active = db.query(OutageRecord).filter(OutageRecord.status == "active").count()
upcoming = db.query(OutageRecord).filter(OutageRecord.status == "upcoming").count()

print(f"[OK] Seeded {total} outage records with {areas} affected areas")
print(f"     {active} active, {upcoming} upcoming")

db.close()
