/**
 * sitenav.js — Shared Tool Navigation Bar
 *
 * Injects a tab bar beneath the page header on every page.
 * The current page's tab is highlighted automatically based on the URL.
 *
 * Usage: add this as a module script in each HTML page's <head> or after
 * the closing </header> tag:
 *   <script type="module" src="js/sitenav.js"></script>
 *
 * No configuration needed — the script reads window.location.pathname.
 */

// Tab definitions — order determines display order in the bar.
const TABS = [
  {
    id:    'decoder',
    href:  'index.html',
    label: 'DECODER',
    icon:  '&#9644;',  // ▬ horizontal bars
    match: /index\.html$|\/$/,   // matches index.html and bare /
  },
  {
    id:    'cluster',
    href:  'cluster-analyzer.html',
    label: 'CLUSTER',
    icon:  '&#9643;',  // ▫ cluster icon
    match: /cluster-analyzer\.html$/,
  },
  {
    id:    'compare',
    href:  'comparison.html',
    label: 'COMPARE',
    icon:  '&#9636;',  // ▤ grid icon
    match: /comparison\.html$/,
  },
];

/**
 * Find which tab matches the current page URL.
 * Returns the tab id string, or null if no match.
 *
 * @returns {string|null}
 */
function _currentTab() {
  const path = window.location.pathname;
  for (const tab of TABS) {
    if (tab.match.test(path)) return tab.id;
  }
  return null;
}

/**
 * Build and insert the <nav class="tool-tabs"> element.
 * Inserts it immediately after the first <header> element on the page,
 * or before <main> as a fallback.
 */
function _injectNav() {
  // Avoid double-injection if script somehow runs twice.
  if (document.querySelector('.tool-tabs')) return;

  const activeId = _currentTab();

  const nav = document.createElement('nav');
  nav.className = 'tool-tabs';
  nav.setAttribute('aria-label', 'Tool navigation');

  for (const tab of TABS) {
    const a = document.createElement('a');
    a.href      = tab.href;
    a.className = 'tool-tab' + (tab.id === activeId ? ' active' : '');
    a.setAttribute('aria-current', tab.id === activeId ? 'page' : 'false');

    a.innerHTML =
      `<span class="tool-tab-icon" aria-hidden="true">${tab.icon}</span>` +
      `<span>${tab.label}</span>`;

    nav.appendChild(a);
  }

  // Insert after the first <header>, otherwise before <main>.
  const header = document.querySelector('header');
  const main   = document.querySelector('main');

  if (header && header.nextSibling) {
    header.parentNode.insertBefore(nav, header.nextSibling);
  } else if (main) {
    main.parentNode.insertBefore(nav, main);
  } else {
    document.body.prepend(nav);
  }
}

// Run after DOM is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _injectNav);
} else {
  _injectNav();
}
