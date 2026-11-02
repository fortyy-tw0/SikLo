// SikLo shared scripts: phone-width scaling and page navigation.
// Loaded in <head> so scaling applies before first paint.
// Fit the 390px-wide design to the phone width (all screens scale the same way)
(function () {
  function fit() { const z = Math.min(1, window.innerWidth / 390); document.documentElement.style.zoom = z; document.documentElement.style.setProperty('--z', z); }
  fit(); window.addEventListener('resize', fit);
})();

// ---- Page navigation with a slide transition ----
try { document.documentElement.dataset.dir = sessionStorage.getItem('siklo-dir') || 'forward'; } catch (e) {}
function goTo(url, dir) {
  try { sessionStorage.setItem('siklo-dir', dir); } catch (e) {}
  document.documentElement.dataset.dir = dir;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { location.href = url; return; }
  document.querySelector('.screen').classList.add('leaving');
  setTimeout(() => { location.href = url; }, 280);
}
