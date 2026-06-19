/**
 * Diagnostic Panel Module
 *
 * Renders the Psycholinguistic Diagnostic Engine UI panel.
 * Displays per-word metrics:
 *   — Quersumme (digital root) and Archetype
 *   — Word Sum (Σ)
 *   — Standard Deviation (σ)
 *   — Complexity Tier classification
 *   — Category distribution bar with legend
 *   — Sovereignty / Somatic / Resonant scores
 *   — Radar Chart (archetypal category profile)
 *   — Scatter Plot (letter values mapped by position)
 *
 * Visually isolated from the main decoding stream via its own
 * section element and stylesheet (css/diagnostic.css).
 */

import { calculateDigitalRoot, getArchetype }                                      from './quersumme.js';
import { analyzeComplexity }                                                        from './complexity.js';
import { analyzeCategorical }                                                        from './categoricalAnalysis.js';
import { renderRadarChart, renderScatterChart, destroyCharts,
         renderClusterBarChart, destroyClusterBarChart }                            from './charts.js';
import { CLUSTER_COLORS }                                                            from './palette.js';

// ── DOM references ────────────────────────────────────────
const panelEl       = document.getElementById('diagnostic-panel');
const panelBody     = document.getElementById('diagnostic-body');
const toggleBtn     = document.getElementById('diagnostic-toggle');
const metricsGrid   = document.getElementById('diagnostic-metrics');
const categoryBars  = document.getElementById('diagnostic-category-bar');
const scoresEl      = document.getElementById('diagnostic-scores');
const radarCanvas   = /** @type {HTMLCanvasElement} */ (document.getElementById('diagnostic-radar'));
const scatterCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('diagnostic-scatter'));
const scatterBoxEl  = document.getElementById('diagnostic-scatter-box');
const barBoxEl      = document.getElementById('diagnostic-bar-box');
const barCanvas     = /** @type {HTMLCanvasElement} */ (document.getElementById('diagnostic-bar'));

// ── Collapse toggle ───────────────────────────────────────
let panelOpen = true;

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panelBody?.classList.toggle('diagnostic-body--collapsed', !panelOpen);
    toggleBtn.textContent = panelOpen ? '▼' : '▲';
    toggleBtn.setAttribute('aria-expanded', String(panelOpen));
    toggleBtn.setAttribute('aria-label',
      panelOpen ? 'Collapse diagnostic panel' : 'Expand diagnostic panel');
  });
}

// ── Public API ────────────────────────────────────────────

/** Hides the diagnostic panel. */
export function hideDiagnosticPanel() {
  panelEl?.setAttribute('hidden', '');
  destroyCharts();
  destroyClusterBarChart();
}

/**
 * Computes and renders the full diagnostic panel for one or two words.
 *
 * @param {string}      wordA — primary input (required)
 * @param {string|null} wordB — comparison word; null in single-word mode
 */
export function renderDiagnostic(wordA, wordB = null) {
  if (!panelEl) return;

  const cleanA = wordA.trim();
  const cleanB = (wordB !== null && wordB.trim()) ? wordB.trim() : null;

  if (!cleanA) { hideDiagnosticPanel(); return; }

  // ── Compute metrics ──────────────────────────────────────
  const compA     = analyzeComplexity(cleanA);
  const catA      = analyzeCategorical(cleanA);
  const rootA     = calculateDigitalRoot(compA.wordSum);
  const archetypeA = getArchetype(rootA);

  let compB = null, catB = null, rootB = null, archetypeB = null;
  if (cleanB) {
    compB      = analyzeComplexity(cleanB);
    catB       = analyzeCategorical(cleanB);
    rootB      = calculateDigitalRoot(compB.wordSum);
    archetypeB = getArchetype(rootB);
  }

  // ── Render sections ──────────────────────────────────────
  renderMetrics(cleanA, compA, rootA, archetypeA, cleanB, compB, rootB, archetypeB);
  renderCategoryBars(catA, catB, cleanA, cleanB);
  renderScores(catA, catB);

  // ── Charts ───────────────────────────────────────────────
  destroyCharts();
  destroyClusterBarChart();

  // Restore scatter box, hide bar chart (cluster-only)
  scatterBoxEl?.removeAttribute('hidden');
  barBoxEl?.setAttribute('hidden', '');

  const radarSets = [{ label: cleanA.toUpperCase(), radarValues: catA.radarValues }];
  if (catB) radarSets.push({ label: cleanB.toUpperCase(), radarValues: catB.radarValues });
  renderRadarChart(radarCanvas, radarSets);

  const scatterSets = [{ label: cleanA.toUpperCase(), word: cleanA }];
  if (cleanB) scatterSets.push({ label: cleanB.toUpperCase(), word: cleanB });
  renderScatterChart(scatterCanvas, scatterSets);

  panelEl.removeAttribute('hidden');
}

