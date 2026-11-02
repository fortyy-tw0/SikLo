# SikLo knowledge backend

Python and SQLite. This is where SikLo's health knowledge lives and how it grows.

The web app cannot read a SQLite file in a browser, so this backend **compiles**
the library into `lib/library/articles.ts`, which the app then ships and runs
offline. That generated file is committed, so building the site needs Node only;
Python is needed just for changing the knowledge.

## Feeding the assistant

Add a file to `articles/` and run the build. That is the whole process.

```bash
cd backend
python -m siklo_knowledge.build
```

```
articles/pcos.md
───────────────────────────────────────────
# About PCOS

keywords: pcos, polycystic, ovary, cyst, irregular, excess hair
reviewed-by: Dr Reyes, OB-GYN          ← optional; marks the topic signed off

PCOS is a common hormonal condition. Signs can include irregular or missing
periods, extra hair on the face or body, acne, and trouble managing weight.
Only a healthcare professional can diagnose PCOS...
```

The build refuses to write anything if a topic breaks the library's rules:

- no medicine names with doses
- nothing that reads as a diagnosis of the reader
- no claim that any days are "safe" from pregnancy, unless the sentence is
  refusing the idea
- no topic without keywords, or with a body too short to answer anything

Run `python -m pytest` to check the library before committing.

## Why a question gets declined

`vocabulary.py` decides whether a question is for SikLo at all. It builds a list
of terms that are distinctively about menstrual and reproductive health, from
the library's own keywords and titles, minus words that mean nothing on their
own.

This exists because the assistant used to answer anything. Asked "why are
bananas yellow?", it replied with the article on vaginal discharge, because
"yellow" is one of that article's keywords. Now a question needs at least one
distinctive term, or SikLo says it cannot help and suggests what it does cover.

Two lists in that file are maintained by hand on purpose, because they are the
line between answering and declining:

- `GENERIC` — appears in the library but does not make a question on-topic
  ("yellow", "pain", "test", "night")
- `CURATED` — people use it but no article lists it as a keyword

`tests/test_topic.py` holds the examples both ways. Add to it when you change
either list.

## Layout

```
schema.sql               Tables: article, article_fts (full-text), topic_term,
                         daily_log, intimacy_log, learned_pattern
articles/*.md            The library, one topic per file. Edit these.
siklo_knowledge/
  articles.py            Reading the files, the rules, loading into SQLite
  vocabulary.py          The on-topic term list and the topic gate
  search.py              Scoring a question against the library (reference)
  export.py              Writing lib/library/articles.ts for the web app
  build.py               The command above
tests/                   55 checks over the rules, the gate and the export
```

The same schema is used by the FastAPI service on the `backend` branch, so the
web app, the phone app and this service read one library.

## Commands

```bash
python -m siklo_knowledge.build    # build the database and the web bundle
python -m pytest                   # check the library and the topic gate
```
