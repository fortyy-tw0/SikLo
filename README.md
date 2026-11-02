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
  home.html             Next-period estimate, history, delete my data
  assets/shared.css     Brand colour tokens, page transitions, scrollbar
src/                    TypeScript
  boot.ts               Runs in <head>: phone-width scaling, slide direction
  pages/<page>.ts       One script per page (landing, step-1..4, home)
  lib/nav.ts            goTo() with the slide transition
  lib/store.ts          On-device storage (draft until Save, then this browser only)
  lib/cycle.ts          predict() and helpers on top of the backend engine
  lib/types.ts          Profile and period shapes (backend API contract values)
  lib/dom.ts            Typed element lookup, escaping, today's date
  backend/              Copied unchanged from siklo-backend-ts (prediction.ts, dates.ts)
tests/                  Prediction and date-rule tests (node:test)
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