// ── Internal renderers ────────────────────────────────────

function renderMetrics(wordA, compA, rootA, archetypeA, wordB, compB, rootB, archetypeB) {
  if (!metricsGrid) return;
  metricsGrid.innerHTML = '';
  metricsGrid.style.gridTemplateColumns = compB ? '1fr 1fr' : '1fr';

  metricsGrid.appendChild(buildMetricColumn(wordA, compA, rootA, archetypeA));
  if (compB) metricsGrid.appendChild(buildMetricColumn(wordB, compB, rootB, archetypeB));
}

function buildMetricColumn(word, comp, root, archetype) {
  const col = document.createElement('div');
  col.className = 'diag-metric-col';

  // Format word sum: omit decimal if integer
  const sumDisplay = comp.wordSum % 1 === 0
    ? String(comp.wordSum)
    : comp.wordSum.toFixed(1);

  col.innerHTML = `
    <div class="diag-word-label">${word.toUpperCase()}</div>
    <div class="diag-metric-row">
      <div class="diag-metric-tile diag-tile--quersumme">
        <span class="diag-tile-label">QUERSUMME</span>
        <span class="diag-tile-value">${root}</span>
        <span class="diag-tile-sub">${archetype.name}</span>
      </div>
      <div class="diag-metric-tile diag-tile--sum">
        <span class="diag-tile-label">WORD SUM</span>
        <span class="diag-tile-value">${sumDisplay}</span>
        <span class="diag-tile-sub">Σ letters</span>
      </div>
      <div class="diag-metric-tile diag-tile--sigma">
        <span class="diag-tile-label">σ SIGMA</span>
        <span class="diag-tile-value">${comp.sigma.toFixed(2)}</span>
        <span class="diag-tile-sub">Std. deviation</span>
      </div>
      <div class="diag-metric-tile diag-tile--tier diag-tier--${comp.tier}">
        <span class="diag-tile-label">COMPLEXITY TIER</span>
        <span class="diag-tile-value">T${comp.tier}</span>
        <span class="diag-tile-sub">${comp.tierLabel}</span>
      </div>
      <div class="diag-metric-tile diag-tile--count">
        <span class="diag-tile-label">LETTERS</span>
        <span class="diag-tile-value">${comp.values.length}</span>
        <span class="diag-tile-sub">Valid chars</span>
      </div>
    </div>
    <div class="diag-archetype-desc">${archetype.description}</div>
  `;

  return col;
}

// ── Category distribution bars ────────────────────────────

// Colour palette synced with charts.js
const CAT_COLOR = {
  Origin:    '#fbbf24',
  Kinetic:   '#ef4444',
  Sovereign: '#3b82f6',
  Liminal:   '#a855f7',
  Resonant:  '#22c55e',
};

function renderCategoryBars(catA, catB, wordA, wordB) {
  if (!categoryBars) return;
  categoryBars.innerHTML = '';

  categoryBars.appendChild(buildCategoryBar(catA, wordA));
  if (catB) categoryBars.appendChild(buildCategoryBar(catB, wordB));
}

