"""The library's own rules, and that the pipeline enforces them."""
from __future__ import annotations

import pytest

from siklo_knowledge import articles, db, export, search, vocabulary


@pytest.fixture(scope="module")
def library():
    return articles.read_all()


@pytest.fixture(scope="module")
def conn(library):
    connection = db.connect(":memory:")
    articles.load(connection, library)
    vocabulary.load_terms(
        connection,
        vocabulary.build_terms([a.keywords for a in library], [a.title for a in library]),
    )
    return connection


def test_library_is_substantial_and_unique(library):
    assert len(library) >= 80
    assert len({a.id for a in library}) == len(library)


def test_every_topic_passes_the_rules(library):
    broken = {a.id: a.problems() for a in library if a.problems()}
    assert broken == {}


def test_a_topic_naming_a_dose_is_rejected():
    bad = articles.parse("# Pain relief\n\nkeywords: pain\n\nTake 400 mg of ibuprofen every six hours for cramps.", "bad")
    assert "names a dose" in bad.problems()


def test_a_topic_reading_as_a_diagnosis_is_rejected():
    bad = articles.parse(
        "# Irregular\n\nkeywords: irregular\n\nIf your cycles are long then you have PCOS and should start treatment "
        "right away, which is a very common situation for many people.",
        "bad",
    )
    assert "reads as a diagnosis" in bad.problems()


def test_a_topic_promising_safe_days_is_rejected():
    bad = articles.parse(
        "# Timing\n\nkeywords: timing\n\nYour safe days are the week after your period ends, so you can rely on that "
        "window if you are trying to avoid becoming pregnant this cycle.",
        "bad",
    )
    assert any("safe days" in p for p in bad.problems())


def test_safe_days_may_be_mentioned_while_being_refused():
    refusing = articles.parse(
        "# Fertile window\n\nkeywords: fertile\n\nTracking cannot identify safe days, because ovulation shifts "
        "between cycles and sperm survive for several days inside the body.",
        "refusing",
    )
    assert refusing.problems() == []


def test_no_published_topic_asserts_safe_days(library):
    for article in library:
        assert article.problems() == [], article.id


def test_loading_a_broken_library_raises_rather_than_writing(conn):
    bad = articles.Article(id="x", title="X", keywords="x", body="Take 2 tablets.")
    with pytest.raises(ValueError, match="break the library's own rules"):
        articles.load(db.connect(":memory:"), [bad])


def test_parser_reads_title_keywords_and_review_status():
    parsed = articles.parse(
        "# Cramps\n\nkeywords: cramp, puson\nreviewed-by: Dr Reyes\n\nFirst line of the body.\nSecond line.",
        "cramps",
    )
    assert parsed.title == "Cramps"
    assert parsed.keywords == "cramp, puson"
    assert parsed.reviewed_by == "Dr Reyes"
    assert parsed.status == "reviewed"
    assert parsed.body == "First line of the body. Second line."


def test_a_file_without_a_title_is_rejected():
    with pytest.raises(ValueError, match="must be '# Title'"):
        articles.parse("no heading here", "x")


def test_full_text_index_matches_the_article_table(conn):
    rows = conn.execute("SELECT COUNT(*) AS n FROM article").fetchone()["n"]
    indexed = conn.execute("SELECT COUNT(*) AS n FROM article_fts").fetchone()["n"]
    assert rows == indexed


def test_full_text_search_finds_topics_by_body_wording(conn):
    found = conn.execute(
        "SELECT id FROM article_fts WHERE article_fts MATCH 'mittelschmerz OR \"egg white\"'"
    ).fetchall()
    assert found


def test_export_writes_a_bundle_marked_as_generated(conn, tmp_path):
    out = export.write_bundle(conn, tmp_path / "articles.ts")
    text = out.read_text()
    assert "GENERATED FILE - do not edit by hand" in text
    assert "export const ARTICLES" in text
    assert "export const TOPIC_TERMS" in text
    assert text.count("    id: ") == conn.execute("SELECT COUNT(*) AS n FROM article").fetchone()["n"]


def test_search_finds_the_right_topic(conn):
    for question, expected in [
        ("why do i get cramps", "cramps"),
        ("what is ovulation", "ovulation"),
        ("my discharge is stretchy and clear", "cervical-mucus"),
        ("i have been bleeding for 9 days", "heavy-bleeding"),
        ("when should i see a doctor", "when-to-see-doctor"),
        ("what is pcos", "pcos"),
    ]:
        ids = [h.id for h in search.search(conn, question)]
        assert expected in ids, f"{question!r} gave {ids}"


def test_search_returns_nothing_for_an_off_topic_question(conn):
    for question in ["why are bananas yellow?", "how do i cook rice", "what is the capital of france"]:
        assert search.search(conn, question) == [], question
