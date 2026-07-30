/**
 * pdsPanel.js — Ousiometric PDS Panel UI Module
 *
 * Renders the Threat Matrix scatter plot and Base P.D.S. Telemetry bars.
 * Consumes the VAD lexicon layer (vad.js) and ousiometric transform (ousiometrics.js)
 * to produce a live, interactive SIGINT-aesthetic panel for psycholinguistic analysis.
 *
 * Dependencies (ES6 imports):
 *   ./vad.js           — analyzeVad()
 *   ./ousiometrics.js  — computePdsWords, computeAggregatePds,
 *                        detectApexThreats, APEX_THRESHOLD
 *
 * Chart.js is consumed as the UMD global window.Chart (NOT imported).
 * This matches the project's loading strategy where Chart.js is a <script> tag.
 *
 * Exported API:
 *   renderPdsPanel(text, stateLanguage) → Promise<void>
 *   destroyPdsPanel()                   → void
 */

import { analyzeVad } from './vad.js';
import {
  computePdsWords,
  computeAggregatePds,
  detectApexThreats,
  APEX_THRESHOLD,
} from './ousiometrics.js';

// ── Chart.js reference ───────────────────────────────────────────────────────
// Pulled from the global scope — Chart.js is loaded as a UMD <script> tag.
// We assign it at module level so _renderThreatMatrix can use it cleanly.
const Chart = window.Chart;

// ── Module-level chart instance ──────────────────────────────────────────────
// Stores the active Chart.js instance so it can be destroyed before re-render.
let _matrixChart = null;

// ── Colour constants (SIGINT palette) ────────────────────────────────────────
const CLR_BG        = '#07090f';   // --clr-bg
const CLR_SURFACE   = '#0e1118';   // --clr-surface
const CLR_ACCENT    = '#00c8ff';   // cyan — normal word points
const CLR_DANGER    = '#ff2222';   // red — apex threat points
const CLR_GRID_X    = 'rgba(0, 200, 255, 0.08)';   // faint cyan x-grid
const CLR_GRID_Y    = 'rgba(255, 34,  34,  0.08)';  // faint red  y-grid
const CLR_AXIS      = 'rgba(0, 200, 255, 0.5)';     // axis tick labels
const CLR_TEXT_MUTED = '#5a6a82';
const FONT_MONO     = "'Space Mono', 'Courier New', monospace";


// ── Public API ───────────────────────────────────────────────────────────────

/**
 * renderPdsPanel
 * ──────────────
 * Main orchestrator. Runs the full pipeline:
 *   text → VAD analysis → PDS transform → chart + telemetry + alert render.
 *
 * Gracefully handles missing DOM elements (panel may not exist on all pages).
 *
 * @param  {string} text           Raw input text to analyse.
 * @param  {string} stateLanguage  App state.language value.
 * @returns {Promise<void>}
 */
export async function renderPdsPanel(text, stateLanguage) {
  // ── Guard: require panel root ────────────────────────────────────────────
  const panel = document.getElementById('pds-panel');
  if (!panel) {
    // Panel element not present in this page configuration — silently exit.
    return;
  }

  // ── Step 1: Show loading state ───────────────────────────────────────────
  _setLoadingState(panel, true);

  // ── Step 2: Run VAD analysis asynchronously ──────────────────────────────
  let vadResults;
  try {
    vadResults = await analyzeVad(text, stateLanguage);
  } catch (err) {
    console.error('[pdsPanel.js] VAD analysis failed:', err);
    vadResults = [];
  }

  // ── Step 3: Handle empty / no-match result ───────────────────────────────
  const matchCountEl = document.getElementById('pds-match-count');
  const tokenCount   = text
    ? text.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (!vadResults || vadResults.length === 0) {
    _setLoadingState(panel, false);
    _showEmptyState(panel);

    // Hide the apex alert since no words were found.
    const apexAlert = document.getElementById('pds-apex-alert');
    if (apexAlert) apexAlert.setAttribute('hidden', '');

    // Update match counter to show 0 results.
    if (matchCountEl) {
      matchCountEl.textContent = `VAD MATCH: 0 / ${tokenCount} tokens`;
    }

    // Make panel visible even for empty state.
    panel.removeAttribute('hidden');
    return;
  }

  // ── Step 4: Compute PDS dimensions and aggregate stats ──────────────────
  const pdsWords   = computePdsWords(vadResults);
  const aggregate  = computeAggregatePds(pdsWords);
  const apexThreats = detectApexThreats(pdsWords);

  // ── Step 5: Render all UI sub-components ────────────────────────────────
  _renderThreatMatrix(pdsWords, apexThreats);
  _renderTelemetry(aggregate);
  _renderApexAlert(apexThreats);

  // ── Step 6: Update match count ───────────────────────────────────────────
  if (matchCountEl) {
    matchCountEl.textContent = `VAD MATCH: ${vadResults.length} / ${tokenCount} tokens`;
  }

  // ── Step 7: Reveal panel and clear loading state ─────────────────────────
  _setLoadingState(panel, false);
  panel.removeAttribute('hidden');
}


