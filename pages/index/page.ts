import { byId } from '@lib/dom';
import { goTo } from '@lib/nav';
import { load } from '@lib/store';
import { mountThemeSwitch } from '@lib/theme';

byId('startBtn').addEventListener('click', () => goTo('setup/step-1.html', 'forward'));

// A profile saved earlier in this browser
if (load()) {
  const resume = byId<HTMLButtonElement>('resumeBtn');
  resume.hidden = false;
  resume.addEventListener('click', () => goTo('home.html', 'forward'));
}

// Light or dark: users pick what suits them; every page follows the choice
mountThemeSwitch(byId<HTMLButtonElement>('themeSwitch'));
