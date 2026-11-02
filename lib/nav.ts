/** Page navigation with the shared slide transition (see .screen.leaving in shared.css). */

export type Direction = 'forward' | 'back';

const DIR_KEY = 'siklo-dir';

export function readDirection(): Direction {
  try {
    return sessionStorage.getItem(DIR_KEY) === 'back' ? 'back' : 'forward';
  } catch {
    return 'forward';
  }
}

/**
 * Starts loading the next page immediately; the exit animation plays while it
 * loads, and the browser swaps pages as soon as the new one is ready.
 */
export function goTo(url: string, dir: Direction): void {
  try {
    sessionStorage.setItem(DIR_KEY, dir);
  } catch {
    /* storage blocked: animation direction just defaults to forward */
  }
  const root = document.documentElement;
  root.dataset.dir = dir;
  // With view transitions the browser animates the swap itself; otherwise fade this page out.
  if (!root.classList.contains('vt') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelector('.screen')?.classList.add('leaving');
  }
  location.href = url;
}
