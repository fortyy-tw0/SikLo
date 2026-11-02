# SikLo

**Your cycle. Your device. Your data.**

SikLo is a private menstrual cycle tracker and health companion, built for women who wants to understand their body without handing their health history to a company.

Live at **https://siklo-ph.vercel.app/**

---

## What SikLo is

Most cycle apps ask you to make an account, then keep your period dates, your
symptoms and your sex life on their servers. SikLo asks for none of that. There
is no sign-up, no email, no password and no server holding your records. You
open it, answer five short questions, and everything you log from then on stays
on the device in your hand.

It is built around one idea: **a person should be able to understand her own
cycle without trading away her privacy, and without being told things that
aren't true.**

## Why tracking a period matters

A period is not only an inconvenience to plan around. Clinicians increasingly
treat the menstrual cycle as a sign of general health, in the same way as blood
pressure or heart rate, because it responds to so much of what is happening in
the body: hormones, nutrition, thyroid function, stress, body weight, sleep and
illness all show up in how a cycle behaves.

That makes a written record genuinely useful:

- **Changes become visible early.** Cycles that drift outside 21 to 35 days,
  periods that run past seven days, bleeding that soaks a pad every hour, or
  bleeding between periods are all things a clinician wants to know about. They
  are far easier to notice in a log than in memory.
- **A check-up stops being guesswork.** "I think it's been irregular lately"
  gives a doctor very little. "Here are my last six cycles: 31, 36, 29, 38, 33,
  34 days" gives them something to work with. For many women, especially where
  a specialist visit means travel, cost and time off work, making one
  appointment count is the difference between answers and another wait.
- **Conditions like PCOS, endometriosis, thyroid disorders and fibroids often
  show first in the cycle.** None of them can be diagnosed by an app, but all of
  them are easier to raise with evidence in hand.
- **Planning, in either direction.** Whether someone is trying to conceive or
  trying not to, knowing their own pattern is better than assuming a textbook
  28-day cycle that most people do not actually have.
- **It is yours to understand.** Knowing that the low mood arriving every month
  is a pattern, and not a personal failing, changes how it feels.

## What it does

**Tracks what you notice.** Period start and end dates, flow, mood, symptoms and
temperature, plus intercourse with only the details that matter clinically:
whether protection was used, and anything you noticed such as pain or bleeding
afterwards. Everything is optional and nothing is required to keep using it.

**Estimates your next period honestly.** SikLo shows a range from your shortest
to your longest recent cycle, not a single confident date, and it says how sure
it is and why. It refuses to estimate at all until you have three complete
cycles recorded, because an estimate from one or two cycles is a guess wearing a
number. It never tells you which days are "safe" from pregnancy, because that
claim is not safe to make.

**Shows your cycle at a glance.** A ring for where you are today, a calendar
separating what you actually recorded from what is only projected, and trends
across your recent cycles.

**Points out what is worth asking about.** Insights describes patterns in plain
language — cycles outside the typical range, variation of more than a week,
periods longer than seven days, bleeding after sex — and says what to raise at a
check-up. It never says what a pattern means, because that is a clinician's job.

**Answers questions, offline.** Ask SikLo explains how cycles work, what common
symptoms are, and what your own log shows, drawing on a library of short health
summaries written for this app. You can type, or say "Hey SikLo" and ask out
loud. It answers questions about periods and reproductive health and declines
everything else, rather than reaching for the nearest article. On devices that
can run one, a language model downloads in the background and words the answers
more freely, still entirely on the device; the library answers cover the wait,
and on a metered connection it waits to be asked.

**Learns your patterns, without learning about you.** The more you log, the more
of an answer comes from your own record: how long your cycles run, which
symptoms show up and when in the cycle they tend to arrive, how your periods
usually last. Those patterns are worked out on the device each time, from your
logs alone, and are shown with how confident they are. Nothing about you is
uploaded, and nothing is used to train anything.

**Works without a connection.** Once loaded, SikLo keeps working on a bus, in a
barangay with no signal, or on a phone with no load. Nothing it does requires
the internet.

## What it will never do

Being clear about the limits is part of the design:

- It does not diagnose anything, and it will say so when asked.
- It does not name medicines or doses.
- It does not identify days when sex cannot lead to pregnancy.
- It does not tell you whether you are pregnant; a test does that.
- It does not send your records anywhere, because there is nowhere to send them.

When a question crosses into a crisis, SikLo stops answering and gives real
numbers: the NCMH Crisis Hotline on 1553, 0919-057-1553 or 0917-899-8727, and
911 for emergencies.

> **SikLo is not a healthcare professional.** It describes what is common and
> what you recorded. For anything about your own body, see a qualified doctor,
> midwife or nurse. The health library in this repository is written by the team
> and is still pending review by a qualified professional.

## Using it

Open the link, tap **Start privately**, and answer five short steps: what to
call you, your birthday, how your cycles usually feel, any context you want to
add, and the dates of recent periods. Only the last of these does much work, and
every optional question can be skipped. Nothing is written to your device until
you tap **Save**.

After that the five tabs are: **Today** for where you are now, **Calendar** for
the month, **Ask SikLo** in the middle for questions, **Insights** for patterns,
and **Profile** to edit your dates, switch between light and dark, or delete
everything.

To stop using it, open Profile and tap **Delete my data from this device**. That
is the whole process: there is no account to close, because there was never one
to open.

## Running it yourself

```bash
npm install
npm run dev            # http://localhost:8000
npm run build          # production build into dist/
npm run typecheck      # strict TypeScript
npm test               # 106 checks: prediction, calendar, insights, safety, assistant, patterns
npm run knowledge      # rebuild the health library (Python 3 + SQLite)
npm run knowledge:test # 55 checks on the library and the topic rules
```

The app itself is TypeScript throughout, no framework, built with esbuild into a
single page and deployed on Vercel. The cycle prediction engine is copied
byte-for-byte from the `backend` branch's `siklo-backend-ts`, so this app and
the React Native app give the same answer for the same dates.

**The knowledge behind Ask SikLo is built in Python and SQL.** `backend/` holds
the health library as plain Markdown, a SQLite schema with a full-text index,
and the rules that keep it honest: a topic that names a dose or reads as a
diagnosis fails the build rather than reaching a reader. The same build derives
the vocabulary that decides whether a question is about periods at all, then
compiles everything into a TypeScript file the browser carries with it. That is
why the assistant works with no connection and no server: Python does the work
once, on a laptop, and ships the result. Adding to the library means adding a
Markdown file in `backend/articles/` and running `npm run knowledge`; see
`backend/README.md`.

## Related branches

- `main` — this web app
- `backend` — the on-device engine (`siklo-backend-ts`) and the Python reference
  implementation, including the health library and safety rules
- `app` — the React Native app

## Licence

See `LICENSE` on the `backend` branch.
