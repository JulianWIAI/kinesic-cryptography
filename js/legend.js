// Linguistic Architecture Legend — tab switching & minimize/maximize
const panel     = document.getElementById('legend-panel');
const body      = document.getElementById('legend-body');
const toggleBtn = document.getElementById('legend-toggle');
const tabs      = panel.querySelectorAll('.legend-tab');
const contents  = panel.querySelectorAll('.legend-tab-content');

toggleBtn.addEventListener('click', () => {
  const minimized = panel.classList.toggle('legend-panel--minimized');
  body.hidden = minimized;
  toggleBtn.textContent = minimized ? '+' : '−';
  toggleBtn.setAttribute('aria-expanded', String(!minimized));
  toggleBtn.setAttribute('aria-label', minimized ? 'Expand legend panel' : 'Minimize legend panel');
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => {
      const active = t.dataset.tab === target;
      t.classList.toggle('legend-tab--active', active);
      t.setAttribute('aria-selected', String(active));
    });
    contents.forEach(c => {
      c.hidden = c.id !== `legend-tab-${target}`;
    });
  });
});
