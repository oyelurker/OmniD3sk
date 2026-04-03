"""
Calendar MCP Tool — Simulated Google Calendar Integration.

Placeholder function that simulates booking a 15-minute Google Calendar slot.
In production, replace with the Google Calendar API (OAuth2 + events.insert).
"""
import json
import logging
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


def book_calendar_slot(
    summary: str,
    duration_minutes: int = 15,
    attendee_email: str = "",
    preferred_date: str = "",
) -> str:
    """Simulate booking a Google Calendar meeting slot for follow-up support.

    Creates a simulated calendar event for the specialist team to connect
    with the user. In production, this calls the Google Calendar API.

    Args:
        summary: Title of the meeting (e.g., "Follow-up: login issue on visa portal").
        duration_minutes: Duration of the slot in minutes (default 15).
        attendee_email: Optional attendee email to invite.
        preferred_date: Optional ISO date string for preferred booking date (YYYY-MM-DD).

    Returns:
        JSON with event_id, meeting_link, scheduled_time, and confirmation message.
    """
    event_id = f"CAL-{uuid.uuid4().hex[:10].upper()}"

    # Simulate scheduling the next available slot (the next hour, rounded up)
    now = datetime.now()
    start_time = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    end_time = start_time + timedelta(minutes=duration_minutes)

    # Override date if provided
    if preferred_date:
        try:
            pref = datetime.fromisoformat(preferred_date)
            start_time = start_time.replace(year=pref.year, month=pref.month, day=pref.day)
            end_time = start_time + timedelta(minutes=duration_minutes)
        except ValueError:
            pass

    event = {
        "event_id": event_id,
        "summary": summary,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "duration_minutes": duration_minutes,
        "attendees": [attendee_email] if attendee_email else [],
        "meeting_link": f"https://meet.google.com/omni-{uuid.uuid4().hex[:8]}",
        "status": "confirmed",
        "calendar": "OmniD3sk Support Calendar",
        "created_at": datetime.now().isoformat(),
    }

    logger.info(f"Calendar slot booked (simulated): {event_id} — {summary} @ {start_time.isoformat()}")

    return json.dumps({
        "success": True,
        "event_id": event_id,
        "message": f"Booked a {duration_minutes}-minute slot: '{summary}' on {start_time.strftime('%B %d at %I:%M %p')}.",
        "event": event,
        "note": "Simulated booking — integrate Google Calendar API with OAuth2 for production.",
    })


CALENDAR_DECLARATIONS = [
    {
        "name": "book_calendar_slot",
        "description": (
            "Book a Google Calendar meeting slot for follow-up specialist support. "
            "Use when escalating an issue that requires a scheduled call with the user "
            "or to book a 15-minute diagnostic session."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "summary": {
                    "type": "STRING",
                    "description": "Meeting title (e.g. 'Follow-up: account locked on income tax portal')"
                },
                "duration_minutes": {
                    "type": "INTEGER",
                    "description": "Duration in minutes (default 15)"
                },
                "attendee_email": {
                    "type": "STRING",
                    "description": "Optional email address of the user to invite"
                },
                "preferred_date": {
                    "type": "STRING",
                    "description": "Optional preferred date in YYYY-MM-DD format"
                }
            },
            "required": ["summary"]
        }
    }
]
