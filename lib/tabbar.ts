/** Bottom tab bar, rendered into <nav class="tabbar" data-current="..."> on pages that have it. */
import { ASSISTANT } from './features';
import { navigate, type ScreenId } from './router';
import { toast } from './toast';

type Tab = 'today' | 'calendar' | 'ask' | 'insights' | 'profile';

/** The SikLo mark, same paths as the app logo, drawn in white inside the ring. */
const AI_MARK =
  '<svg class="ai-mark" viewBox="0 0 512 512" aria-hidden="true"><g transform="translate(0 -12)" fill="currentColor" stroke="currentColor" stroke-width="10" stroke-linejoin="round"><path d="M182 410C164 348 180 292 216 264C196 246 188 216 196 190L194 124L238 160Q256 154 274 160L318 124L316 190C324 216 316 246 296 264C332 292 348 348 330 410Q256 422 182 410Z"/><path d="M322 402C384 406 400 350 366 316" fill="none" stroke-width="26" stroke-linecap="round"/></g></svg>';

/** A line icon for when Ask is the tab you are already on (the raised ring is for getting there). */
const ASK_ICON = '<path d="M20.5 11.3a7.7 7.7 0 0 1-11.2 6.9L4.5 19.5l1.4-4.3a7.7 7.7 0 1 1 14.6-3.9z"/>';

const TABS: { id: Tab; label: string; short?: string; screen: ScreenId | null; icon: string; center?: boolean }[] = [
  { id: 'today', label: 'Today', screen: 'home',
    icon: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>' },
  { id: 'calendar', label: 'Calendar', screen: 'calendar',
    icon: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>' },
  // Short label in the bar, so all five sit on the same line and the same width
  { id: 'ask', label: 'Ask SikLo', short: 'Ask', screen: 'ask', center: true, icon: ASK_ICON },
  { id: 'insights', label: 'Insights', screen: 'insights',
    icon: '<path d="M5 20V12M12 20V5M19 20v-6"/>' },
  { id: 'profile', label: 'Profile', screen: 'profile',
    icon: '<circle cx="12" cy="8.5" r="3.8"/><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5"/>' },
];

export function mountTabbar(nav: HTMLElement): void {
  const current = nav.dataset.current as Tab | undefined;
  const tabs = TABS.filter((t) => ASSISTANT || t.id !== 'ask');
  nav.innerHTML = tabs.map((t) => (t.center && t.id !== current
    // Raised: the ring sits over the icon's place, so the label stays on the
    // same line as every other tab's.
    ? `<a href="/" class="tab-ask" data-tab="${t.id}" aria-label="${t.label}">
         <span class="ai-ring" id="askPulse">${AI_MARK}</span>
         <span class="slot" aria-hidden="true"></span>${t.short ?? t.label}
       </a>`
    : `<a href="/" class="${t.center ? 'tab-ask-flat' : ''}" data-tab="${t.id}"${t.id === current ? ' aria-current="page"' : ''}>
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${t.icon}</svg>${t.short ?? t.label}
       </a>`)).join('');
  nav.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-tab]');
    if (!a) return;
    e.preventDefault();
    const tab = tabs.find((t) => t.id === a.dataset.tab)!;
    if (!tab.screen) toast(`${tab.label} is coming soon`);
    else if (tab.id !== current) navigate(tab.screen, tab.id === 'today' ? 'back' : 'forward');
  });
}
