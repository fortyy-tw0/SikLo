/** Page navigation with the shared slide transition (see .screen.leaving in shared.css). */

export type Direction = 'forward' | 'back';

const DIR_KEY = 'siklo-dir';
const LEAVE_MS = 280;

export function readDirection(): Direction {
  try {
    return sessionStorage.getItem(DIR_KEY) === 'back' ? 'back' : 'forward';
  } catch {
    return 'forward';
  }
}

export function goTo(url: string, dir: Direction): void {
  try {
    sessionStorage.setItem(DIR_KEY, dir);
  } catch {
    /* storage blocked: animation direction just defaults to forward */
  }
  document.documentElement.dataset.dir = dir;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    location.href = url;
    return;
  }
  document.querySelector('.screen')?.classList.add('leaving');
  setTimeout(() => {
    location.href = url;
  }, LEAVE_MS);
}
