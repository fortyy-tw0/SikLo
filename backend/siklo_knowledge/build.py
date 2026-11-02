"""
Build the knowledge base and the bundle the web app ships.

    python -m siklo_knowledge.build

Reads backend/articles/*.md, checks them against the library's rules, loads them
into SQLite with a full-text index, works out the on-topic vocabulary, and
writes lib/library/articles.ts for the web app.
"""
from __future__ import annotations

import sys

from . import articles as articles_module
from . import db, export, vocabulary


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    quiet = "--quiet" in argv

    try:
        library = articles_module.read_all()
    except ValueError as problem:
        print(f"library rejected:\n{problem}", file=sys.stderr)
        return 1

    conn = db.connect()
    try:
        articles_module.load(conn, library)
    except ValueError as problem:
        print(f"library rejected:\n{problem}", file=sys.stderr)
        return 1

    terms = vocabulary.build_terms([a.keywords for a in library], [a.title for a in library])
    vocabulary.load_terms(conn, terms)
    written = export.write_bundle(conn)

    if not quiet:
        reviewed = sum(1 for a in library if a.status == "reviewed")
        print(f"{len(library)} topics ({reviewed} professionally reviewed), {len(terms)} on-topic terms")
        print(f"database: {db.DEFAULT_DB}")
        print(f"web bundle: {written}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
