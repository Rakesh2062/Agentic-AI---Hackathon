"""
Notification Tools — create and dispatch notifications.

Mock implementation that logs notifications.  Replace with email / SMS /
push-notification services later.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger(__name__)

# In-memory notification store for testing
_NOTIFICATIONS: list[dict[str, Any]] = []


async def create_notification(
    citizen_id: str,
    complaint_id: str,
    message: str,
    *,
    notification_type: str = "status_update",
) -> dict[str, Any]:
    """Create a notification record.

    Replace with: INSERT INTO notifications ...
    """
    notification = {
        "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "citizen_id": citizen_id,
        "complaint_id": complaint_id,
        "message": message,
        "type": notification_type,
        "sent": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _NOTIFICATIONS.append(notification)
    logger.info(
        "Notification created: %s for citizen %s",
        notification["notification_id"],
        citizen_id,
    )
    return notification


async def send_notification(notification_id: str) -> bool:
    """Send (dispatch) a notification.

    Replace with: actual email/SMS/push send logic.
    """
    for notif in _NOTIFICATIONS:
        if notif["notification_id"] == notification_id:
            notif["sent"] = True
            notif["sent_at"] = datetime.now(timezone.utc).isoformat()
            logger.info("Notification %s sent successfully.", notification_id)
            return True
    logger.warning("Notification %s not found.", notification_id)
    return False


async def notify_citizen(
    citizen_id: str,
    complaint_id: str,
    message: str,
) -> dict[str, Any]:
    """Convenience: create + send in one call."""
    notif = await create_notification(citizen_id, complaint_id, message)
    await send_notification(notif["notification_id"])
    return notif
