"""
Integrations API — OmniD3sk Multi-Tenant.

Endpoints:
  POST /api/integrations/notion          — Save Notion credentials for the logged-in user.
  POST /api/integrations/google_calendar — Save Google Calendar credentials.
  POST /api/integrations/notion/test     — Test the saved Notion connection.
  POST /api/integrations/calendar/test   — Test the saved Calendar connection.
  GET  /api/integrations/status          — Current connection status for both integrations.
"""
import json
import logging
import os

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from server.auth import require_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/integrations", tags=["integrations"])


# ── Request models ────────────────────────────────────────────────────────────

class NotionCreds(BaseModel):
    api_key: str
    page_id: str


class CalendarCreds(BaseModel):
    calendar_id: str
    service_account_json: str = ""  # optional; can keep using file-based key


# ── Save credentials ──────────────────────────────────────────────────────────

@router.post("/notion")
async def save_notion_creds(body: NotionCreds, request: Request):
    """Save the user's Notion API key and page ID to MongoDB."""
    user_id = require_user_id(request)
    from server.mongo_db import save_user_credentials
    ok = save_user_credentials(
        user_id,
        notion_api_key=body.api_key,
        notion_page_id=body.page_id,
    )
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to save Notion credentials")
    return JSONResponse({"success": True, "message": "Notion credentials saved."})


@router.post("/google_calendar")
async def save_calendar_creds(body: CalendarCreds, request: Request):
    """Save the user's Google Calendar ID (and optional service-account JSON)."""
    user_id = require_user_id(request)
    from server.mongo_db import save_user_credentials
    ok = save_user_credentials(
        user_id,
        calendar_id=body.calendar_id,
        service_account_json=body.service_account_json or None,
    )
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to save Calendar credentials")
    return JSONResponse({"success": True, "message": "Calendar credentials saved."})


# ── Test connections ──────────────────────────────────────────────────────────

@router.post("/notion/test")
async def test_notion(request: Request):
    """
    Verify the user's saved Notion API key by calling GET /v1/users/me.
    Returns {success, message}.
    """
    user_id = require_user_id(request)
    from server.mongo_db import get_user_credentials
    creds = get_user_credentials(user_id)
    api_key = creds.get("notion", {}).get("api_key")

    if not api_key:
        return JSONResponse({"success": False, "message": "No Notion API key saved yet."})

    try:
        import requests as req
        resp = req.get(
            "https://api.notion.com/v1/users/me",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Notion-Version": "2022-06-28",
            },
            timeout=8,
        )
        if resp.ok:
            bot_name = resp.json().get("name", "Integration bot")
            return JSONResponse({"success": True, "message": f"Connected as: {bot_name}"})
        else:
            err = resp.json().get("message", resp.text)
            return JSONResponse({"success": False, "message": f"Notion error: {err}"})
    except Exception as e:
        logger.error(f"[Integrations] Notion test error: {e}")
        return JSONResponse({"success": False, "message": f"Connection error: {e}"})


@router.post("/calendar/test")
async def test_calendar(request: Request):
    """
    Verify the user's saved Calendar credentials by listing their calendar list.
    Returns {success, message}.
    """
    user_id = require_user_id(request)
    from server.mongo_db import get_user_credentials
    creds = get_user_credentials(user_id)
    gcal  = creds.get("google_calendar", {})
    cal_id = gcal.get("calendar_id")
    sa_json = gcal.get("service_account_json")

    if not cal_id:
        return JSONResponse({"success": False, "message": "No Calendar ID saved yet."})

    # Try to build the Calendar service using the user's stored SA JSON,
    # falling back to the server-wide service account file.
    try:
        import tempfile
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        scopes = ["https://www.googleapis.com/auth/calendar.events"]

        if sa_json:
            tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8")
            try:
                tmp.write(sa_json)
                tmp.flush()
                tmp.close()
                creds_obj = service_account.Credentials.from_service_account_file(tmp.name, scopes=scopes)
            finally:
                try:
                    os.remove(tmp.name)
                except OSError:
                    pass
        else:
            key_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "gcp-key.json")
            if not os.path.exists(key_file):
                return JSONResponse({"success": False, "message": "No service account key available."})
            creds_obj = service_account.Credentials.from_service_account_file(key_file, scopes=scopes)

        service = build("calendar", "v3", credentials=creds_obj, cache_discovery=False)
        cal = service.calendars().get(calendarId=cal_id).execute()
        return JSONResponse({"success": True, "message": f"Connected to calendar: {cal.get('summary', cal_id)}"})

    except Exception as e:
        logger.error(f"[Integrations] Calendar test error: {e}")
        return JSONResponse({"success": False, "message": f"Connection error: {str(e)[:200]}"})


# ── Status summary ────────────────────────────────────────────────────────────

@router.get("/status")
async def integration_status(request: Request):
    """Return connection status for all integrations for the current user."""
    user_id = require_user_id(request)
    from server.mongo_db import get_user_credentials
    creds = get_user_credentials(user_id)
    notion = creds.get("notion", {})
    gcal   = creds.get("google_calendar", {})
    return JSONResponse({
        "notion": {
            "connected":    notion.get("connected", False),
            "api_key_hint": notion.get("api_key_hint"),
            "page_id":      notion.get("page_id"),
        },
        "google_calendar": {
            "connected":   gcal.get("connected", False),
            "calendar_id": gcal.get("calendar_id"),
        },
    })
