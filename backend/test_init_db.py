from app.db.database import init_db
init_db()
print("DB initialized successfully! Tables created.")

# Quick verification
from app.db.database import SessionLocal
from app.db.db_models import OutageRecord
db = SessionLocal()
count = db.query(OutageRecord).count()
print(f"Current outage records in DB: {count}")
db.close()
print("All checks passed!")
