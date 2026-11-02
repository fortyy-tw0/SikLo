import { byId } from '@lib/dom';
import { goTo } from '@lib/nav';
import { load } from '@lib/store';
import { mountThemeSwitch } from '@lib/theme';

/** Called by the router each time this screen is shown. */
export default function mount(_signal: AbortSignal): void {
  byId('startBtn').addEventListener('click', () => goTo('step-1', 'forward'));

  // A profile saved earlier in this browser
  if (load()) {
    const resume = byId<HTMLButtonElement>('resumeBtn');
    resume.hidden = false;
    resume.addEventListener('click', () => goTo('home', 'forward'));
  }

  // Light or dark: users pick what suits them; every page follows the choice
  mountThemeSwitch(byId<HTMLButtonElement>('themeSwitch'));
}
