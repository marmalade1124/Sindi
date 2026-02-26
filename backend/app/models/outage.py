from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OutageArea(BaseModel):
    city: str
    barangays: List[str]

class ExtractedOutageData(BaseModel):
    is_outage: bool = Field(description="True if this post is about a power outage/interruption. False otherwise.")
    outage_type: str = Field(description="Type of outage: 'planned', 'emergency', or 'advisory'.", default="advisory")
    start_datetime: Optional[str] = Field(description="ISO 8601 formatted start datetime, e.g., 2026-02-28T08:00:00", default=None)
    estimated_restore_datetime: Optional[str] = Field(description="ISO 8601 formatted estimated restore datetime, e.g., 2026-02-28T17:00:00", default=None)
    affected_locations: List[OutageArea] = Field(description="List of affected cities and their respective affected barangays.", default_factory=list)
    reason: Optional[str] = Field(description="Reason for the power outage.", default=None)
    confidence_score: float = Field(description="Confidence score between 0.0 and 1.0 of this extraction.", default=1.0)
    
class OutagePost(BaseModel):
    id: Optional[str] = None
    source_post_url: str
    post_text: str
    image_url: Optional[str] = None
    extracted_data: Optional[ExtractedOutageData] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
