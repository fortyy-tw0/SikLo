/**
 * Runs in <head> as a classic script, before the page paints:
 * - scales the 390px-wide design down to the phone's width
 * - sets the slide direction for this page's entrance animation
 */
import { readDirection } from './lib/nav';

const DESIGN_WIDTH = 390;

function fit(): void {
  const z = Math.min(1, window.innerWidth / DESIGN_WIDTH);
  document.documentElement.style.setProperty('zoom', String(z));
  document.documentElement.style.setProperty('--z', String(z));
}

fit();
window.addEventListener('resize', fit);
document.documentElement.dataset.dir = readDirection();
