"""
Finding the topics that answer a question.

This is the reference implementation, used by the Python service and by the
tests. The web app ships the same scoring in TypeScript so both sides agree;
`tests/test_parity.py` checks that they do.

Two stages, in this order:
  1. the topic gate   - is this question even about cycles? (vocabulary.py)
  2. scoring          - keywords count most, then the title, then the body
"""
from __future__ import annotations

import sqlite3
from dataclasses import dataclass

from .vocabulary import GENERIC, is_on_topic, stem, tokens

#: Below this, a match is too weak to show.
MIN_SCORE = 3.0


@dataclass(frozen=True)
class Hit:
    id: str
    title: str
    body: str
    score: float


def _asked(question: str) -> list[str]:
    return [stem(w) for w in tokens(question) if w not in GENERIC]


def score(question: str, keywords: str, title: str, body: str) -> float:
    """How well one topic answers this question."""
    asked = _asked(question)
    if not asked:
        return 0.0
    keys = {stem(w) for w in tokens(keywords)}
    titles = {stem(w) for w in tokens(title)}
    bodies = {stem(w) for w in tokens(body)}

    total = 0.0
    for word in asked:
        if word in keys:
            total += 3
        if word in titles:
            total += 2
        elif word in bodies:
            total += 0.5
    matched = sum(1 for w in asked if w in keys or w in titles or w in bodies)
    # Prefer topics that answer more of the question, not one word repeatedly
    return total * (1 + matched / len(asked))


def search(conn: sqlite3.Connection, question: str, limit: int = 3) -> list[Hit]:
    """Best topics for a question, or nothing at all when it is off-topic."""
    terms = {row["term"] for row in conn.execute("SELECT term FROM topic_term")}
    if not is_on_topic(question, terms):
        return []

    rows = conn.execute("SELECT id, title, keywords, body FROM article").fetchall()
    hits = [
        Hit(r["id"], r["title"], r["body"], score(question, r["keywords"], r["title"], r["body"]))
        for r in rows
    ]
    return sorted((h for h in hits if h.score >= MIN_SCORE), key=lambda h: -h.score)[:limit]
