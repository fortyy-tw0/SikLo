"""
Writing the bundle the web app ships.

The browser cannot open a SQLite file, so the build compiles the library into a
TypeScript module. The web app never edits that file by hand; it is generated,
and the header says so.
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

WEB_BUNDLE = Path(__file__).resolve().parent.parent.parent / "lib" / "library" / "articles.ts"

HEADER = '''/**
 * SikLo health library: {count} topics and {terms} on-topic terms.
 *
 * GENERATED FILE - do not edit by hand.
 *
 * The library lives in backend/articles/*.md and is compiled by
 * `python -m siklo_knowledge.build` into this module, because a browser cannot
 * read the SQLite database the Python service uses. To add or change a topic,
 * edit the source file and run the build; the pipeline checks the rules that
 * keep the library safe (no doses, no diagnoses, no claims about "safe days")
 * before it will write this file.
 *
 * {reviewed} of {count} topics have been signed off by a qualified professional.
 * The rest are team-written summaries pending review.
 */
'''


def write_bundle(conn: sqlite3.Connection, path: Path = WEB_BUNDLE) -> Path:
    articles = conn.execute(
        "SELECT id, title, keywords, body, status FROM article ORDER BY id"
    ).fetchall()
    terms = [r["term"] for r in conn.execute("SELECT term FROM topic_term ORDER BY term")]
    reviewed = sum(1 for a in articles if a["status"] == "reviewed")

    def entry(a: sqlite3.Row) -> str:
        return (
            "  {\n"
            f"    id: {json.dumps(a['id'])},\n"
            f"    title: {json.dumps(a['title'])},\n"
            f"    keywords: {json.dumps(a['keywords'])},\n"
            f"    text:\n      {json.dumps(a['body'])},\n"
            f"    reviewed: {'true' if a['status'] == 'reviewed' else 'false'},\n"
            "  },"
        )

    text = (
        HEADER.format(count=len(articles), terms=len(terms), reviewed=reviewed)
        + "export interface Article {\n"
        "  id: string;\n"
        "  title: string;\n"
        "  /** Words someone might use to ask about this, in English, Filipino and Taglish. */\n"
        "  keywords: string;\n"
        "  text: string;\n"
        "  /** True once a qualified professional has signed this topic off. */\n"
        "  reviewed: boolean;\n"
        "}\n\n"
        "export const SOURCE_NOTE = 'SikLo health library (team-written summary, pending medical review)';\n\n"
        f"/** How many topics a professional has reviewed, of {len(articles)}. */\n"
        f"export const REVIEWED_COUNT = {reviewed};\n\n"
        "export const ARTICLES: readonly Article[] = [\n"
        + "\n".join(entry(a) for a in articles)
        + "\n];\n\n"
        "/**\n"
        " * Words that make a question on-topic for SikLo. A question with none of\n"
        " * these is declined rather than matched to the nearest article.\n"
        " */\n"
        "export const TOPIC_TERMS: ReadonlySet<string> = new Set(["
        + ", ".join(json.dumps(t) for t in terms)
        + "]);\n"
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    return path
