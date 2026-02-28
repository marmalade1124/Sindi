import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.db.database import get_db
from app.db.db_models import OutageRecord, AffectedArea, UserProfile

router = APIRouter(prefix="/api")


# ──────── Pydantic Schemas ────────

class UserCreate(BaseModel):
    device_id: str
    city: Optional[str] = None
    barangay: Optional[str] = None
    emergency_only: bool = False
    push_token: Optional[str] = None


# ──────── Outage Endpoints ────────

@router.get("/outages")
def list_outages(
    status: Optional[str] = Query(None, description="Filter by status: upcoming, active, resolved"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List outages, optionally filtered by status."""
    query = db.query(OutageRecord).options(joinedload(OutageRecord.affected_areas))

    if status:
        query = query.filter(OutageRecord.status == status)

    outages = query.order_by(OutageRecord.created_at.desc()).limit(limit).all()

    seen = set()
    unique = []
    for o in outages:
        if o.id not in seen:
            seen.add(o.id)
            unique.append(o)

    return [o.to_dict() for o in unique]


@router.get("/outages/active")
def get_active_outages(db: Session = Depends(get_db)):
    """Get currently active outages."""
    _update_outage_statuses(db)

    outages = (
        db.query(OutageRecord)
        .options(joinedload(OutageRecord.affected_areas))
        .filter(OutageRecord.status == "active")
        .order_by(OutageRecord.created_at.desc())
        .all()
    )

    seen = set()
    unique = []
    for o in outages:
        if o.id not in seen:
            seen.add(o.id)
            unique.append(o)

    return [o.to_dict() for o in unique]


# IMPORTANT: /outages/search MUST be before /outages/{outage_id}
@router.get("/outages/search")
def search_outages(
    q: str = Query(..., min_length=2, description="Search query"),
    db: Session = Depends(get_db),
):
    """Search outages by reason, area name, or post text."""
    search_term = f"%{q}%"
    outages = (
        db.query(OutageRecord)
        .outerjoin(AffectedArea)
        .options(joinedload(OutageRecord.affected_areas))
        .filter(
            (OutageRecord.reason.ilike(search_term)) |
            (OutageRecord.post_text.ilike(search_term)) |
            (AffectedArea.city.ilike(search_term)) |
            (AffectedArea.barangay.ilike(search_term))
        )
        .order_by(OutageRecord.created_at.desc())
        .limit(30)
        .all()
    )

    seen = set()
    unique = []
    for o in outages:
        if o.id not in seen:
            seen.add(o.id)
            unique.append(o)

    return [o.to_dict() for o in unique]


@router.get("/outages/{outage_id}")
def get_outage(outage_id: int, db: Session = Depends(get_db)):
    """Get outage details by ID."""
    outage = (
        db.query(OutageRecord)
        .options(joinedload(OutageRecord.affected_areas))
        .filter(OutageRecord.id == outage_id)
        .first()
    )
    if not outage:
        raise HTTPException(status_code=404, detail="Outage not found")
    return outage.to_dict()


# ──────── Location Endpoints ────────

@router.get("/locations")
def get_available_locations():
    """Get all distinct cities and their barangays."""
    locations_data = {
        "Tagum City": ["Apokon", "Bincungan", "Busaon", "Canocotan", "Cuambogan", "La Filipina", "Liboganon", "Madaum", "Magdum", "Magugpo East", "Magugpo North", "Magugpo Poblacion", "Magugpo South", "Magugpo West", "Mankilam", "New Balamban", "Nueva Fuerza", "Pagsabangan", "Pandapan", "San Agustin", "San Isidro", "San Miguel"],
        "Panabo City": ["A. O. Floirendo", "Buenavista", "Cacao", "Cagangohan", "Consolacion", "Datu Abdul Dadia", "Gredu", "J.P. Laurel", "Kasilak", "Katipunan", "Katualan", "Kauswagan", "Kiotoy", "Little Panay", "Lower Panaga", "Mabunao", "Maduao", "Malativas", "Manay", "Nanyo", "New Malitbog", "New Pandan", "New Visayas", "Quezon", "Salvacion", "San Francisco", "San Nicolas", "San Pedro", "San Roque", "San Vicente", "Santa Cruz", "Santo Niño", "Sindaton", "Southern Davao", "Tagpore", "Tibungol", "Upper Licanan", "Waterfall"],
        "Asuncion (Saug)": ["Buan", "Buclad", "Cabaywa", "Camansa", "Camuning", "Canatan", "Concepcion", "Doña Andrea", "Magatos", "Napungas", "New Bantayan", "New Santiago", "Pamacaun", "Poblacion", "Sagayen", "San Vicente", "Santa Filomena", "Sonlon"],
        "Carmen": ["Alejal", "Anibongan", "Asuncion", "Cebuano", "Guadalupe", "Ising", "La Paz", "Maba-us", "Mabuhay", "Magsaysay", "Mangalcal", "Minda", "New Camiling"]
    }

    result = []
    for city in sorted(locations_data.keys()):
        result.append({
            "city": city,
            "barangays": sorted(locations_data[city])
        })
    return result


# ──────── Stats Endpoint ────────

@router.get("/stats")
def get_outage_stats(db: Session = Depends(get_db)):
    """Get outage statistics for the history/analytics screen."""
    from sqlalchemy import func

    total = db.query(func.count(OutageRecord.id)).scalar() or 0
    active = db.query(func.count(OutageRecord.id)).filter(OutageRecord.status == "active").scalar() or 0
    upcoming = db.query(func.count(OutageRecord.id)).filter(OutageRecord.status == "upcoming").scalar() or 0
    resolved = db.query(func.count(OutageRecord.id)).filter(OutageRecord.status == "resolved").scalar() or 0

    # Most affected cities
    city_counts = (
        db.query(AffectedArea.city, func.count(AffectedArea.id).label("count"))
        .group_by(AffectedArea.city)
        .order_by(func.count(AffectedArea.id).desc())
        .limit(5)
        .all()
    )

    # Outage type breakdown
    type_counts = (
        db.query(OutageRecord.outage_type, func.count(OutageRecord.id).label("count"))
        .group_by(OutageRecord.outage_type)
        .all()
    )

    return {
        "total": total,
        "active": active,
        "upcoming": upcoming,
        "resolved": resolved,
        "most_affected_cities": [{"city": c, "count": n} for c, n in city_counts],
        "outage_types": {t: n for t, n in type_counts},
    }


# ──────── User Endpoints ────────

@router.post("/users")
def create_or_update_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register or update a user's location preferences."""
    existing = db.query(UserProfile).filter(UserProfile.device_id == user_data.device_id).first()

    if existing:
        existing.city = user_data.city
        existing.barangay = user_data.barangay
        existing.emergency_only = user_data.emergency_only
        if user_data.push_token:
            existing.push_token = user_data.push_token
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing.to_dict()

    new_user = UserProfile(
        device_id=user_data.device_id,
        city=user_data.city,
        barangay=user_data.barangay,
        emergency_only=user_data.emergency_only,
        push_token=user_data.push_token,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user.to_dict()


@router.get("/users/{device_id}/outages")
def get_user_outages(device_id: str, db: Session = Depends(get_db)):
    """Get outages matching a user's registered location."""
    user = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.city:
        return []

    query = (
        db.query(OutageRecord)
        .join(AffectedArea)
        .options(joinedload(OutageRecord.affected_areas))
        .filter(AffectedArea.city.ilike(f"%{user.city}%"))
    )

    if user.barangay:
        query = query.filter(AffectedArea.barangay.ilike(f"%{user.barangay}%"))

    if user.emergency_only:
        query = query.filter(OutageRecord.outage_type == "emergency")

    outages = query.order_by(OutageRecord.created_at.desc()).limit(50).all()

    seen = set()
    unique = []
    for o in outages:
        if o.id not in seen:
            seen.add(o.id)
            unique.append(o)

    return [o.to_dict() for o in unique]


# ──────── Dev/Debug Endpoints ────────

@router.post("/scrape/trigger")
async def trigger_scrape():
    """Manually trigger a scrape cycle (dev/debug)."""
    from app.worker import scrape_job
    asyncio.create_task(scrape_job())
    return {"message": "Scrape job triggered. Check server logs for progress."}


# ──────── Helpers ────────

def _update_outage_statuses(db: Session):
    """Auto-update outage statuses based on current time."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    db.query(OutageRecord).filter(
        OutageRecord.status == "upcoming",
        OutageRecord.start_datetime != None,
        OutageRecord.start_datetime <= now,
    ).update({"status": "active"}, synchronize_session=False)

    db.query(OutageRecord).filter(
        OutageRecord.status == "active",
        OutageRecord.estimated_restore_datetime != None,
        OutageRecord.estimated_restore_datetime <= now,
    ).update({"status": "resolved"}, synchronize_session=False)

    db.commit()
