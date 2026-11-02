/** Bottom tab bar, rendered into <nav class="tabbar" data-current="..."> on pages that have it. */
import { navigate, type ScreenId } from './router';
import { toast } from './toast';

type Tab = 'today' | 'calendar' | 'insights' | 'profile';

const TABS: { id: Tab; label: string; screen: ScreenId | null; icon: string }[] = [
  { id: 'today', label: 'Today', screen: 'home',
    icon: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>' },
  { id: 'calendar', label: 'Calendar', screen: null,
    icon: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>' },
  { id: 'insights', label: 'Insights', screen: null,
    icon: '<path d="M5 20V12M12 20V5M19 20v-6"/>' },
  { id: 'profile', label: 'Profile', screen: 'profile',
    icon: '<circle cx="12" cy="8.5" r="3.8"/><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5"/>' },
];

export function mountTabbar(nav: HTMLElement): void {
  const current = nav.dataset.current as Tab | undefined;
  nav.innerHTML = TABS.map((t) => `
    <a href="/" data-tab="${t.id}"${t.id === current ? ' aria-current="page"' : ''}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${t.icon}</svg>${t.label}
    </a>`).join('');
  nav.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-tab]');
    if (!a) return;
    e.preventDefault();
    const tab = TABS.find((t) => t.id === a.dataset.tab)!;
    if (!tab.screen) toast(`${tab.label} is coming soon`);
    else if (tab.id !== current) navigate(tab.screen, tab.id === 'today' ? 'back' : 'forward');
  });
}
