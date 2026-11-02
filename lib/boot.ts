/**
 * Runs in <head> as a classic script, before the page paints:
 * - scales the 390 x 844 design to the screen
 * - sets the slide direction for this page's entrance
 * - applies the light or dark theme the user chose
 * - turns on smooth cross-page transitions where the browser supports them
 */
import { readDirection } from './nav';
import { applyTheme } from './theme';
import { zoomFor } from './zoom';

const root = document.documentElement;

function fit(): void {
  const z = zoomFor(window.innerWidth, window.innerHeight);
  root.style.setProperty('zoom', String(z));
  root.style.setProperty('--z', String(z));
}

fit();
window.addEventListener('resize', fit);
root.dataset.dir = readDirection();
applyTheme();

// Browsers with cross-document view transitions (Chrome, Edge, Safari 18.2+) animate
// straight from the old page to the new one; shared.css then skips the fallback animation.
if ('onpagereveal' in window) {
  root.classList.add('vt');
  // Fires right before the page is shown, including when it was pre-loaded in the
  // background earlier: read the direction now, not when the page was prepared.
  window.addEventListener('pagereveal', () => {
    root.dataset.dir = readDirection();
    applyTheme(); // the theme may have been switched after this page was prepared
  });
}

// Browser Back can restore this page exactly as it was left, mid exit animation; show it again.
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  document.querySelector('.screen')?.classList.remove('leaving');
  applyTheme();
});
