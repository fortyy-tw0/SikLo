# SikLo — onboarding screens (web)

The SikLo onboarding flow as a website, written in TypeScript and deployed on
Vercel. Everything a visitor enters stays in their own browser.

## Structure

```
web/                    Page markup and styles, copied to dist/ as-is
  index.html            Landing ("A little space for you.")
  setup/step-1.html     Birthday
  setup/step-2.html     Cycle description
  setup/step-3.html     Optional context
  setup/step-4.html     Period dates + Save
  home.html             Today: cycle ring, key dates, log, phase + confirm ovulation, flags, trends
  profile.html          Saved periods, edit dates or setup, delete my data
  assets/shared.css     Brand colour tokens, page transitions, scrollbar
src/                    TypeScript
  boot.ts               Runs in <head>: phone-width scaling, slide direction
  pages/<page>.ts       One script per page (landing, step-1..4, home, profile)
  lib/nav.ts            goTo() with the slide transition
  lib/store.ts          On-device storage (draft until Save, then this browser only)
  lib/cycle.ts          predict() and helpers on top of the backend engine
  lib/cycleView.ts      Everything the Today screen shows (phase, fertile window, flags, trends)
  lib/tracking.ts       Daily logs, confirmed ovulation, flag choices (saved on this device)
  lib/tabbar.ts         Bottom tab bar; lib/toast.ts confirmation messages
  lib/types.ts          Profile and period shapes (backend API contract values)
  lib/dom.ts            Typed element lookup, escaping, today's date
  backend/              Copied unchanged from siklo-backend-ts (prediction.ts, dates.ts)
tests/                  Prediction, date-rule and Today-screen model tests (node:test)
build.mjs               esbuild: web/ + compiled src/ -> dist/
vercel.json             Install, build, output dir, clean URLs
```

## Commands

```bash
npm install
npm run dev         # build, watch and serve dist/ at http://localhost:8000
npm run build       # production build into dist/
npm run typecheck   # strict TypeScript checks (site + tests)
npm test            # prediction engine + date rules
```

## Data stays on the device

The site makes no network requests with user data. Setup answers are kept in
`sessionStorage` as a draft and written to `localStorage` only when the user
taps **Save on this device** on Step 4. "Delete my data from this device" on
the home screen removes it. Browser storage is not encrypted at rest, unlike
the phone app's SQLite database.

Field names follow the siklo-backend API contract, and `onboardingPayload()`
in `src/lib/store.ts` returns a `POST /onboarding` body, so the same answers
can be handed to `siklo-backend-ts` in the React Native app.

## Today screen

Built from the saved periods, never from sample data:

- **Next period** comes from the backend engine (median of recent cycles, range
  from shortest to longest). Before 3 complete cycles it says "Not enough data".
- **Ovulation** is placed 14 days before the next period; the **fertile window**
  is the 5 days before it plus ovulation day. Both are labelled estimates and
  are not birth control.
- **Confirm ovulation** (for the current cycle) moves the next period to
  ovulation day + 14 with a ±1 day range. It can be undone.
- **Worth a look** flags patterns (cycles outside 21–35 days, variation over 7
  days, periods over 7 days, plus the engine's missing-data and change flags).
  They are not diagnoses. Report and dismiss choices are saved on the device.
- Calendar and Insights tabs are placeholders for now.

## Prediction engine

`src/backend/prediction.ts` and `dates.ts` are byte-for-byte copies of the
files in `siklo-backend-ts/src` on the `backend` branch, so the website and
the phone app give the same estimate for the same dates. An estimate appears
only after 3 complete cycles of 15–90 days; spotting never counts. To change
the rules, change them in the backend, then copy the two files here and run
`npm test`.

## Deploy

Vercel builds `main` with `npm run build` and serves `dist/`. Every push to
`main` redeploys.
