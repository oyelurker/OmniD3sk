"""
SQLite Database for OmniD3sk.

Provides a local SQLite database for persistent ticket storage.
DB file: omniflow.db (created automatically in the project root).
"""
import sqlite3
import logging
import os
from typing import List, Dict
from datetime import datetime

logger = logging.getLogger(__name__)

_DB_PATH = os.getenv("OMNIFLOW_DB_PATH", "omniflow.db")


def get_connection() -> sqlite3.Connection:
    """Get a SQLite connection with row_factory for dict-like access."""
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the database schema (idempotent — safe to call on every startup)."""
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                ticket_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                severity TEXT DEFAULT 'medium',
                category TEXT DEFAULT 'IT Support',
                portal_page TEXT DEFAULT '',
                error_code TEXT DEFAULT '',
                steps_to_reproduce TEXT DEFAULT '',
                status TEXT DEFAULT 'New',
                assigned_to TEXT DEFAULT 'L1 IT Support',
                resolution TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ticket_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL,
                note_text TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
            )
        """)
        conn.commit()
        logger.info(f"OmniFlow DB initialized: {_DB_PATH}")
    except Exception as e:
        logger.error(f"DB init error: {e}", exc_info=True)
    finally:
        conn.close()


def insert_ticket(ticket: Dict) -> bool:
    """Insert a new ticket row into the SQLite database."""
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT OR IGNORE INTO tickets
                (ticket_id, title, description, severity, category,
                 portal_page, error_code, steps_to_reproduce, status,
                 assigned_to, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ticket.get("ticket_id"),
                ticket.get("title"),
                ticket.get("description"),
                ticket.get("severity", "medium"),
                ticket.get("category", "IT Support"),
                ticket.get("portal_page", ""),
                ticket.get("error_code", ""),
                ticket.get("steps_to_reproduce", ""),
                ticket.get("status", "New"),
                ticket.get("assigned_to", "L1 IT Support"),
                ticket.get("created_at", datetime.now().isoformat()),
            ),
        )
        conn.commit()
        logger.info(f"Ticket inserted into DB: {ticket.get('ticket_id')}")
        return True
    except Exception as e:
        logger.error(f"DB insert error: {e}", exc_info=True)
        return False
    finally:
        conn.close()


def update_ticket_in_db(ticket_id: str, status: str = "", resolution: str = "", notes: str = "") -> bool:
    """Update an existing ticket in SQLite."""
    conn = get_connection()
    try:
        updated_at = datetime.now().isoformat()
        if status:
            conn.execute(
                "UPDATE tickets SET status=?, updated_at=? WHERE ticket_id=?",
                (status, updated_at, ticket_id)
            )
        if resolution:
            conn.execute(
                "UPDATE tickets SET resolution=?, updated_at=? WHERE ticket_id=?",
                (resolution, updated_at, ticket_id)
            )
        if notes:
            conn.execute(
                "INSERT INTO ticket_notes (ticket_id, note_text, created_at) VALUES (?, ?, ?)",
                (ticket_id, notes, updated_at)
            )
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"DB update error: {e}", exc_info=True)
        return False
    finally:
        conn.close()


def get_all_tickets() -> List[Dict]:
    """Query all tickets from SQLite."""
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM tickets ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"DB query error: {e}", exc_info=True)
        return []
    finally:
        conn.close()
