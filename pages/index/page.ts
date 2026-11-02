import { byId } from '@lib/dom';
import { goTo } from '@lib/nav';
import { load } from '@lib/store';

byId('startBtn').addEventListener('click', () => goTo('setup/step-1.html', 'forward'));

// A profile saved earlier in this browser
if (load()) {
  const resume = byId<HTMLButtonElement>('resumeBtn');
  resume.hidden = false;
  resume.addEventListener('click', () => goTo('home.html', 'forward'));
}
