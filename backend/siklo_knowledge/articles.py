"""
Reading the health library from backend/articles/*.md and loading it into SQLite.

One file per topic. The format is deliberately plain so anyone on the team can
add a topic without touching code:

    # Title of the topic

    keywords: comma, separated, words, someone, might, ask

    The body, as one or more paragraphs.

A `reviewed-by:` line marks a topic a qualified professional has signed off.
"""
from __future__ import annotations

import datetime as dt
import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path

ARTICLES_DIR = Path(__file__).resolve().parent.parent / "articles"

#: Wording the library must never contain, whatever the topic.
FORBIDDEN = [
    (re.compile(r"\b\d+\s?(mg|milligrams?|tablets?|capsules?)\b", re.I), "names a dose"),
    (re.compile(r"\byou (probably )?have (pcos|endometriosis|a cyst|fibroids)\b", re.I), "reads as a diagnosis"),
]


@dataclass(frozen=True)
class Article:
    id: str
    title: str
    keywords: str
    body: str
    status: str = "team"
    reviewed_by: str | None = None
    source_file: str | None = None

    def problems(self) -> list[str]:
        """Rule breaches that should stop this topic being published."""
        found = []
        if len(self.body) < 80:
            found.append("body is too short to be useful")
        if not self.keywords.strip():
            found.append("has no keywords, so nobody will find it")
        for pattern, why in FORBIDDEN:
            if pattern.search(self.body):
                found.append(why)
        # "Safe days" may only ever appear while being denied.
        if re.search(r"\bsafe days?\b", self.body, re.I) and not re.search(
            r"not a safe period|not a reliable|cannot|never", self.body, re.I
        ):
            found.append('mentions "safe days" without refusing the idea')
        return found


def parse(text: str, article_id: str, source_file: str | None = None) -> Article:
    """Turn one source file into an Article."""
    title_match = re.match(r"#\s*(.+)", text.strip())
    if not title_match:
        raise ValueError(f"{article_id}: first line must be '# Title'")
    title = title_match.group(1).strip()

    rest = text.strip()[title_match.end():]
    keywords = ""
    reviewed_by = None
    body_lines: list[str] = []
    for line in rest.strip().splitlines():
        lower = line.lower()
        if lower.startswith("keywords:"):
            keywords = line.split(":", 1)[1].strip()
        elif lower.startswith("reviewed-by:"):
            reviewed_by = line.split(":", 1)[1].strip() or None
        else:
            body_lines.append(line)

    body = " ".join(" ".join(body_lines).split())
    return Article(
        id=article_id,
        title=title,
        keywords=keywords,
        body=body,
        status="reviewed" if reviewed_by else "team",
        reviewed_by=reviewed_by,
        source_file=source_file,
    )


def read_all(directory: Path = ARTICLES_DIR) -> list[Article]:
    """Every topic in the library, sorted by id."""
    out = [
        parse(path.read_text(), path.stem, str(path.relative_to(directory.parent)))
        for path in sorted(directory.glob("*.md"))
    ]
    seen: set[str] = set()
    for article in out:
        if article.id in seen:
            raise ValueError(f"duplicate topic id: {article.id}")
        seen.add(article.id)
    return out


def load(conn: sqlite3.Connection, articles: list[Article]) -> None:
    """Replace the library in the database with these topics."""
    broken = {a.id: problems for a in articles if (problems := a.problems())}
    if broken:
        lines = "\n".join(f"  {i}: {', '.join(p)}" for i, p in sorted(broken.items()))
        raise ValueError(f"these topics break the library's own rules:\n{lines}")

    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    with conn:
        conn.execute("DELETE FROM article")
        conn.execute("DELETE FROM article_fts")
        conn.executemany(
            "INSERT INTO article(id, title, keywords, body, status, reviewed_by, source_file, updated_at)"
            " VALUES(?,?,?,?,?,?,?,?)",
            [(a.id, a.title, a.keywords, a.body, a.status, a.reviewed_by, a.source_file, now) for a in articles],
        )
        conn.executemany(
            "INSERT INTO article_fts(id, title, keywords, body) VALUES(?,?,?,?)",
            [(a.id, a.title, a.keywords, a.body) for a in articles],
        )
