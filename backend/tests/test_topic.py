"""The line between answering and declining."""
from __future__ import annotations

import pytest

from siklo_knowledge import articles, vocabulary


@pytest.fixture(scope="module")
def terms():
    library = articles.read_all()
    return set(vocabulary.build_terms([a.keywords for a in library], [a.title for a in library]))


OFF_TOPIC = [
    "why are bananas yellow?",
    "how do i cook rice",
    "what is the capital of france",
    "who won the game last night",
    "tell me a joke",
    "what time is it",
    "how do i fix my laptop",
    "what is the weather today",
    "sino ang presidente",
    "recommend a movie",
    "how old is the earth",
    "what should i watch tonight",
    "write me a poem",
    "how much is a jeepney fare",
]

ON_TOPIC = [
    "is my discharge yellow",
    "why do i get cramps",
    "when is my next period",
    "kailan ang regla ko",
    "masakit ang puson ko",
    "what is pcos",
    "am i pregnant",
    "how long do periods last",
    "how long does a period last",
    "my ovaries hurt",
    "bakit ako nagka pcos",
    "i have been bleeding for 9 days",
    "is spotting normal",
    "should i use a tampon or a cup",
    "my period is late",
    "what is ovulation",
    "i feel sad before my period",
    "can i swim on my period",
    "buntis ba ako",
    "may dalaw ako",
    "what are the phases of a cycle",
    "my cramps are worse than usual",
]


@pytest.mark.parametrize("question", OFF_TOPIC)
def test_off_topic_questions_are_declined(question, terms):
    assert not vocabulary.is_on_topic(question, terms)


@pytest.mark.parametrize("question", ON_TOPIC)
def test_on_topic_questions_are_accepted(question, terms):
    assert vocabulary.is_on_topic(question, terms)


def test_generic_words_alone_never_make_a_question_on_topic(terms):
    for word in ["yellow", "pain", "test", "normal", "night", "last", "doctor", "change"]:
        assert not vocabulary.is_on_topic(f"is this {word}", terms), word


def test_no_generic_word_leaked_into_the_vocabulary(terms):
    leaked = sorted(t for t in terms if t in vocabulary.GENERIC or vocabulary.stem(t) in vocabulary.GENERIC)
    assert leaked == []


def test_every_curated_term_survives_into_the_vocabulary(terms):
    missing = sorted(t for t in vocabulary.CURATED if len(t) >= 3 and t not in terms)
    assert missing == [], "curated terms should not be filtered out as generic"


def test_an_empty_or_punctuation_only_question_is_off_topic(terms):
    for question in ["", "   ", "???", "..."]:
        assert not vocabulary.is_on_topic(question, terms)
