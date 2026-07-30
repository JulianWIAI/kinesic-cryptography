/**
 * clusterAnalyzerMain.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Top-level orchestrator for the Psycholinguistic Cluster Analyzer page.
 *
 * This module:
 *   1. Wires up the word-input textarea and "ANALYSE CLUSTER" button.
 *   2. Drives the analysis pipeline (parseWordInput → runAnalysis).
 *   3. Passes results to the WH visualisation namespace for scatter-plot and
 *      heatmap-table rendering.
 *   4. Passes results to detectTriggers and renders any editorial alerts.
 *   5. Auto-triggers analysis on page load if the textarea already has a value
 *      (enabling the pre-populated demo to run without user interaction).
 *   6. Supports Ctrl+Enter inside the textarea as a keyboard shortcut.
 *
 * This module does NOT export anything — it is the entry-point script loaded
 * via <script type="module"> in cluster-analyzer.html.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { runAnalysis, parseWordInput } from './analysisEngine.js';
import { WH }                          from './wh.js';
import { detectTriggers, ui }          from './hudAlerts.js';
import { EMOTION_KEYS, EMOTION_COLORS, EMOTION_ABBR } from './affectLexicon.js';

// ─────────────────────────────────────────────────────────────────────────────
// DOM wiring — executed after the document is fully parsed
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Element references ────────────────────────────────────────────────────
  /** @type {HTMLTextAreaElement} */
  const wordInput     = document.getElementById('ca-word-input');

  /** @type {HTMLButtonElement} */
  const analyseBtn    = document.getElementById('ca-analyse-btn');

  /** @type {HTMLCanvasElement} */
  const plotCanvas    = document.getElementById('ca-plot-canvas');

  /** @type {HTMLDivElement} */
  const tableContainer = document.getElementById('ca-table-container');

  /** @type {HTMLDivElement} */
  const hudContainer  = document.getElementById('ca-hud-container');

  /** @type {HTMLElement} */
  const plotPanel     = document.getElementById('ca-plot-panel');

  /** @type {HTMLElement} */
  const tablePanel    = document.getElementById('ca-table-panel');

  /** @type {HTMLSpanElement} — inline status text next to the button */
  const statusBar     = document.getElementById('ca-status-bar');

  /** @type {HTMLSpanElement} — header status text (top-right of page) */
  const headerStatus  = document.getElementById('ca-status');

  /** @type {HTMLSelectElement} — language selector for lexicon loading */
  const langSelect    = document.getElementById('ca-lang-select');

  // ── Legend container (rendered inside the plot card) ─────────────────────
  /** @type {HTMLDivElement} */
  const legendContainer = document.getElementById('ca-emotion-legend');

  // ─────────────────────────────────────────────────────────────────────────
  // Core analysis routine
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Update the status bar text (bottom of input panel).
   * @param {string} msg
   */
  function setStatus(msg) {
    if (statusBar) statusBar.textContent = msg;
  }

  /**
   * Update the header status badge (top-right of page).
   * @param {string} msg
   */
  function setHeaderStatus(msg) {
    if (headerStatus) headerStatus.textContent = msg;
  }

  /**
   * Render the emotion colour legend below the scatter plot.
   * Creates one chip per emotion with a coloured swatch and the full name.
   */
  function renderEmotionLegend() {
    if (!legendContainer) return;
    legendContainer.innerHTML = '';

    for (const key of EMOTION_KEYS) {
      const chip = document.createElement('div');
      chip.className = 'ca-legend-chip';

      // Coloured circle swatch
      const swatch = document.createElement('span');
      swatch.className        = 'ca-legend-swatch';
      swatch.style.background = EMOTION_COLORS[key];
      swatch.setAttribute('aria-hidden', 'true');

      // Label: abbreviated key + full name
      const label = document.createElement('span');
      label.textContent = `${EMOTION_ABBR[key]} — ${key}`;

      chip.appendChild(swatch);
      chip.appendChild(label);
      legendContainer.appendChild(chip);
    }
  }

  /**
   * Run the full analysis pipeline for the current textarea value.
   *
   * This function is async because runAnalysis() now fetches the lexicon
   * JSON file for the selected language before performing the analysis.
   * Subsequent runs for the same language resolve from the in-memory cache
   * so there is no extra network latency after the first call.
   *
   * Steps:
   *   1. Parse and validate input.
   *   2. Read selected language code from the UI dropdown.
   *   3. Set "analysing" status.
   *   4. Await runAnalysis (fetches lexicon if not cached).
   *   5. Render scatter plot.
   *   6. Render heatmap table.
   *   7. Render emotion legend.
   *   8. Evaluate and display triggers.
   *   9. Reveal output panels.
   *  10. Set completion status.
   */
  async function runAndRender() {
    // ── 1. Parse input ─────────────────────────────────────────────────────
    const rawInput = wordInput ? wordInput.value : '';
    const words    = parseWordInput(rawInput);

    if (words.length === 0) {
      setStatus('No words to analyse.');
      return;
    }

    // ── 2. Read selected language ──────────────────────────────────────────
    // Falls back to 'en' if the select element is absent (e.g. in tests).
    const langCode = langSelect?.value ?? 'en';

    // ── 3. Analysing status ────────────────────────────────────────────────
    setStatus(`FETCHING LEXICON [${langCode.toUpperCase()}] — ANALYSING ${words.length} SIGNAL(S)…`);
    setHeaderStatus('PROCESSING…');

    // ── 4. Await async analysis (includes lexicon fetch / cache hit) ────────
    let results;
    try {
      results = await runAnalysis(words, langCode);
    } catch (err) {
      console.error('[runAndRender] runAnalysis failed:', err);
      setStatus('ANALYSIS ERROR — see console for details.');
      setHeaderStatus('ERROR');
      return;
    }

    // ── 5. Scatter plot ─────────────────────────────────────────────────────
    if (plotCanvas && results.length > 0) {
      WH.initPlot({ canvas: plotCanvas, data: results });
    }

    // ── 6. Heatmap table ────────────────────────────────────────────────────
    if (tableContainer && results.length > 0) {
      WH.initTable({ container: tableContainer, data: results });
    }

    // ── 7. Emotion colour legend ─────────────────────────────────────────────
    renderEmotionLegend();

    // ── 8. Compound trigger detection ────────────────────────────────────────
    const triggers = detectTriggers(results);

    if (triggers.length > 0) {
      // Show the first (highest-severity) trigger as the editorial banner
      ui.setEditorial({
        container: hudContainer,
        type:      triggers[0].type,
        message:   triggers[0].message,
        detail:    triggers[0].detail,
      });
    } else {
      // Clear any previous alert
      ui.setEditorial({
        container: hudContainer,
        type:      'clear',
        message:   '',
        detail:    '',
      });
    }

    // ── 9. Reveal output panels ───────────────────────────────────────────────
    if (plotPanel)  plotPanel.removeAttribute('hidden');
    if (tablePanel) tablePanel.removeAttribute('hidden');

    // ── 10. Completion status ─────────────────────────────────────────────────
    const matchedCount = results.filter(r =>
      EMOTION_KEYS.some(k => r[k] > 0)
    ).length;
    const totalCount = words.length;
    setStatus(`ANALYSIS COMPLETE [${langCode.toUpperCase()}] — ${matchedCount} / ${totalCount} tokens matched`);
    setHeaderStatus('ANALYSIS COMPLETE');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Event listeners
  // ─────────────────────────────────────────────────────────────────────────

  // ── Analyse button click ──────────────────────────────────────────────────
  if (analyseBtn) {
    analyseBtn.addEventListener('click', runAndRender);
  }

  // ── Ctrl+Enter inside the textarea ────────────────────────────────────────
  // Provides a keyboard shortcut so analysts can trigger a run without
  // moving their hands to the mouse.
  if (wordInput) {
    wordInput.addEventListener('keydown', (event) => {
      // Ctrl+Enter (Windows/Linux) or Cmd+Enter (macOS)
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        runAndRender();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-run on page load if textarea is pre-populated
  // ─────────────────────────────────────────────────────────────────────────
  // The HTML pre-fills the textarea with a demo word set so the analyst
  // immediately sees a result without any interaction.
  if (wordInput && wordInput.value.trim().length > 0) {
    runAndRender();
  }

}); // end DOMContentLoaded
