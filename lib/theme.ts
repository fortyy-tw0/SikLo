/**
 * Light or dark appearance, chosen by the user on the landing page or in
 * Profile. Saved in this browser; light until someone chooses dark.
 * A display preference, not personal data, so "Delete my data" keeps it.
 */
export type Theme = 'light' | 'dark';

const KEY = 'siklo-theme';

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Show the saved theme. Runs in <head> (boot.ts) so the page never flashes the wrong one. */
export function applyTheme(theme: Theme = getTheme()): void {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage blocked: the change still applies to this page */
  }
  applyTheme(theme);
}

const MOON = '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>';
const SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';

/**
 * Turns a <button class="theme-switch"> into the "Switch to dark/light mode"
 * control. The label always names the mode you'd switch to.
 */
export function mountThemeSwitch(button: HTMLButtonElement): void {
  const render = () => {
    const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${next === 'dark' ? MOON : SUN}</svg>Switch to ${next} mode`;
    button.dataset.next = next;
  };
  button.type = 'button';
  button.addEventListener('click', () => {
    // Fade colours for a moment instead of snapping (see html.theme-fade in shared.css)
    const root = document.documentElement;
    const fade = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fade) root.classList.add('theme-fade');
    setTheme(button.dataset.next === 'dark' ? 'dark' : 'light');
    render();
    if (fade) setTimeout(() => root.classList.remove('theme-fade'), 400);
  });
  render();
}
