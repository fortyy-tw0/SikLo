-- SikLo knowledge base.
--
-- The health library lives here as data, not as code: adding a topic means
-- adding a file under backend/articles/ and running `python -m siklo_knowledge.build`.
-- The same schema is used by the FastAPI service on the `backend` branch, so the
-- web app and the phone app read one library.

PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS article (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    keywords    TEXT NOT NULL DEFAULT '',
    body        TEXT NOT NULL,
    -- 'team' = written by the team, pending review; 'reviewed' = signed off by a
    -- qualified professional. Nothing is shown to users as reviewed until it is.
    status      TEXT NOT NULL DEFAULT 'team'
                CHECK (status IN ('team', 'reviewed')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    source_file TEXT,
    updated_at  TEXT NOT NULL
);

-- Full-text index over the same rows, so a question can be matched by words in
-- the body as well as the keywords.
CREATE VIRTUAL TABLE IF NOT EXISTS article_fts USING fts5 (
    id UNINDEXED,
    title,
    keywords,
    body,
    tokenize = 'unicode61 remove_diacritics 2'
);

-- Words that make a question on-topic for SikLo. Built from the library's own
-- keywords and titles, minus words too general to mean anything on their own
-- (see siklo_knowledge/vocabulary.py). The web app ships this list so it can
-- decline questions that are not about cycles or reproductive health.
CREATE TABLE IF NOT EXISTS topic_term (
    term   TEXT PRIMARY KEY,
    source TEXT NOT NULL          -- 'keyword' | 'title' | 'curated'
);

-- What a person logged, for the reference service. The web app keeps the same
-- shape in the browser so both sides read one model.
CREATE TABLE IF NOT EXISTS daily_log (
    date     TEXT NOT NULL,
    category TEXT NOT NULL,       -- flow | mood | symptoms | temp
    value    TEXT,                -- level, label, or reading
    note     TEXT,
    PRIMARY KEY (date, category)
);

CREATE TABLE IF NOT EXISTS intimacy_log (
    date         TEXT PRIMARY KEY,
    protection   TEXT,
    observations TEXT NOT NULL DEFAULT '',   -- comma separated
    note         TEXT
);

-- Patterns the assistant has worked out from the logs above, so it can answer
-- about this person specifically. Rebuilt from the logs; never hand-edited.
CREATE TABLE IF NOT EXISTS learned_pattern (
    key        TEXT PRIMARY KEY,
    summary    TEXT NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
    based_on   INTEGER NOT NULL DEFAULT 0,   -- how many observations
    updated_at TEXT NOT NULL
);
