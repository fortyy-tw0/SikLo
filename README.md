# SikLo — onboarding screens

Static HTML prototype of SikLo's private, local-profile onboarding flow, deployed on Vercel.

## Structure

```
index.html          Landing ("A little space for you.")
setup/
  step-1.html       Birthday
  step-2.html       Cycle description
  step-3.html       Optional context
  step-4.html       Period dates + Save
home.html           Next-period estimate, history, delete my data
assets/
  shared.css        Brand colour tokens, page transitions, scrollbar
  shared.js         Phone-width scaling and goTo() navigation
  store.js          On-device storage (draft until Save, then this browser only)
  prediction.js     Browser copy of siklo-backend-ts prediction engine
vercel.json         Clean URLs (/setup/step-1 instead of /setup/step-1.html)
```

Page-specific styles and scripts stay inside each HTML file; anything every screen uses lives in `assets/`.

## Data stays on the device

The site makes no network requests with user data. Setup answers are kept in
`sessionStorage` as a draft and written to `localStorage` only when the user
taps **Save on this device** on Step 4. "Delete my data from this device" on
the home screen removes it. Browser storage is not encrypted at rest, unlike
the phone app's SQLite database.

Field names follow the siklo-backend API contract, and
`SikloStore.onboardingPayload()` returns a `POST /onboarding` body, so the
same answers can be handed to `siklo-backend-ts` in the React Native app.

`assets/prediction.js` is a direct port of `siklo-backend-ts/src/prediction.ts`
and passes the same test cases: an estimate appears only after 3 complete
cycles of 15–90 days, and spotting never counts. Change the rules in the
backend first, then copy them here.

## Run locally

Open `index.html` in a browser, or serve the folder: `npx serve .`

## Deploy

Vercel builds from `main` with no build step. Every push to `main` redeploys.