function buildCategoryBar(cat, word) {
  const container = document.createElement('div');
  container.className = 'diag-cat-block';

  const title = document.createElement('div');
  title.className = 'diag-cat-title';
  title.textContent = `${word.toUpperCase()} — Category Distribution`;
  container.appendChild(title);

  const bar = document.createElement('div');
  bar.className = 'diag-cat-bar';

  for (const seg of cat.breakdown) {
    if (seg.percentage < 0.1) continue;
    const segment = document.createElement('div');
    segment.className   = 'diag-cat-segment';
    segment.style.width = `${seg.percentage.toFixed(1)}%`;
    segment.style.backgroundColor = CAT_COLOR[seg.category] ?? '#64748b';
    segment.title = `${seg.category}: ${seg.percentage.toFixed(1)}%`;
    bar.appendChild(segment);
  }

  const legend = document.createElement('div');
  legend.className = 'diag-cat-legend';

  for (const seg of cat.breakdown) {
    if (seg.count === 0) continue;
    const item = document.createElement('span');
    item.className = 'diag-cat-legend-item';
    item.innerHTML = `
      <span class="diag-cat-dot" style="background:${CAT_COLOR[seg.category] ?? '#64748b'}"></span>
      ${seg.category} ${seg.percentage.toFixed(0)}%
    `;
    legend.appendChild(item);
  }

  container.appendChild(bar);
  container.appendChild(legend);
  return container;
}

// ── Scores ────────────────────────────────────────────────

function renderScores(catA, catB) {
  if (!scoresEl) return;
  scoresEl.innerHTML = '';

  const scoreGroups = [
    { label: 'SOVEREIGNTY',          key: 'sovereigntyScore', cls: 'diag-score--sovereign' },
    { label: 'SOMATIC (Kin + Lim)',  key: 'somaticScore',     cls: 'diag-score--somatic'   },
    { label: 'RESONANT (Res + Ori)', key: 'resonantScore',    cls: 'diag-score--resonant'  },
  ];

  const row = document.createElement('div');
  row.className = 'diag-score-row';

  for (const { label, key, cls } of scoreGroups) {
    const group = document.createElement('div');
    group.className = 'diag-score-group';

    const groupLabel = document.createElement('div');
    groupLabel.className   = 'diag-score-group-label';
    groupLabel.textContent = label;
    group.appendChild(groupLabel);

    const pair = document.createElement('div');
    pair.className = 'diag-score-pair';

    pair.appendChild(buildScoreItem(catA[key], catB ? 'A' : null, cls));
    if (catB) pair.appendChild(buildScoreItem(catB[key], 'B', cls));

    group.appendChild(pair);
    row.appendChild(group);
  }

  scoresEl.appendChild(row);
}

function buildScoreItem(value, label, colorClass) {
  const item = document.createElement('div');
  item.className = `diag-score-item ${colorClass}`;

  const pct = value.toFixed(1);
  const lbl = label ? `WORD ${label}` : 'SCORE';

  item.innerHTML = `
    <div class="diag-score-header">
      <span class="diag-score-label">${lbl}</span>
      <span class="diag-score-value">${pct}%</span>
    </div>
    <div class="diag-score-track">
      <div class="diag-score-fill" style="width:${pct}%"></div>
    </div>
  `;

  return item;
}

// ── Cluster Diagnostic (N-word mode) ─────────────────────

/**
 * Renders the full diagnostic panel for a cluster of N words.
 * Each word gets its own color from the CLUSTER_COLORS palette.
 * Shows per-word metric rows, category bars, score table,
 * multi-word radar chart, and Balkendiagramm.
 *
 * @param {string[]} words — array of raw word strings
 */
