"""
MongoDB Database Layer — OmniD3sk Multi-Tenant.

Handles:
  - User creation / retrieval (keyed by Google sub claim = stable user_id).
  - Secure upsert / fetch of per-user integration credentials
    (Notion API key, Notion page ID, Google Calendar ID).

Environment variables required:
  MONGODB_URI       — MongoDB connection string (Atlas or local).
                      Example: mongodb+srv://user:pass@cluster.mongodb.net/omnid3sk
  MONGODB_DB_NAME   — Database name (default: omnid3sk).

Credentials stored in the `users` collection:
  {
    "_id": ObjectId,
    "user_id":          str,   # Google sub claim (stable, unique per Google account)
    "email":            str,
    "name":             str,
    "picture":          str,
    "created_at":       datetime,
    "updated_at":       datetime,
    "integrations": {
      "notion": {
        "api_key":    str | None,   # NOTION_API_KEY
        "page_id":   str | None,   # NOTION_PAGE_ID
        "connected": bool,
      },
      "google_calendar": {
        "calendar_id":          str | None,   # CALENDAR_ID target calendar
        "service_account_json": str | None,   # raw JSON string of GCP service account
        "connected":            bool,
      },
    },
  }
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

_client = None
_db = None


def _get_db():
    """Return the MongoDB database, initialising the client on first call."""
    global _client, _db
    if _db is not None:
        return _db

    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise EnvironmentError(
            "MONGODB_URI is not set. Add it to your .env file.\n"
            "Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/omnid3sk"
        )

    try:
        import certifi
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi

        db_name = os.getenv("MONGODB_DB_NAME", "omnid3sk")

        # Try with certifi CA bundle first (recommended)
        try:
            _client = MongoClient(
                uri,
                server_api=ServerApi("1"),
                serverSelectionTimeoutMS=10000,
                tlsCAFile=certifi.where(),
            )
            # Force connection to validate
            _client.admin.command("ping")
        except Exception:
            # Windows SSL fallback — safe for local dev
            logger.warning("[MongoDB] Certifi SSL failed, retrying with tlsAllowInvalidCertificates=True")
            _client = MongoClient(
                uri,
                server_api=ServerApi("1"),
                serverSelectionTimeoutMS=10000,
                tlsAllowInvalidCertificates=True,
            )
            _client.admin.command("ping")

        _db = _client[db_name]
        # Ensure unique index on user_id
        _db["users"].create_index("user_id", unique=True)
        logger.info(f"[MongoDB] Connected to database '{db_name}'")
    except Exception as e:
        logger.error(f"[MongoDB] Connection failed: {e}")
        raise

    return _db


# ── User CRUD ─────────────────────────────────────────────────────────────────

def upsert_user(user_id: str, email: str, name: str, picture: str = "") -> dict:
    """
    Create a new user document or update name/email/picture for an existing one.

    The `integrations` sub-document is initialised on creation only and never
    overwritten here — use `save_user_credentials()` for integration updates.

    Returns the full user document (as a plain dict, without `_id`).
    """
    db = _get_db()
    now = datetime.now(tz=timezone.utc)

    from pymongo import ReturnDocument

    result = db["users"].find_one_and_update(
        {"user_id": user_id},
        {
            "$set": {
                "email": email,
                "name": name,
                "picture": picture,
                "updated_at": now,
            },
            "$setOnInsert": {
                "user_id": user_id,
                "created_at": now,
                "integrations": {
                    "notion": {
                        "api_key": None,
                        "page_id": None,
                        "connected": False,
                    },
                    "google_calendar": {
                        "calendar_id": None,
                        "service_account_json": None,
                        "connected": False,
                    },
                },
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    if result is None:
        result = db["users"].find_one({"user_id": user_id})

    doc = dict(result)
    doc.pop("_id", None)
    logger.info(f"[MongoDB] Upserted user: {user_id} ({email})")
    return doc


def get_user(user_id: str) -> Optional[dict]:
    """
    Fetch a user document by their Google `sub` claim.

    Returns the document as a plain dict (without `_id`), or None if not found.
    """
    db = _get_db()
    doc = db["users"].find_one({"user_id": user_id})
    if doc is None:
        return None
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


# ── Integration credential storage ───────────────────────────────────────────

def save_user_credentials(
    user_id: str,
    *,
    # Notion
    notion_api_key: Optional[str] = None,
    notion_page_id: Optional[str] = None,
    # Google Calendar
    calendar_id: Optional[str] = None,
    service_account_json: Optional[str] = None,
) -> bool:
    """
    Persist integration credentials for a specific user.

    Only the fields explicitly passed (not None) are updated — all others are
    left untouched. Also recomputes the `connected` flag for each integration.

    Args:
        user_id:              The user's Google sub claim.
        notion_api_key:       NOTION_API_KEY value (pass None to skip).
        notion_page_id:       NOTION_PAGE_ID value (pass None to skip).
        calendar_id:          Target Google Calendar ID (pass None to skip).
        service_account_json: Raw JSON string of a GCP service account key.

    Returns:
        True on success, False on failure.
    """
    db = _get_db()
    now = datetime.now(tz=timezone.utc)

    set_fields: dict = {"updated_at": now}

    if notion_api_key is not None:
        set_fields["integrations.notion.api_key"] = notion_api_key.strip()
    if notion_page_id is not None:
        set_fields["integrations.notion.page_id"] = notion_page_id.strip()
    if calendar_id is not None:
        set_fields["integrations.google_calendar.calendar_id"] = calendar_id.strip()
    if service_account_json is not None:
        set_fields["integrations.google_calendar.service_account_json"] = (
            service_account_json.strip()
        )

    if len(set_fields) == 1:  # only `updated_at` — nothing to do
        return True

    try:
        db["users"].update_one({"user_id": user_id}, {"$set": set_fields})

        # Re-read and recompute `connected` flags
        doc = db["users"].find_one({"user_id": user_id}) or {}
        notion = doc.get("integrations", {}).get("notion", {})
        gcal   = doc.get("integrations", {}).get("google_calendar", {})

        notion_connected = bool(notion.get("api_key")) and bool(notion.get("page_id"))
        gcal_connected   = bool(gcal.get("calendar_id"))

        db["users"].update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "integrations.notion.connected": notion_connected,
                    "integrations.google_calendar.connected": gcal_connected,
                }
            },
        )
        logger.info(
            f"[MongoDB] Credentials saved for user {user_id} "
            f"(Notion: {notion_connected}, GCal: {gcal_connected})"
        )
        return True
    except Exception as e:
        logger.error(f"[MongoDB] save_user_credentials error: {e}", exc_info=True)
        return False


def get_user_credentials(user_id: str) -> dict:
    """
    Fetch the integration credentials for a user.

    Returns a safe dict with redacted API keys (first 8 chars + '...' for display)
    plus the raw values for internal tool use.

    Schema returned:
    {
      "notion": {
        "api_key":       str | None,   # raw — for tool calls
        "api_key_hint":  str | None,   # "secret_xx..." — for UI display
        "page_id":       str | None,
        "connected":     bool,
      },
      "google_calendar": {
        "calendar_id":          str | None,
        "service_account_json": str | None,   # raw JSON — for tool calls
        "connected":            bool,
      },
    }
    """
    doc = get_user(user_id)
    if doc is None:
        return {}

    integrations = doc.get("integrations", {})
    notion = integrations.get("notion", {})
    gcal   = integrations.get("google_calendar", {})

    raw_key = notion.get("api_key") or ""
    hint    = (raw_key[:12] + "...") if len(raw_key) > 12 else (raw_key or None)

    return {
        "notion": {
            "api_key":      raw_key or None,
            "api_key_hint": hint,
            "page_id":      notion.get("page_id"),
            "connected":    notion.get("connected", False),
        },
        "google_calendar": {
            "calendar_id":          gcal.get("calendar_id"),
            "service_account_json": gcal.get("service_account_json"),
            "connected":            gcal.get("connected", False),
        },
    }