/**
 * destroyPdsPanel
 * ───────────────
 * Destroys the active Chart.js instance and resets module state.
 * Should be called when navigating away or when the panel is hidden,
 * to free Chart.js canvas resources.
 *
 * @returns {void}
 */
export function destroyPdsPanel() {
  if (_matrixChart) {
    _matrixChart.destroy();
    _matrixChart = null;
  }
}


// ── Private helpers ──────────────────────────────────────────────────────────

/**
 * _setLoadingState
 * ────────────────
 * Toggles a .pds-loading indicator inside the panel body.
 * When loading=true, hides the main content divs and shows the spinner text.
 * When loading=false, removes the loading overlay.
 *
 * @param  {HTMLElement} panel   The #pds-panel root element.
 * @param  {boolean}     loading Whether loading is in progress.
 */
function _setLoadingState(panel, loading) {
  // Show / hide a loading element if it exists.
  const loadingEl = panel.querySelector('.pds-loading');
  const bodyEl    = panel.querySelector('.pds-body');

  if (loading) {
    if (loadingEl) loadingEl.removeAttribute('hidden');
    if (bodyEl)   bodyEl.setAttribute('hidden', '');
  } else {
    if (loadingEl) loadingEl.setAttribute('hidden', '');
    if (bodyEl)   bodyEl.removeAttribute('hidden');
  }
}


/**
 * _showEmptyState
 * ───────────────
 * Displays the .pds-empty placeholder message when no VAD matches were found.
 * Destroys any existing chart and clears the telemetry bars.
 *
 * @param  {HTMLElement} panel  The #pds-panel root element.
 */
function _showEmptyState(panel) {
  // Destroy existing chart if present.
  destroyPdsPanel();

  // Show empty state message.
  const emptyEl = panel.querySelector('.pds-empty');
  if (emptyEl) emptyEl.removeAttribute('hidden');

  // Clear telemetry bars.
  const barsEl = document.getElementById('pds-telemetry-bars');
  if (barsEl) barsEl.innerHTML = '';
}


/**
 * _renderThreatMatrix
 * ───────────────────
 * Creates or recreates the Chart.js scatter plot on #pds-matrix-canvas.
 *
 * The chart shows:
 *  - X axis: Power Index (0 = submissive → 1 = apex authority)
 *  - Y axis: Danger Index (0 = benign    → 1 = high threat)
 *
 * Two datasets:
 *  - Normal words:    cyan dots (rgba(0,200,255,0.8))
 *  - Apex threats:    red diamond (rectRot) points (rgba(255,50,50,0.9))
 *
 * A custom plugin draws threshold lines at x=APEX_THRESHOLD and y=APEX_THRESHOLD,
 * plus a subtle red fill in the top-right (apex) quadrant.
 *
 * @param  {Array<{word, power, danger, structure}>} pdsWords     All words.
 * @param  {Array<{word, power, danger, structure}>} apexThreats  Apex subset.
 */
