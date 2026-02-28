"""
Expo Push Notification sender.
Sends push notifications to users via the Expo Push Notification service.
"""
import httpx
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.db_models import UserProfile, AffectedArea


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push_notifications(
    db: Session,
    outage_reason: str,
    outage_type: str,
    affected_cities: List[str],
    affected_barangays: List[str],
    outage_id: int,
):
    """
    Find users whose location matches the affected areas and send them push notifications.
    """
    if not affected_cities:
        print("[Push] No affected cities — skipping push notifications.")
        return

    # Find users in affected areas who have push tokens
    # Use fuzzy matching to handle variations like "Tagum" vs "Tagum City"
    from sqlalchemy import or_
    city_filters = [UserProfile.city.ilike(f"%{city}%") for city in affected_cities]

    users = (
        db.query(UserProfile)
        .filter(
            UserProfile.push_token.isnot(None),
            UserProfile.push_token != "",
            or_(*city_filters) if city_filters else False,
        )
        .all()
    )

    if not users:
        print("[Push] No users with push tokens in affected areas.")
        return

    # Filter by emergency_only preference
    eligible_users = []
    for user in users:
        if user.emergency_only and outage_type != "emergency":
            continue
        eligible_users.append(user)

    if not eligible_users:
        print("[Push] All matched users have emergency_only enabled.")
        return

    # Build notification messages
    messages = []
    for user in eligible_users:
        # Customize message based on user's barangay
        location_match = "your area"
        if user.barangay and user.barangay in affected_barangays:
            location_match = user.barangay

        title = "⚡ Power Outage Alert" if outage_type == "emergency" else "🔧 Scheduled Maintenance"
        body = f"{outage_reason[:100]}" if outage_reason else "A power interruption has been detected."
        subtitle = f"Affecting {location_match}"

        messages.append({
            "to": user.push_token,
            "title": title,
            "body": body,
            "subtitle": subtitle,
            "sound": "default",
            "priority": "high",
            "data": {
                "outageId": outage_id,
                "type": outage_type,
            },
        })

    # Send in batches of 100 (Expo limit)
    total_sent = 0
    for i in range(0, len(messages), 100):
        batch = messages[i:i + 100]
        try:
            response = httpx.post(
                EXPO_PUSH_URL,
                json=batch,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                timeout=10.0,
            )
            if response.status_code == 200:
                total_sent += len(batch)
                print(f"[Push] ✅ Sent {len(batch)} notification(s)")
            else:
                print(f"[Push] ❌ Expo API error: {response.status_code} - {response.text[:200]}")
        except Exception as e:
            print(f"[Push] ❌ Failed to send batch: {e}")

    print(f"[Push] Done. Sent {total_sent}/{len(messages)} notifications for outage #{outage_id}")
