"""
Notion MCP Tool — Real Notion API Integration.

Appends a structured threat/diagnostic report to a Notion page using the
Notion REST API (POST /v1/blocks/{page_id}/children).

Required environment variables:
    NOTION_API_KEY   — The "Internal Integration Token" from https://www.notion.so/my-integrations
    NOTION_PAGE_ID   — The 32-char ID of the page to append blocks to
                       (grab from the page URL: notion.so/<workspace>/<PAGE_ID>?v=...)

In production, ensure the integration has been shared with the target page
inside Notion ("Share" → add your integration by name).
"""
import json
import logging
import os
from datetime import datetime
from typing import List

import requests

logger = logging.getLogger(__name__)

# ── Notion API constants ──────────────────────────────────────────────────────
NOTION_API_VERSION = "2022-06-28"
NOTION_API_BASE    = "https://api.notion.com/v1"


def _get_notion_headers(user_id: str = "") -> dict:
    """
    Build the auth headers for every Notion API call.

    Credential resolution order:
      1. MongoDB per-user credentials (when user_id is provided).
      2. NOTION_API_KEY environment variable (legacy / global fallback).
    """
    api_key = ""

    if user_id:
        try:
            from server.mongo_db import get_user_credentials
            creds = get_user_credentials(user_id)
            api_key = creds.get("notion", {}).get("api_key") or ""
            if api_key:
                logger.info(f"[Notion] Using MongoDB credentials for user {user_id}")
        except Exception as e:
            logger.warning(f"[Notion] MongoDB credential lookup failed: {e}")

    if not api_key:
        api_key = os.getenv("NOTION_API_KEY", "")

    if not api_key:
        raise EnvironmentError(
            "NOTION_API_KEY is not set. Save it via the OmniD3sk dashboard "
            "or add it to your .env file: NOTION_API_KEY=secret_xxxxxxxxxxxx"
        )
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Notion-Version": NOTION_API_VERSION,
    }


def _build_notion_blocks(title: str, content: str, tags: List[str]) -> list:
    """
    Convert the report into a list of Notion block objects.

    Structure:
      - Heading 2  → report title
      - Callout    → metadata (tags, timestamp)
      - Paragraph  → one block per line of content (max 2 000 chars each due to Notion limits)
      - Divider    → footer separator
    """
    blocks = []

    # ── Heading ──
    blocks.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": title[:100]}}]
        },
    })

    # ── Metadata callout ──
    tag_str = ", ".join(tags) if tags else "none"
    meta_text = f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC+5:30   |   🏷️ Tags: {tag_str}"
    blocks.append({
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [{"type": "text", "text": {"content": meta_text}}],
            "icon": {"emoji": "🛡️"},
            "color": "gray_background",
        },
    })

    # ── Content paragraphs (Notion caps each rich_text at 2 000 chars) ──
    CHUNK = 1900
    for i in range(0, len(content), CHUNK):
        chunk = content[i : i + CHUNK]
        blocks.append({
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text", "text": {"content": chunk}}]
            },
        })

    # ── Divider ──
    blocks.append({"object": "block", "type": "divider", "divider": {}})

    return blocks