function _renderThreatMatrix(pdsWords, apexThreats) {
  // Guard: require canvas element.
  const canvas = document.getElementById('pds-matrix-canvas');
  if (!canvas || !Chart) return;

  // Destroy previous chart instance to avoid memory leaks and ghost renders.
  destroyPdsPanel();

  // Build a Set of apex word strings for O(1) membership test.
  const apexSet = new Set(apexThreats.map(w => w.word));

  // Partition pdsWords into normal and apex datasets.
  const normalPoints = pdsWords
    .filter(w => !apexSet.has(w.word))
    .map(w => ({ x: w.power, y: w.danger, word: w.word, structure: w.structure }));

  const apexPoints = apexThreats
    .map(w => ({ x: w.power, y: w.danger, word: w.word, structure: w.structure }));

  // ── Custom plugin: draw threshold lines and apex zone fill ───────────────
  const apexZonePlugin = {
    id: 'pdsApexZone',

    /**
     * afterDraw hook runs after all chart drawing is complete.
     * We draw directly on the canvas 2D context.
     */
    afterDraw(chart) {
      const { ctx, chartArea, scales } = chart;

      // Validate that scales are ready.
      if (!chartArea || !scales.x || !scales.y) return;

      // Convert APEX_THRESHOLD data coordinates to pixel positions.
      const xPx = scales.x.getPixelForValue(APEX_THRESHOLD);
      const yPx = scales.y.getPixelForValue(APEX_THRESHOLD);
      const { top, bottom, left, right } = chartArea;

      ctx.save();

      // ── 1. Apex zone background fill (top-right quadrant) ────────────────
      // Very subtle red wash to visually indicate the danger zone.
      ctx.fillStyle = 'rgba(255, 30, 30, 0.04)';
      ctx.fillRect(xPx, top, right - xPx, yPx - top);

      // ── 2. Vertical threshold line (x = APEX_THRESHOLD) ──────────────────
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.55)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.moveTo(xPx, top);
      ctx.lineTo(xPx, bottom);
      ctx.stroke();

      // ── 3. Horizontal threshold line (y = APEX_THRESHOLD) ────────────────
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.55)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.moveTo(left, yPx);
      ctx.lineTo(right, yPx);
      ctx.stroke();

      // ── 4. "APEX ZONE" label in top-right quadrant ────────────────────────
      ctx.setLineDash([]);
      ctx.font         = `700 9px ${FONT_MONO}`;
      ctx.fillStyle    = 'rgba(255, 50, 50, 0.45)';
      ctx.textAlign    = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('◆ APEX ZONE', right - 6, top + 5);

      ctx.restore();
    },
  };

  // ── Chart.js configuration ────────────────────────────────────────────────
  _matrixChart = new Chart(canvas, {
    type: 'scatter',

    data: {
      datasets: [
        // ── Dataset 0: Normal words ─────────────────────────────────────
        {
          label:           'Vocabulary Signal',
          data:             normalPoints,
          backgroundColor: 'rgba(0, 200, 255, 0.75)',
          borderColor:     'rgba(0, 200, 255, 0.9)',
          borderWidth:      1,
          pointRadius:      6,
          pointHoverRadius: 8,
          pointStyle:       'circle',
        },
        // ── Dataset 1: Apex threats ─────────────────────────────────────
        {
          label:           'Apex Threat',
          data:             apexPoints,
          backgroundColor: 'rgba(255, 50, 50, 0.85)',
          borderColor:     'rgba(255, 120, 120, 0.95)',
          borderWidth:      1.5,
          pointRadius:      8,
          pointHoverRadius: 10,
          pointStyle:       'rectRot',  // diamond shape
        },
      ],
    },

    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
        easing:   'easeOutQuart',
      },

      layout: {
        padding: { top: 8, right: 16, bottom: 8, left: 8 },
      },

      plugins: {
        legend: {
          // Hide the default legend — we render our own .pds-matrix-legend below.
          display: false,
        },

        tooltip: {
          // Custom tooltip shows full PDS breakdown for each word.
          backgroundColor: 'rgba(14, 17, 24, 0.96)',
          borderColor:     'rgba(0, 200, 255, 0.4)',
          borderWidth:      1,
          titleFont:        { family: FONT_MONO, size: 11, weight: '700' },
          bodyFont:         { family: FONT_MONO, size: 10 },
          titleColor:       CLR_ACCENT,
          bodyColor:        '#a0b0c0',
          padding:          10,
          displayColors:    false,
          callbacks: {
            // Show the word as the tooltip title (in uppercase for SIGINT aesthetic).
            title(items) {
              const item = items[0];
              return `◈ ${(item.raw.word || '').toUpperCase()}`;
            },
            // Show POWER, DANGER, STRUCTURE percentages in body.
            label(item) {
              const raw = item.raw;
              const pct = v => `${(v * 100).toFixed(1)}%`;
              return [
                `  POWER     : ${pct(raw.x)}`,
                `  DANGER    : ${pct(raw.y)}`,
                `  STRUCTURE : ${pct(raw.structure)}`,
              ];
            },
          },
        },
      },

      scales: {
        x: {
          // X axis: Power Index (0 → 1)
          type:  'linear',
          min:    0,
          max:    1,
          title: {
            display:  true,
            text:     '◀ SUBMISSIVE — POWER INDEX — APEX AUTHORITY ▶',
            color:    CLR_ACCENT,
            font:     { family: FONT_MONO, size: 9, weight: '700' },
            padding:  { top: 6 },
          },
          grid: {
            color:     CLR_GRID_X,
            lineWidth: 1,
          },
          ticks: {
            color:     CLR_AXIS,
            font:      { family: FONT_MONO, size: 9 },
            maxTicksLimit: 6,
            callback(v) { return v.toFixed(1); },
          },
          border: {
            color: 'rgba(0, 200, 255, 0.2)',
          },
        },

        y: {
          // Y axis: Danger Index (0 → 1)
          type:  'linear',
          min:    0,
          max:    1,
          title: {
            display:  true,
            text:     '▲ HIGH-THREAT — DANGER INDEX ▲',
            color:    '#ff4444',
            font:     { family: FONT_MONO, size: 9, weight: '700' },
            padding:  { bottom: 6 },
          },
          grid: {
            color:     CLR_GRID_Y,
            lineWidth: 1,
          },
          ticks: {
            color:     'rgba(255, 68, 68, 0.7)',
            font:      { family: FONT_MONO, size: 9 },
            maxTicksLimit: 6,
            callback(v) { return v.toFixed(1); },
          },
          border: {
            color: 'rgba(255, 68, 68, 0.2)',
          },
        },
      },
    },

    // Attach the custom apex-zone drawing plugin.
    plugins: [apexZonePlugin],
  });
}


