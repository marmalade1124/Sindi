from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class OutageRecord(Base):
    __tablename__ = "outage_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_post_url = Column(String, nullable=False)
    post_text = Column(Text, nullable=False)
    outage_type = Column(String, default="advisory")  # planned, emergency, advisory
    start_datetime = Column(DateTime, nullable=True)
    estimated_restore_datetime = Column(DateTime, nullable=True)
    reason = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)
    status = Column(String, default="upcoming")  # upcoming, active, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    affected_areas = relationship("AffectedArea", back_populates="outage", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "source_post_url": self.source_post_url,
            "post_text": self.post_text,
            "outage_type": self.outage_type,
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "estimated_restore_datetime": self.estimated_restore_datetime.isoformat() if self.estimated_restore_datetime else None,
            "reason": self.reason,
            "confidence_score": self.confidence_score,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "affected_areas": [a.to_dict() for a in self.affected_areas],
        }


class AffectedArea(Base):
    __tablename__ = "affected_areas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    outage_id = Column(Integer, ForeignKey("outage_records.id"), nullable=False)
    city = Column(String, nullable=False, index=True)
    barangay = Column(String, nullable=False, index=True)

    outage = relationship("OutageRecord", back_populates="affected_areas")

    def to_dict(self):
        return {
            "id": self.id,
            "city": self.city,
            "barangay": self.barangay,
        }


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String, unique=True, nullable=False, index=True)
    city = Column(String, nullable=True)
    barangay = Column(String, nullable=True)
    emergency_only = Column(Boolean, default=False)
    push_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "device_id": self.device_id,
            "city": self.city,
            "barangay": self.barangay,
            "emergency_only": self.emergency_only,
            "push_token": self.push_token,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
