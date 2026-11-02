/**
 * Runs in <head> as a classic script, before the app draws:
 * - scales the 390 x 844 design to the screen
 * - applies the light or dark theme the user chose
 * - turns on smooth screen-to-screen slides where the browser supports them
 */
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
applyTheme();

// Browsers with view transitions (Chrome, Edge, Safari 18+) slide between screens
// themselves; shared.css then skips the fallback entrance animation.
if ('startViewTransition' in document) root.classList.add('vt');
