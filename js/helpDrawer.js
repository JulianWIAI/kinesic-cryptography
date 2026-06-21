// ── Global floating tooltip ────────────────────────────────
const tip = document.createElement('div');
tip.id = 'tip-popup';
tip.setAttribute('role', 'tooltip');
tip.setAttribute('aria-hidden', 'true');
document.body.appendChild(tip);

let _hideTimer = null;

function _positionTip(btn) {
  const rect = btn.getBoundingClientRect();
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;

  // Default: below and left-aligned to button
  let top  = rect.bottom + 7;
  let left = rect.left;

  tip.style.top  = top  + 'px';
  tip.style.left = left + 'px';

  // Clamp after paint so we know the rendered size
  requestAnimationFrame(() => {
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    if (left + tw > vw - 10) tip.style.left = Math.max(8, vw - tw - 10) + 'px';
    if (top  + th > vh - 10) tip.style.top  = (rect.top - th - 7) + 'px';
  });
}

document.addEventListener('mouseenter', e => {
  const btn = /** @type {Element} */ (e.target).closest?.('.tip-btn');
  if (!btn) return;
  clearTimeout(_hideTimer);
  const anchor = btn.closest('[data-tip]') ?? btn;
  const text   = anchor.dataset.tip ?? '';
  if (!text) return;
  tip.textContent = text;
  tip.classList.add('tip-popup--visible');
  tip.removeAttribute('aria-hidden');
  _positionTip(btn);
}, true);

document.addEventListener('mouseleave', e => {
  if (!/** @type {Element} */ (e.target).closest?.('.tip-btn')) return;
  _hideTimer = setTimeout(() => {
    tip.classList.remove('tip-popup--visible');
    tip.setAttribute('aria-hidden', 'true');
  }, 80);
}, true);

// ── Help Drawer ────────────────────────────────────────────
const overlay  = document.getElementById('help-overlay');
const drawer   = document.getElementById('help-drawer');
const openBtn  = document.getElementById('help-guide-btn');
const closeBtn = document.getElementById('help-drawer-close');

function openDrawer() {
  if (!drawer) return;
  drawer.classList.add('help-drawer--open');
  overlay?.classList.add('help-overlay--visible');
  drawer.removeAttribute('aria-hidden');
  closeBtn?.focus();
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove('help-drawer--open');
  overlay?.classList.remove('help-overlay--visible');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  openBtn?.focus();
}

openBtn?.addEventListener('click', openDrawer);
closeBtn?.addEventListener('click', closeDrawer);
overlay?.addEventListener('click', closeDrawer);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && drawer?.classList.contains('help-drawer--open')) closeDrawer();
});
