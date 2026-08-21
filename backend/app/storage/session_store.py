"""
In-memory session store for development.
Each session holds the raw parsed artifacts between API calls.

To upgrade to Supabase: replace get/set calls with Supabase JSONB reads/writes.
"""
from typing import Optional, Dict
import uuid
from datetime import datetime, timezone

# ── Store ────────────────────────────────────────────────────────────────────
_sessions: Dict[str, dict] = {}


def create_session() -> str:
    """Create a new session and return its ID."""
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "session_id": session_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "schema_result": None,
        "query_analyses": None,
        "analysis_result": None,
    }
    return session_id


def get_session(session_id: str) -> Optional[dict]:
    """Retrieve a session by ID. Returns None if not found."""
    return _sessions.get(session_id)


def update_session(session_id: str, **kwargs) -> bool:
    """Update session fields. Returns False if session doesn't exist."""
    if session_id not in _sessions:
        return False
    _sessions[session_id].update(kwargs)
    return True


def session_exists(session_id: str) -> bool:
    return session_id in _sessions


def list_sessions() -> list:
    """Return all session IDs (for debugging only)."""
    return list(_sessions.keys())
