"""
Notion MCP Tool — Simulated Notion Integration.

Placeholder function that simulates saving a Markdown threat/diagnostic report
to a Notion database page. In production, replace with the Notion API
(https://api.notion.com/v1/pages).
"""
import json
import logging
import uuid
from datetime import datetime
from typing import List

logger = logging.getLogger(__name__)


def save_threat_report_to_notion(
    title: str,
    content: str,
    tags: List[str] = None,
    database_name: str = "OmniD3sk Knowledge Base",
) -> str:
    """Simulate saving a Markdown threat or diagnostic report to Notion.

    Creates a simulated Notion page with the report content. In production,
    this calls the Notion API to create a page in the team's shared database.

    Args:
        title: Title of the Notion page (e.g., "Threat Report: phishing-site.com").
        content: Markdown-formatted content of the report.
        tags: Optional list of tags/labels (e.g., ["phishing", "high-severity"]).
        database_name: Target Notion database name (default: OmniD3sk Knowledge Base).

    Returns:
        JSON with page_id, notion_url, and confirmation message.
    """
    if tags is None:
        tags = []

    page_id = str(uuid.uuid4())
    notion_url = f"https://notion.so/omnid3sk/{page_id.replace('-', '')}"

    page = {
        "page_id": page_id,
        "title": title,
        "database": database_name,
        "tags": tags,
        "content_preview": content[:300] + "..." if len(content) > 300 else content,
        "word_count": len(content.split()),
        "notion_url": notion_url,
        "created_at": datetime.now().isoformat(),
        "status": "published",
    }

    logger.info(f"Notion page saved (simulated): {page_id} — {title}")

    return json.dumps({
        "success": True,
        "page_id": page_id,
        "notion_url": notion_url,
        "message": f"Report '{title}' saved to Notion ({database_name}). {len(content.split())} words.",
        "page": page,
        "note": "Simulated Notion save — integrate Notion API with OAuth2 for production.",
    })


NOTES_DECLARATIONS = [
    {
        "name": "save_threat_report_to_notion",
        "description": (
            "Save a structured threat report or diagnostic summary to the team's Notion database. "
            "Use after confirming a security threat or completing a complex diagnostic to share "
            "findings with the support team for institutional knowledge."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "title": {
                    "type": "STRING",
                    "description": "Page title (e.g. 'Phishing Report: bank-clone.xyz' or 'P1 Diagnostic: Visa portal auth failure')"
                },
                "content": {
                    "type": "STRING",
                    "description": "Markdown-formatted report content including findings, evidence, and recommendations"
                },
                "tags": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Optional tags for categorization (e.g. ['phishing', 'high-severity', 'visa-portal'])"
                },
                "database_name": {
                    "type": "STRING",
                    "description": "Target Notion database (default: OmniD3sk Knowledge Base)"
                }
            },
            "required": ["title", "content"]
        }
    }
]
