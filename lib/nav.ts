/** Moving between screens. The address always stays siklo-ph.vercel.app/ (see router.ts). */
import { navigate, type Direction, type ScreenId } from './router';

export type { Direction, ScreenId };

/** Go to another screen; `dir` sets which way it slides. */
export function goTo(screen: ScreenId, dir: Direction): void {
  navigate(screen, dir);
}