export function renderDiagnosticCluster(words) {
  if (!panelEl || !words || words.length === 0) { hideDiagnosticPanel(); return; }

  // Build per-word analysis entries, skip words with no valid letters
  const entries = words
    .map((word, i) => {
      const w    = word.trim();
      const comp = analyzeComplexity(w);
      if (comp.values.length === 0) return null;
      const cat       = analyzeCategorical(w);
      const root      = calculateDigitalRoot(comp.wordSum);
      const archetype = getArchetype(root);
      const color     = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
      return { word: w, comp, cat, root, archetype, color, index: i };
    })
    .filter(Boolean);

  if (entries.length === 0) { hideDiagnosticPanel(); return; }

  // ── Metric rows ─────────────────────────────────────────
  if (metricsGrid) {
    metricsGrid.style.gridTemplateColumns = '1fr';
    metricsGrid.innerHTML = entries.map(e => {
      const sumDisplay = e.comp.wordSum % 1 === 0
        ? String(e.comp.wordSum) : e.comp.wordSum.toFixed(1);
      const tier = `T${e.comp.tier}`;
      return `
        <div class="diag-cluster-row" style="--word-color:${e.color.line}">
          <div class="diag-cluster-word-name">${e.word.toUpperCase()}</div>
          <div class="diag-cluster-tiles">
            <div class="diag-cluster-tile">
              <span class="diag-tile-label">LETTERS</span>
              <span class="diag-cluster-tile-val">${e.comp.values.length}</span>
            </div>
            <div class="diag-cluster-tile">
              <span class="diag-tile-label">WORD SUM Σ</span>
              <span class="diag-cluster-tile-val">${sumDisplay}</span>
            </div>
            <div class="diag-cluster-tile">
              <span class="diag-tile-label">σ SIGMA</span>
              <span class="diag-cluster-tile-val">${e.comp.sigma.toFixed(2)}</span>
            </div>
            <div class="diag-cluster-tile">
              <span class="diag-tile-label">TIER</span>
              <span class="diag-cluster-tile-val diag-cluster-tier-badge diag-cluster-tier-badge--${tier.toLowerCase()}">${tier}</span>
            </div>
            <div class="diag-cluster-tile">
              <span class="diag-tile-label">QUERSUMME</span>
              <span class="diag-cluster-tile-val">${e.root} &mdash; ${e.archetype.name}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Category bars ────────────────────────────────────────
  if (categoryBars) {
    categoryBars.innerHTML = '';
    entries.forEach(e => {
      const block = buildCategoryBar(e.cat, e.word);
      block.style.setProperty('--word-color', e.color.line);
      block.querySelector('.diag-cat-title').style.color = e.color.line;
      categoryBars.appendChild(block);
    });
  }

  // ── Scores table ─────────────────────────────────────────
  if (scoresEl) {
    scoresEl.innerHTML = `
      <div class="diag-cluster-score-table">
        <div class="diag-cluster-score-header">
          <span>WORD</span>
          <span>SOVEREIGNTY</span>
          <span>SOMATIC</span>
          <span>RESONANT</span>
        </div>
        ${entries.map(e => `
          <div class="diag-cluster-score-row">
            <span class="diag-cluster-score-word" style="color:${e.color.line}">${e.word.toUpperCase()}</span>
            <span>${e.cat.sovereigntyScore.toFixed(1)}%</span>
            <span>${e.cat.somaticScore.toFixed(1)}%</span>
            <span>${e.cat.resonantScore.toFixed(1)}%</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Charts ───────────────────────────────────────────────
  destroyCharts();
  destroyClusterBarChart();

  // Multi-word radar (all words, one dataset per word)
  renderRadarChart(radarCanvas, entries.map(e => ({
    label:       e.word.toUpperCase(),
    radarValues: e.cat.radarValues,
  })));

  // Hide letter-position scatter (not meaningful for multi-word); show Balkendiagramm
  scatterBoxEl?.setAttribute('hidden', '');
  barBoxEl?.removeAttribute('hidden');

  renderClusterBarChart(barCanvas, entries.map(e => ({
    word:    e.word,
    wordSum: e.comp.wordSum,
    sigma:   e.comp.sigma,
  })));

  panelEl.removeAttribute('hidden');
}
