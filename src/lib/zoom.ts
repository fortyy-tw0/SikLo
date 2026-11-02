/** How much to scale the 390 x 844 design for a given window size. */
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
const PHONE_MAX_WIDTH = 600; // below this, treat the screen as a phone
const MAX_ZOOM = 1.6;

/**
 * Phones: fill the width, like a native app.
 * Tablets and desktops: grow until the design fills the window height, never smaller than 1:1.
 */
export function zoomFor(width: number, height: number): number {
  if (width < PHONE_MAX_WIDTH) return width / DESIGN_WIDTH;
  return Math.min(MAX_ZOOM, Math.max(1, height / DESIGN_HEIGHT));
}
