# SikLo — onboarding screens

Static HTML prototype of SikLo's private, local-profile onboarding flow, deployed on Vercel.

## Structure

```
index.html          Landing ("A little space for you.")
setup/
  step-1.html       Birthday
  step-2.html       Cycle description
  step-3.html       Optional context
  step-4.html       Your dates (placeholder)
assets/
  shared.css        Brand colour tokens, page transitions, scrollbar
  shared.js         Phone-width scaling and goTo() navigation
vercel.json         Clean URLs (/setup/step-1 instead of /setup/step-1.html)
```

Page-specific styles and scripts stay inside each HTML file; anything every screen uses lives in `assets/`.

## Run locally

Open `index.html` in a browser, or serve the folder: `npx serve .`

## Deploy

Vercel builds from `main` with no build step. Every push to `main` redeploys.
