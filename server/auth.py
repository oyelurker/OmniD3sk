"""
Google OAuth 2.0 Authentication — OmniD3sk Multi-Tenant.

Environment variables required:
  GOOGLE_CLIENT_ID       — OAuth 2.0 client ID from Google Cloud Console.
  GOOGLE_CLIENT_SECRET   — OAuth 2.0 client secret.
  GOOGLE_REDIRECT_URI    — e.g. http://localhost:8080/api/auth/google/callback
  JWT_SECRET             — Random secret (openssl rand -hex 32).
  FRONTEND_URL           — e.g. http://localhost:3000 or /
"""
import logging
import os
import time
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/api/auth/google/callback")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "/")
JWT_SECRET           = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_EXPIRY_SECONDS   = int(os.getenv("JWT_EXPIRY_SECONDS", "86400"))

_GOOGLE_AUTH_URL     = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL    = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
SCOPES = "openid email profile"


def _create_jwt(payload: dict) -> str:
    try:
        import jwt as pyjwt
        return pyjwt.encode(
            {**payload, "exp": int(time.time()) + JWT_EXPIRY_SECONDS, "iat": int(time.time())},
            JWT_SECRET, algorithm="HS256",
        )
    except ImportError:
        import base64, json
        data = {**payload, "exp": int(time.time()) + JWT_EXPIRY_SECONDS}
        return base64.urlsafe_b64encode(json.dumps(data).encode()).decode()


def decode_jwt(token: str) -> Optional[dict]:
    try:
        import jwt as pyjwt
        return pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except ImportError:
        import base64, json
        try:
            data = json.loads(base64.urlsafe_b64decode(token + "=="))
            return None if data.get("exp", 0) < time.time() else data
        except Exception:
            return None
    except Exception:
        return None


def get_current_user_id(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    payload = decode_jwt(auth.removeprefix("Bearer ").strip())
    return payload.get("user_id") if payload else None


def require_user_id(request: Request) -> str:
    uid = get_current_user_id(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required")
    return uid


@router.get("/google/login")
async def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured")
    params = {
        "client_id": GOOGLE_CLIENT_ID, "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code", "scope": SCOPES,
        "access_type": "offline", "prompt": "select_account",
    }
    query = "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in params.items())
    return RedirectResponse(url=f"{_GOOGLE_AUTH_URL}?{query}")


@router.get("/google/callback")
async def google_callback(code: str = "", error: str = ""):
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}?auth_error={error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        token_resp = requests.post(_GOOGLE_TOKEN_URL, data={
            "code": code, "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET, "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }, timeout=10)
        token_resp.raise_for_status()
        tokens = token_resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Token exchange failed: {e}")

    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="No access_token in Google response")

    try:
        ui = requests.get(_GOOGLE_USERINFO_URL,
                          headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
        ui.raise_for_status()
        userinfo = ui.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Userinfo fetch failed: {e}")

    google_sub = userinfo.get("sub")
    email      = userinfo.get("email", "")
    name       = userinfo.get("name", email)
    picture    = userinfo.get("picture", "")

    if not google_sub:
        raise HTTPException(status_code=502, detail="Could not retrieve Google user ID")

    try:
        from server.mongo_db import upsert_user
        upsert_user(user_id=google_sub, email=email, name=name, picture=picture)
    except Exception as e:
        logger.error(f"[Auth] MongoDB upsert failed: {e}")

    jwt_token = _create_jwt({"user_id": google_sub, "email": email, "name": name})
    logger.info(f"[Auth] Issued JWT for user: {google_sub} ({email})")
    return RedirectResponse(url=f"{FRONTEND_URL}dashboard?token={jwt_token}")


@router.get("/me")
async def get_me(request: Request):
    user_id = require_user_id(request)
    try:
        from server.mongo_db import get_user, get_user_credentials
        user = get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        creds = get_user_credentials(user_id)
        notion = creds.get("notion", {})
        gcal   = creds.get("google_calendar", {})
        return JSONResponse({
            "user_id": user.get("user_id"), "email": user.get("email"),
            "name": user.get("name"), "picture": user.get("picture"),
            "integrations": {
                "notion": {
                    "connected": notion.get("connected", False),
                    "api_key_hint": notion.get("api_key_hint"),
                    "page_id": notion.get("page_id"),
                },
                "google_calendar": {
                    "connected": gcal.get("connected", False),
                    "calendar_id": gcal.get("calendar_id"),
                },
            },
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] /me error: {e}")
        raise HTTPException(status_code=500, detail="Internal error")


@router.post("/logout")
async def logout():
    return JSONResponse({"message": "Logged out. Discard your token on the client."})
