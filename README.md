# SikLo — web app

The SikLo app as a single-page web app, written in TypeScript and deployed on
Vercel at https://siklo-ph.vercel.app/. Every screen lives at that one address:
screens swap in place without reloading, browser Back/Forward move between
them, and a refresh reopens the screen you were on. Everything a visitor
enters stays in their own browser.

## Structure

One folder per screen: each holds that screen's layout and styles (`page.html`)
and its TypeScript (`page.ts`, which exports the `mount()` the router calls when
the screen is shown). Code and styles shared by several screens live in `lib/`,
with each automated check (`*.test.ts`) next to the code it checks.

```
pages/
  index/            Landing ("A little space for you.")
  setup/step-1/     Birthday
  setup/step-2/     Cycle description
  setup/step-3/     Optional context
  setup/step-4/     Period dates + Save
  home/             Today: ring, key dates, log, phase, flags
  profile/          Saved periods, edit, light/dark, delete my data
lib/
  shell.html        The one HTML page; the build adds every screen to it
  app.ts            Entry point: registers the screens, starts the router
  router.ts         Shows screens at "/", Back/Forward, refresh
  nav.ts            goTo(screen, direction)
  boot.ts           Runs in <head>: screen scaling, theme, transitions
  shared.css        Colour tokens (light + dark), basics, transitions, tab bar, toast
  theme.ts          Light / dark mode: saved choice, switch control
  zoom.ts           How much to scale the 390x844 design
  store.ts          On-device storage (draft until Save, then this browser only)
  types.ts          Profile and period shapes (backend API contract values)
  cycle.ts          predict() and helpers on top of the backend engine
  cycleView.ts      Everything the Today screen shows
  tracking.ts       Daily logs, confirmed ovulation, flag choices
  tabbar.ts         Bottom tab bar;  toast.ts  confirmation messages
  dom.ts            Typed element lookup, escaping, today's date
  *.test.ts         Automated checks for the file of the same name
  backend/          Copied unchanged from siklo-backend-ts (prediction.ts, dates.ts)
build.mjs           Builds the one page into dist/; also runs the checks
vercel.json         Install, build, output dir, caching, old addresses -> /
```

Screens import shared code as `@lib/<file>`. Each screen's styles only apply
to that screen, so screens can reuse class names. To add a screen, create
`pages/<path>/page.html` and `page.ts`, add its name to `ScreenId` in
`lib/router.ts`, and register it in `lib/app.ts`. Links in a layout can use
`<a href="/" data-go="profile">`.

## Commands

```bash
npm install
npm run dev         # build, watch and serve the app at http://localhost:8000
npm run build       # production build into dist/
npm run typecheck   # strict TypeScript checks
npm test            # automated checks (prediction, Today screen, scaling)
```

## Data stays on the device

The site makes no network requests with user data. Setup answers are kept in
`sessionStorage` as a draft and written to `localStorage` only when the user
taps **Save on this device** on Step 4. "Delete my data from this device" on
the home screen removes it. Browser storage is not encrypted at rest, unlike
the phone app's SQLite database.

Field names follow the siklo-backend API contract, and `onboardingPayload()`
in `lib/store.ts` returns a `POST /onboarding` body, so the same answers
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

## Light and dark mode

"Switch to dark mode" is on the landing page and in Profile. The choice is
saved in the browser (light until someone picks dark) and every page follows
it. Colours come from tokens in `lib/shared.css`: `:root` holds the light
values and `html[data-theme="dark"]` the dark ones, so new styles should use
the tokens (`var(--white)`, `var(--button)`, ...) rather than fixed colours.

## Prediction engine

`lib/backend/prediction.ts` and `dates.ts` are byte-for-byte copies of the
files in `siklo-backend-ts/src` on the `backend` branch, so the website and
the phone app give the same estimate for the same dates. An estimate appears
only after 3 complete cycles of 15–90 days; spotting never counts. To change
the rules, change them in the backend, then copy the two files here and run
`npm test`.

## Deploy

Vercel builds `main` with `npm run build` and serves `dist/`. Every push to
`main` redeploys. Old page addresses (`/index.html`, `/setup/...`, `/home.html`,
`/profile.html`) redirect to `/`.
