"""
Deciding whether a question is for SikLo at all.

The assistant used to answer anything, because it simply matched a question
against the library and took the closest topic. "Why are bananas yellow?" came
back with the article on discharge, because "yellow" is one of its keywords.

So a question now has to contain at least one term that is distinctively about
menstrual or reproductive health. That list is built from the library's own
keywords and titles, with two hand-maintained corrections:

  GENERIC  words that appear in the library but mean nothing on their own, so
           they must not make a question on-topic ("yellow", "pain", "test")
  CURATED  words people use that no article happens to list as a keyword

Both lists are reviewed by hand on purpose: this is the line between answering
and declining, and it should not move by accident. Tests cover it.
"""
from __future__ import annotations

import re
import sqlite3

#: Appears in the library, but a question containing only this is not about cycles.
GENERIC = {
    # colours, sizes, sensations, directions
    "yellow", "green", "gray", "grey", "brown", "black", "red", "pink", "white", "clear", "dark", "bright",
    "colour", "color", "light", "heavy", "low", "high", "big", "large", "small", "thick", "thin", "strong",
    "lower", "upper", "side", "one", "two", "back", "front",
    "pain", "painful", "ache", "hurt", "hurts", "sore", "tender", "itchy", "itching", "burning", "smell",
    "tired", "dizzy", "hot", "cold", "weak", "sick", "nausea", "stress", "sleep", "mood", "energy",
    # generic question and body words
    "what", "why", "how", "when", "where", "which", "who", "can", "should", "would", "could", "does", "did",
    "is", "are", "am", "do", "i", "my", "me", "it", "the", "a", "an", "and", "or", "to", "of", "in", "on",
    "for", "with", "about", "from", "this", "that", "have", "has", "get", "got", "need", "want", "help",
    "normal", "usual", "typical", "common", "change", "changes", "start", "started", "stop", "stopped",
    "first", "last", "next", "early", "late", "delayed", "long", "short", "day", "days", "week", "month",
    "year", "time", "times", "now", "today", "test", "tests", "check", "doctor", "clinic", "work", "school",
    "food", "eat", "drink", "water", "exercise", "swim", "travel", "sports", "weight", "diet", "skin", "hair",
    "worried", "worry", "scared", "sad", "angry", "happy", "feel", "feels", "feeling", "tell", "talk",
    "good", "bad", "better", "worse", "safe", "right", "wrong", "much", "many", "more", "less",
    "night", "morning", "evening", "age", "body", "home", "office", "class", "bag", "app", "phone",
    "device", "data", "gym", "walk", "run", "heat", "young", "teen", "adult", "person", "people",
    "life", "stage", "rest", "move", "movement",
    # Filipino and Taglish generics
    "ba", "ang", "ng", "sa", "ako", "ko", "na", "po", "yung", "mga", "bakit", "ano", "kailan", "paano",
    "hindi", "masakit", "sakit", "mabuti", "pwede", "gusto", "may", "wala", "lang", "din", "rin",
}

#: Distinctively on-topic words the library does not happen to list as keywords.
CURATED = {
    # cycle and anatomy
    "menstruation", "menstruate", "menses", "menstrual", "period", "periods", "cycle", "cycles",
    "ovulation", "ovulate", "ovulating", "ovary", "ovaries", "ovum", "egg", "uterus", "uterine", "womb",
    "cervix", "cervical", "vagina", "vaginal", "vulva", "endometrium", "endometrial", "fallopian",
    "menarche", "menopause", "menopausal", "perimenopause", "postpartum", "puberty",
    # bleeding and flow
    "bleeding", "bleed", "flow", "spotting", "clots", "clot", "discharge", "mucus", "tampon", "tampons",
    "pad", "pads", "napkin", "cup", "menstrualcup", "pantyliner", "pantyliners",
    # symptoms specific to the domain
    "cramp", "cramps", "cramping", "dysmenorrhea", "pms", "pmdd", "bloating", "mittelschmerz",
    # conditions
    "pcos", "polycystic", "endometriosis", "adenomyosis", "fibroid", "fibroids", "myoma", "cyst", "cysts",
    "thrush", "candida", "vaginosis", "thyroid", "anaemia", "anemia", "sti", "std", "chlamydia", "gonorrhea",
    "uti", "cystitis",
    # fertility, contraception, pregnancy
    "fertile", "fertility", "conceive", "conception", "pregnant", "pregnancy", "contraception",
    "contraceptive", "condom", "condoms", "pill", "pills", "iud", "implant", "injection", "depo",
    "miscarriage", "breastfeeding", "lactation", "intercourse", "sex",
    # tracking vocabulary
    "track", "tracking", "log", "logged", "logging", "predict", "prediction", "estimate", "siklo",
    # Filipino and Taglish, domain-specific
    "regla", "mens", "dalaw", "buntis", "puson", "dugo", "patak", "pagreregla", "panganganak",
}


def stem(word: str) -> str:
    """Drops a plural 's' so 'cramps' and 'cramp' are the same term."""
    return word[:-1] if len(word) > 3 and word.endswith("s") and not word.endswith("ss") else word


def tokens(text: str) -> list[str]:
    return re.findall(r"[a-z]+", text.lower())


def build_terms(keywords: list[str], titles: list[str]) -> dict[str, str]:
    """
    The on-topic vocabulary: {term: where it came from}.

    Curated terms win, then keywords, then titles. Generic words are dropped
    whatever their source, and anything under three letters is dropped as noise.
    """
    terms: dict[str, str] = {}
    for title in titles:
        for word in tokens(title):
            terms.setdefault(word, "title")
    for keyword_line in keywords:
        for word in tokens(keyword_line):
            if terms.get(word) != "curated":
                terms[word] = "keyword"
    for word in CURATED:
        terms[word] = "curated"
    # A term is dropped if it is generic, or if its stem is: "lasts" would
    # otherwise let the generic word "last" match through stemming.
    return {
        term: source
        for term, source in terms.items()
        if len(term) >= 3 and term not in GENERIC and stem(term) not in GENERIC
    }


def load_terms(conn: sqlite3.Connection, terms: dict[str, str]) -> None:
    with conn:
        conn.execute("DELETE FROM topic_term")
        conn.executemany("INSERT INTO topic_term(term, source) VALUES(?,?)", sorted(terms.items()))


def is_on_topic(question: str, terms: set[str]) -> bool:
    """True when the question mentions anything SikLo is actually about."""
    stemmed = {stem(t) for t in terms}
    return any(word in terms or stem(word) in stemmed for word in tokens(question))
