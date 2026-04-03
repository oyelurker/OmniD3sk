"""
Calendar MCP Tool — Real Google Calendar API Integration.

Creates a Google Calendar event using a Service Account (gcp-key.json).

IMPORTANT — Service Account limitation:
    A service account cannot write to a *personal* Google Calendar unless that
    calendar has been explicitly shared with the service account's email address
    AND the service account has been granted at least "Make changes to events"
    permission.

    Steps to enable this:
    1. Open Google Calendar → Settings ⚙️ → Settings for my calendars
    2. Select your target calendar → "Share with specific people or groups"
    3. Add the service account email below and set permission to
       "Make changes to events".
    4. Copy the Calendar ID (shown in "Integrate calendar" section) to .env.

    Service account email for this project:
        omnid3sk-local@lab2-491316.iam.gserviceaccount.com

Required environment variables:
    GOOGLE_SERVICE_ACCOUNT_FILE   — Path to gcp-key.json
                                    (default: gcp-key.json in project root)
    CALENDAR_ID                   — Target calendar ID
                                    (e.g. "primary" or "abc123@group.calendar.google.com")
"""
import json
import logging
import os
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

# Google Calendar API scope needed for event creation
_SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def _get_calendar_service():
    """
    Build an authenticated Google Calendar API service object.

    Uses google.oauth2.service_account.Credentials loaded from the JSON key
    file specified by GOOGLE_SERVICE_ACCOUNT_FILE (defaults to gcp-key.json).

    Raises:
        EnvironmentError: if the key file path is missing or the file does not exist.
        google.auth.exceptions.TransportError / google.auth.exceptions.MutualTLSChannelError:
            propagated as-is so callers can log the exact root cause.
    """
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    key_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "gcp-key.json")
    if not os.path.exists(key_file):
        raise EnvironmentError(
            f"Service account key file not found: '{key_file}'. "
            "Set GOOGLE_SERVICE_ACCOUNT_FILE in .env or place gcp-key.json in the project root."
        )

    creds = service_account.Credentials.from_service_account_file(
        key_file, scopes=_SCOPES
    )
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    logger.info(f"[Calendar] Authenticated as service account: {creds.service_account_email}")
    return service


def book_calendar_slot(
    summary: str,
    duration_minutes: int = 15,
    attendee_email: str = "",
    preferred_date: str = "",
) -> str:
    """
    Create a real Google Calendar event using the Google Calendar API v3.

    Inserts the event into the calendar identified by the CALENDAR_ID env var.
    The start time defaults to the next rounded hour from now; pass
    preferred_date (YYYY-MM-DD) to override the date portion.

    Args:
        summary:          Title of the meeting (e.g. "Follow-up: login issue on visa portal").
        duration_minutes: Duration in minutes (default 15).
        attendee_email:   Optional attendee email to invite.
        preferred_date:   Optional ISO date string (YYYY-MM-DD) for the preferred date.

    Returns:
        JSON string with success=True and the real htmlLink from Google Calendar,
        or success=False with the exact HTTP/API error string for debugging.
    """
    calendar_id = os.getenv("CALENDAR_ID", "primary")

    # ── Build start/end times ──────────────────────────────────────────────────
    now        = datetime.now(tz=timezone.utc)
    start_time = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

    if preferred_date:
        try:
            pref = datetime.fromisoformat(preferred_date)
            start_time = start_time.replace(
                year=pref.year, month=pref.month, day=pref.day
            )
            logger.info(f"[Calendar] Overriding date to {preferred_date}")
        except ValueError as e:
            logger.warning(f"[Calendar] Invalid preferred_date '{preferred_date}': {e}. Using default.")

    end_time = start_time + timedelta(minutes=duration_minutes)

    # ── Build event body ───────────────────────────────────────────────────────
    event_body: dict = {
        "summary": summary,
        "description": (
            "Support session booked by OmniD3sk AI Helpdesk Agent.\n"
            f"Duration: {duration_minutes} minutes."
        ),
        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "UTC",
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "UTC",
        },
        "conferencing": {
            "createRequest": {
                "requestId": f"omnid3sk-{int(now.timestamp())}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 10},
                {"method": "popup", "minutes": 5},
            ],
        },
    }

    if attendee_email:
        event_body["attendees"] = [{"email": attendee_email}]
        logger.info(f"[Calendar] Adding attendee: {attendee_email}")

    # ── Authenticate & call the API ────────────────────────────────────────────
    logger.info(
        f"[Calendar] Inserting event '{summary}' into calendar '{calendar_id}' "
        f"at {start_time.isoformat()} for {duration_minutes} min"
    )

    try:
        service = _get_calendar_service()
    except EnvironmentError as e:
        logger.error(f"[Calendar] Auth setup error: {e}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"[Calendar] Failed to build Calendar service: {e}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": f"Google Calendar authentication failed: {e}",
        })

    try:
        created_event = (
            service.events()
            .insert(calendarId=calendar_id, body=event_body)
            .execute()
        )
    except Exception as e:
        # googleapiclient raises HttpError for 4xx/5xx responses
        # The str() of an HttpError contains the HTTP status and reason body
        error_msg = str(e)
        logger.error(f"[Calendar] API insert failed: {error_msg}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": f"Google Calendar API error: {error_msg}",
        })

    # ── Extract key fields from the response ──────────────────────────────────
    event_id   = created_event.get("id", "unknown")
    html_link  = created_event.get("htmlLink", "")
    meet_link  = (
        created_event.get("conferenceData", {})
        .get("entryPoints", [{}])[0]
        .get("uri", "")
    )
    start_iso  = created_event.get("start", {}).get("dateTime", start_time.isoformat())

    logger.info(
        f"[Calendar] ✅ Event created — ID: {event_id} | "
        f"Link: {html_link} | Meet: {meet_link}"
    )

    return json.dumps({
        "success": True,
        "event_id": event_id,
        "html_link": html_link,
        "meet_link": meet_link,
        "scheduled_start": start_iso,
        "duration_minutes": duration_minutes,
        "calendar_id": calendar_id,
        "attendees": [attendee_email] if attendee_email else [],
        "message": (
            f"Meeting '{summary}' booked for "
            f"{start_time.strftime('%B %d at %I:%M %p UTC')} "
            f"({duration_minutes} min). "
            + (f"Join at: {meet_link}" if meet_link else f"View at: {html_link}")
        ),
    })


# ── Tool declaration (unchanged — agent sees the same interface) ──────────────
CALENDAR_DECLARATIONS = [
    {
        "name": "book_calendar_slot",
        "description": (
            "Book a real Google Calendar meeting slot for follow-up specialist support. "
            "Use when escalating an issue that requires a scheduled call with the user "
            "or to book a 15-minute diagnostic session. Returns the actual event link."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "summary": {
                    "type": "STRING",
                    "description": "Meeting title (e.g. 'Follow-up: account locked on income tax portal')",
                },
                "duration_minutes": {
                    "type": "INTEGER",
                    "description": "Duration in minutes (default 15)",
                },
                "attendee_email": {
                    "type": "STRING",
                    "description": "Optional email address of the user to invite",
                },
                "preferred_date": {
                    "type": "STRING",
                    "description": "Optional preferred date in YYYY-MM-DD format",
                },
            },
            "required": ["summary"],
        },
    }
]