/**
 * _renderTelemetry
 * ────────────────
 * Builds the three animated PDS bar indicators (Power, Danger, Structure)
 * inside #pds-telemetry-bars.
 *
 * Each bar shows:
 *  - A coloured label with the dimension name.
 *  - A numeric percentage value.
 *  - An animated fill bar that expands to the aggregate score.
 *
 * The Danger bar flashes when danger > 0.65 (above APEX_THRESHOLD).
 *
 * @param  {{ power: number, danger: number, structure: number }} aggregate
 *         Averaged PDS scores for the entire analysed passage.
 */
function _renderTelemetry(aggregate) {
  const barsEl = document.getElementById('pds-telemetry-bars');
  if (!barsEl) return;

  const { power, danger, structure } = aggregate;

  // Helper: format a 0-1 score as a rounded percentage string.
  const pct = v => `${Math.round(v * 100)}%`;

  // Whether danger exceeds the apex threshold — triggers flash CSS animation.
  const dangerFlash = danger >= APEX_THRESHOLD;

  // Whether structure is very low (chaotic) — triggers flicker animation.
  const structureFlicker = structure < 0.25;

  // Build the HTML for all three bars.
  // CSS handles the gradient fills and animations via the class names applied here.
  barsEl.innerHTML = `
    <div class="pds-bar-item">
      <span class="pds-bar-label pds-bar-label--power">POWER</span>
      <span class="pds-bar-value" style="color: #00ff88;">${pct(power)}</span>
      <div class="pds-bar-track">
        <div
          class="pds-bar-fill pds-bar-fill--power"
          style="width: ${pct(power)};"
          aria-valuenow="${Math.round(power * 100)}"
          aria-valuemin="0"
          aria-valuemax="100"
          role="progressbar"
        ></div>
      </div>
    </div>

    <div class="pds-bar-item${dangerFlash ? ' pds-bar--flash' : ''}">
      <span class="pds-bar-label pds-bar-label--danger">DANGER</span>
      <span class="pds-bar-value" style="color: #ff4444;">${pct(danger)}</span>
      <div class="pds-bar-track">
        <div
          class="pds-bar-fill pds-bar-fill--danger"
          style="width: ${pct(danger)};"
          aria-valuenow="${Math.round(danger * 100)}"
          aria-valuemin="0"
          aria-valuemax="100"
          role="progressbar"
        ></div>
      </div>
    </div>

    <div class="pds-bar-item${structureFlicker ? ' pds-bar--flicker' : ''}">
      <span class="pds-bar-label pds-bar-label--structure">STRUCTURE</span>
      <span class="pds-bar-value" style="color: #e8f0ff;">${pct(structure)}</span>
      <div class="pds-bar-track">
        <div
          class="pds-bar-fill pds-bar-fill--structure"
          style="width: ${pct(structure)};"
          aria-valuenow="${Math.round(structure * 100)}"
          aria-valuemin="0"
          aria-valuemax="100"
          role="progressbar"
        ></div>
      </div>
    </div>
  `.trim();
}


/**
 * _renderApexAlert
 * ─────────────────
 * Shows or hides the #pds-apex-alert box based on whether any apex threats
 * were detected. If visible, populates #pds-apex-words with word chips.
 *
 * @param  {Array<{word: string, power: number, danger: number}>} apexThreats
 *         Filtered array from detectApexThreats().
 */
function _renderApexAlert(apexThreats) {
  const alertEl = document.getElementById('pds-apex-alert');
  if (!alertEl) return;

  if (apexThreats.length === 0) {
    // No apex threats — hide the alert box entirely.
    alertEl.setAttribute('hidden', '');
    return;
  }

  // Show the alert box.
  alertEl.removeAttribute('hidden');

  // Populate the word chips list.
  const wordsEl = document.getElementById('pds-apex-words');
  if (!wordsEl) return;

  // Build one chip per unique apex word.
  // Sort by danger score (highest first) for impact ordering.
  const sorted = [...apexThreats].sort((a, b) => b.danger - a.danger);

  wordsEl.innerHTML = sorted
    .map(w => {
      const dangerPct = Math.round(w.danger * 100);
      return `<span class="pds-apex-chip" title="DANGER: ${dangerPct}%">${w.word.toUpperCase()}</span>`;
    })
    .join('');
}
