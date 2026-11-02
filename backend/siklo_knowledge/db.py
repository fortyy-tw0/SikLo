"""Opening and creating the knowledge database."""
from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "schema.sql"
DEFAULT_DB = ROOT / "siklo.db"


def connect(path: Path | str = DEFAULT_DB) -> sqlite3.Connection:
    """Open the database, creating the tables if they are not there yet."""
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA_PATH.read_text())
    return conn
