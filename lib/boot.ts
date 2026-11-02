/**
 * Runs in <head> as a classic script, before the page paints:
 * - scales the 390 x 844 design to the screen
 * - sets the slide direction for this page's entrance animation
 */
import { readDirection } from './nav';
import { zoomFor } from './zoom';

function fit(): void {
  const z = zoomFor(window.innerWidth, window.innerHeight);
  document.documentElement.style.setProperty('zoom', String(z));
  document.documentElement.style.setProperty('--z', String(z));
}

fit();
window.addEventListener('resize', fit);
document.documentElement.dataset.dir = readDirection();

// Browser Back can restore this page exactly as it was left, mid exit animation; show it again.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.querySelector('.screen')?.classList.remove('leaving');
});
