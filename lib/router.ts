/**
 * Single-page router: every screen lives at the same address (siklo-ph.vercel.app/).
 *
 * Each screen is a <template id="screen-<id>"> in index.html (made by build.mjs
 * from pages/<path>/page.html) plus a mount() function from its page.ts.
 * Showing a screen swaps it into #app; nothing reloads.
 *
 * Browser Back/Forward move between screens (history entries all keep the
 * address "/"), and a refresh reopens the screen you were on.
 */
export type ScreenId = 'index' | 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'home' | 'profile';
export type Direction = 'forward' | 'back';
/** Sets a screen up. Listeners on document/window must pass `{ signal }` so they stop when the screen is left. */
export type Mount = (signal: AbortSignal) => void;

/** Order of screens, used to pick the slide direction for browser Back/Forward. */
const ORDER: ScreenId[] = ['index', 'step-1', 'step-2', 'step-3', 'step-4', 'home', 'profile'];

interface Entry {
  screen: ScreenId;
  prev: ScreenId | null; // screen this entry was opened from, so in-app Back can use browser history
}

const mounts = new Map<ScreenId, Mount>();
let current: { id: ScreenId; controller: AbortController } | null = null;

export function register(id: ScreenId, mount: Mount): void {
  mounts.set(id, mount);
}

const isScreen = (v: unknown): v is ScreenId => typeof v === 'string' && (ORDER as string[]).includes(v);
const entry = (): Entry | null => {
  const s = history.state as Partial<Entry> | null;
  return s && isScreen(s.screen) ? { screen: s.screen, prev: isScreen(s.prev) ? s.prev : null } : null;
};

function swapIn(id: ScreenId): void {
  const template = document.getElementById(`screen-${id}`) as HTMLTemplateElement | null;
  const mount = mounts.get(id);
  if (!template || !mount) throw new Error(`Unknown screen "${id}"`);

  current?.controller.abort();
  const wrap = document.createElement('div');
  wrap.dataset.screen = id;
  wrap.append(template.content.cloneNode(true));
  document.getElementById('app')!.replaceChildren(wrap);
  document.title = template.dataset.title ?? 'SikLo';
  window.scrollTo(0, 0);

  const controller = new AbortController();
  current = { id, controller };
  mount(controller.signal);
}

/** Show a screen with the slide transition. */
function show(id: ScreenId, dir: Direction): void {
  const root = document.documentElement;
  root.dataset.dir = dir;
  const animate =
    current !== null &&
    'startViewTransition' in document &&
    document.visibilityState === 'visible' && // background tabs would hold the swap until shown
    !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate) {
    swapIn(id);
    return;
  }
  // The slide starts on the browser's next frame. If no frame comes (some embedded or
  // minimised windows), switch screens anyway so the app never appears stuck.
  let swapped = false;
  const swapOnce = () => {
    if (swapped) return;
    swapped = true;
    swapIn(id);
  };
  const transition = document.startViewTransition(swapOnce);
  setTimeout(() => {
    if (swapped) return;
    transition.skipTransition();
    swapOnce();
  }, 250);
}

/** Go to a screen. Going back to the screen we came from uses browser history, so Back/Forward stay in step. */
export function navigate(id: ScreenId, dir: Direction): void {
  const here = entry();
  if (dir === 'back' && here?.prev === id) {
    history.back(); // popstate shows it
    return;
  }
  history.pushState({ screen: id, prev: current?.id ?? null } satisfies Entry, '', '/');
  show(id, dir);
}

/** Replace the current screen without adding a history step (e.g. a screen that needs data sends you to the start). */
export function redirect(id: ScreenId): void {
  // Deferred so a screen can redirect from inside its own mount()
  setTimeout(() => {
    history.replaceState({ screen: id, prev: null } satisfies Entry, '', '/');
    show(id, 'back');
  }, 0);
}

/** Show the screen for this history entry (the start screen on a first visit) and follow Back/Forward. */
export function start(): void {
  const initial = entry()?.screen ?? 'index';
  history.replaceState({ screen: initial, prev: entry()?.prev ?? null } satisfies Entry, '', '/');
  show(initial, 'forward');

  // Links in screen layouts: <a href="/" data-go="profile"> (optional data-dir="back")
  document.addEventListener('click', (e) => {
    const link = (e.target as Element).closest<HTMLElement>('[data-go]');
    if (!link || !isScreen(link.dataset.go)) return;
    e.preventDefault();
    navigate(link.dataset.go, link.dataset.dir === 'back' ? 'back' : 'forward');
  });

  window.addEventListener('popstate', () => {
    const target = entry()?.screen ?? 'index';
    const dir: Direction = current && ORDER.indexOf(target) < ORDER.indexOf(current.id) ? 'back' : 'forward';
    show(target, dir);
  });
}