def save_threat_report_to_notion(
    title: str,
    content: str,
    tags: List[str] = None,
    database_name: str = "OmniD3sk Knowledge Base",
    user_id: str = "",
) -> str:
    """
    Append a structured threat/diagnostic report to a Notion page.

    Makes a real POST request to:
        POST https://api.notion.com/v1/blocks/{NOTION_PAGE_ID}/children

    Args:
        title:         Title / heading for the report block.
        content:       Full Markdown-ish text body of the report.
        tags:          Optional list of tag strings for metadata callout.
        database_name: Logical label (informational only; target page is set by env var).

    Returns:
        JSON string with success=True and the Notion page URL, or
        success=False with the HTTP status code and error detail.
    """
    if tags is None:
        tags = []

    # Resolve page_id: MongoDB first, then env var
    page_id = ""
    if user_id:
        try:
            from server.mongo_db import get_user_credentials
            creds = get_user_credentials(user_id)
            page_id = creds.get("notion", {}).get("page_id") or ""
        except Exception as e:
            logger.warning(f"[Notion] MongoDB page_id lookup failed: {e}")

    if not page_id:
        page_id = os.getenv("NOTION_PAGE_ID", "")

    if not page_id:
        err = "NOTION_PAGE_ID is not set. Save it via the OmniD3sk dashboard or .env."
        logger.error(err)
        return json.dumps({"success": False, "error": err})

    # Normalise page_id — strip hyphens if the user copied the UUID form
    page_id_clean = page_id.replace("-", "")

    try:
        headers = _get_notion_headers(user_id=user_id)
    except EnvironmentError as e:
        logger.error(str(e))
        return json.dumps({"success": False, "error": str(e)})

    blocks = _build_notion_blocks(title, content, tags)
    payload = {"children": blocks}

    endpoint = f"{NOTION_API_BASE}/blocks/{page_id_clean}/children"
    logger.info(f"[Notion] Appending report '{title}' → page {page_id_clean}")

    try:
        response = requests.patch(
            endpoint,
            headers=headers,
            json=payload,
            timeout=15,
        )
    except requests.exceptions.Timeout:
        err = "Notion API request timed out after 15 seconds."
        logger.error(f"[Notion] {err}")
        return json.dumps({"success": False, "error": err})
    except requests.exceptions.ConnectionError as e:
        err = f"Notion API connection error: {e}"
        logger.error(f"[Notion] {err}")
        return json.dumps({"success": False, "error": err})

    # ── Handle HTTP errors ──
    if not response.ok:
        try:
            error_body = response.json()
            error_msg  = error_body.get("message", response.text)
            error_code = error_body.get("code", "unknown_error")
        except Exception:
            error_msg  = response.text
            error_code = "parse_error"

        full_error = (
            f"Notion API error {response.status_code} [{error_code}]: {error_msg}"
        )
        logger.error(f"[Notion] {full_error}")
        return json.dumps({
            "success": False,
            "http_status": response.status_code,
            "notion_error_code": error_code,
            "error": full_error,
        })

    # ── Success ──
    # Notion PATCH /blocks/.../children returns the list of new block IDs
    try:
        resp_data    = response.json()
        new_block_ids = [b.get("id") for b in resp_data.get("results", [])]
        block_count   = len(new_block_ids)
    except Exception:
        new_block_ids = []
        block_count   = len(blocks)

    notion_url = f"https://notion.so/{page_id_clean}"
    logger.info(
        f"[Notion] ✅ Report appended — {block_count} blocks created → {notion_url}"
    )

    return json.dumps({
        "success": True,
        "notion_url": notion_url,
        "page_id": page_id_clean,
        "blocks_created": block_count,
        "new_block_ids": new_block_ids[:5],   # first 5 for reference
        "database": database_name,
        "message": (
            f"Report '{title}' appended to Notion page ({block_count} blocks). "
            f"View at: {notion_url}"
        ),
    })


# ── Tool declaration (unchanged — agent sees the same interface) ──────────────
NOTES_DECLARATIONS = [
    {
        "name": "save_threat_report_to_notion",
        "description": (
            "Save a structured threat report or diagnostic summary to the team's Notion page. "
            "Use after confirming a security threat or completing a complex diagnostic to share "
            "findings with the support team for institutional knowledge."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "title": {
                    "type": "STRING",
                    "description": "Page title (e.g. 'Phishing Report: bank-clone.xyz' or 'P1 Diagnostic: Visa portal auth failure')",
                },
                "content": {
                    "type": "STRING",
                    "description": "Markdown-formatted report content including findings, evidence, and recommendations",
                },
                "tags": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Optional tags for categorization (e.g. ['phishing', 'high-severity', 'visa-portal'])",
                },
                "database_name": {
                    "type": "STRING",
                    "description": "Logical label for the report destination (default: OmniD3sk Knowledge Base)",
                },
            },
            "required": ["title", "content"],
        },
    }
]
