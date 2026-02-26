from sqlalchemy import Boolean, Column, Integer, String, DateTime, Float, JSON
from datetime import datetime
from app.db.database import Base

class Outage(Base):
    __tablename__ = "outages"

    id = Column(Integer, primary_key=True, index=True)
    source_post_url = Column(String, unique=True, index=True)
    post_text = Column(String)
    
    is_outage = Column(Boolean, default=False)
    outage_type = Column(String, default="advisory") # planned, emergency, advisory
    start_datetime = Column(DateTime(timezone=True), nullable=True)
    estimated_restore_datetime = Column(DateTime(timezone=True), nullable=True)
    
    # Store affected locations as JSON
    affected_locations = Column(JSON, default=list)
    reason = Column(String, nullable=True)
    confidence_score = Column(Float, default=1.0)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    device_token = Column(String, unique=True, index=True)
    city = Column(String, index=True)
    barangay = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
