/**
 * wh.js — WordHeat Visualisation Namespace
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides the WH object, which contains all Chart.js-backed scatter-plot
 * rendering and HTML heatmap-table construction logic for the Psycholinguistic
 * Cluster Analyzer page.
 *
 * Chart.js v4 is expected to be loaded as a UMD global BEFORE this module
 * executes (i.e. via a <script> tag above the <script type="module"> tag in
 * the HTML).  Access is therefore via `window.Chart`.
 *
 * Imports from affectLexicon.js:
 *   EMOTION_KEYS   — ordered array of 8 emotion dimension names
 *   EMOTION_ABBR   — 3-letter abbreviations for compact column headers
 *   EMOTION_COLORS — hex colour per emotion for dots and legend
 *   EMOTION_RGBA   — [R,G,B] arrays for building rgba() strings
 *   DEFAULT_COLOR  — fallback cyan used when no emotion is dominant
 *   NEUTRAL_THRESHOLD — minimum dominant-emotion score to apply colouring
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  EMOTION_KEYS,
  EMOTION_ABBR,
  EMOTION_COLORS,
  EMOTION_RGBA,
  DEFAULT_COLOR,
  NEUTRAL_THRESHOLD,
} from './affectLexicon.js';

// ─── Chart.js UMD global ──────────────────────────────────────────────────────
// Chart.js is loaded via a <script> tag in the HTML before this module runs.
// We reference it through window.Chart to satisfy the ES-module environment.
const Chart = window.Chart;

// ─── Internal state ───────────────────────────────────────────────────────────
/**
 * Tracks active Chart instances keyed by their canvas element.
 * Allows WH.initPlot to destroy an old chart before creating a new one,
 * preventing the "Canvas is already in use" error from Chart.js.
 *
 * @type {Map<HTMLCanvasElement, Chart>}
 */
const _chartRegistry = new Map();

// ─── Sigma tier threshold constants ──────────────────────────────────────────
/** T1 threshold: words with σ ≤ T1_SIGMA are Somatic/Universal. */
const T1_SIGMA = 2.0;

/** T3 threshold: words with σ > T3_SIGMA are State/System (complex). */
const T3_SIGMA = 5.0;

// ─── Monospace font for chart labels / tooltips ───────────────────────────────
const FONT_MONO = "'Space Mono', monospace";

// ─── Shared chart background colour ──────────────────────────────────────────
const CHART_BG = '#07090f';

// ─────────────────────────────────────────────────────────────────────────────
// WH — WordHeat namespace object
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @namespace WH
 * @description WordHeat visualisation namespace.
 */
export const WH = {

  // ─── WH.getColor ──────────────────────────────────────────────────────────

  /**
   * Resolve a colour value by name.
   *
   * Behaviour:
   *   - If `name` starts with '--', it is treated as a CSS custom property and
   *     read from the document root's computed style.
   *   - Otherwise, the name is looked up in EMOTION_COLORS.
   *   - If neither lookup succeeds, DEFAULT_COLOR is returned.
   *
   * @param {string} name — emotion key (e.g. 'anger') or CSS var (e.g. '--clr-accent')
   * @returns {string} — hex or rgb colour string
   */
  getColor(name) {
    if (typeof name === 'string' && name.startsWith('--')) {
      // Read a CSS custom property from :root
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    }
    // Look up in the emotion colour map
    return EMOTION_COLORS[name] ?? DEFAULT_COLOR;
  },

  // ─── WH.getDominantEmotion ────────────────────────────────────────────────

  /**
   * Find the emotion dimension with the highest intensity score.
   *
   * @param {Object} emotionObj — object with any subset of EMOTION_KEYS as keys
   * @returns {{ emotion: string|null, score: number }}
   *   emotion — key name of the dominant emotion, or null if no data
   *   score   — intensity value in [0, 1], or 0 if no data
   */
  getDominantEmotion(emotionObj) {
    if (!emotionObj || typeof emotionObj !== 'object') {
      return { emotion: null, score: 0 };
    }

    let dominantKey   = null;
    let dominantScore = 0;

    for (const key of EMOTION_KEYS) {
      const val = emotionObj[key] ?? 0;
      if (val > dominantScore) {
        dominantScore = val;
        dominantKey   = key;
      }
    }

    return { emotion: dominantKey, score: dominantScore };
  },

  // ─── WH.getDotColor ───────────────────────────────────────────────────────

  /**
   * Determine the scatter-plot dot colour for a result object.
   *
   * If the dominant emotion's score is below NEUTRAL_THRESHOLD, the point is
   * considered emotionally neutral and rendered in DEFAULT_COLOR (cyan).
   * Otherwise it uses the EMOTION_COLORS value for the dominant emotion.
   *
   * @param {Object} emotionObj — result object containing emotion float fields
   * @returns {string} — hex colour string
   */
  getDotColor(emotionObj) {
    const { emotion, score } = this.getDominantEmotion(emotionObj);
    if (score < NEUTRAL_THRESHOLD || !emotion) {
      return DEFAULT_COLOR;
    }
    return EMOTION_COLORS[emotion] ?? DEFAULT_COLOR;
  },

  // ─── WH.initPlot ──────────────────────────────────────────────────────────

  /**
   * Render (or re-render) the dominant-emotion scatter plot on a canvas.
   *
   * Each data point represents one analysed word, plotted at:
   *   x = wordSum  (letter-value sum — a proxy for "mass")
   *   y = sigma    (structural complexity / standard deviation)
   *
   * Two horizontal dashed threshold lines are drawn by a custom plugin:
   *   T1 @ y = 2.0 — "SOMATIC" boundary (green)
   *   T3 @ y = 5.0 — "STATE"   boundary (orange)
   *
   * @param {{
   *   canvas:  HTMLCanvasElement,
   *   data:    Array<{
   *     word: string, sigma: number, wordSum: number,
   *     anger: number, fear: number, anticipation: number,
   *     disgust: number, surprise: number, trust: number,
   *     joy: number, sadness: number
   *   }>,
   *   onHover?: function
   * }} config
   */
  initPlot({ canvas, data, onHover }) {
    // ── Destroy previous chart if one exists on this canvas ─────────────────
    if (_chartRegistry.has(canvas)) {
      _chartRegistry.get(canvas).destroy();
      _chartRegistry.delete(canvas);
    }

    // ── Build per-point colours ──────────────────────────────────────────────
    const bgColors     = data.map(r => WH.getDotColor(r));
    const borderColors = bgColors.slice(); // same hue, full opacity

    // ── Custom plugin: draw T1 and T3 sigma threshold lines ─────────────────
    const thresholdLinesPlugin = {
      id: 'whThresholdLines',

      /**
       * Draws horizontal dashed lines at T1 (y=2.0) and T3 (y=5.0) on the
       * chart canvas after all datasets have been painted.
       *
       * @param {Chart}  chart
       */
      afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales.y) return;

        /** Helper — draw one labelled dashed threshold line */
        function drawLine(yValue, color, label) {
          // Convert data-y to pixel-y
          const yPx = scales.y.getPixelForValue(yValue);

          // Skip if the threshold is outside the visible chart area
          if (yPx < chartArea.top || yPx > chartArea.bottom) return;

          ctx.save();
          ctx.strokeStyle   = color;
          ctx.lineWidth     = 1;
          ctx.setLineDash([6, 4]);
          ctx.globalAlpha   = 0.7;

          ctx.beginPath();
          ctx.moveTo(chartArea.left,  yPx);
          ctx.lineTo(chartArea.right, yPx);
          ctx.stroke();

          // Draw label at the right edge
          ctx.globalAlpha  = 1;
          ctx.fillStyle    = color;
          ctx.font         = `10px ${FONT_MONO}`;
          ctx.textAlign    = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(label, chartArea.right - 4, yPx - 2);

          ctx.restore();
        }

        // T1 — Somatic boundary
        drawLine(T1_SIGMA, '#22c55e', 'T1 SOMATIC');
        // T3 — State / complex boundary
        drawLine(T3_SIGMA, '#f97316', 'T3 STATE');
      },
    };

    // ── Assemble Chart.js dataset ─────────────────────────────────────────────
    const dataset = {
      label:            'CLUSTER WORDS',
      // Spread all result fields into each point so tooltips can access them
      data:             data.map(r => ({ x: r.wordSum, y: r.sigma, ...r })),
      backgroundColor:  bgColors,
      borderColor:      borderColors,
      borderWidth:      1,
      pointRadius:      8,
      pointHoverRadius: 12,
    };

    // ── Chart configuration ───────────────────────────────────────────────────
    const config = {
      type: 'scatter',

      data: { datasets: [dataset] },

      options: {
        responsive:          true,
        maintainAspectRatio: false,

        // Global font
        font: { family: FONT_MONO },

        // Canvas background colour (via plugin below)
        plugins: {
          legend: {
            display: false, // custom legend rendered in HTML
          },

          tooltip: {
            // Dark SIGINT-style tooltip
            backgroundColor: '#0e1118',
            borderColor:     '#00c8ff',
            borderWidth:     1,
            titleFont:       { family: FONT_MONO, size: 12, weight: '700' },
            bodyFont:        { family: FONT_MONO, size: 11 },
            titleColor:      '#00c8ff',
            bodyColor:       '#c8d8e8',
            padding:         12,
            displayColors:   false,

            callbacks: {
              /**
               * Tooltip title: show the word in upper case.
               * @param {Object[]} items
               * @returns {string}
               */
              title(items) {
                const raw = items[0]?.raw;
                return raw?.word?.toUpperCase() ?? '';
              },

              /**
               * Tooltip body: sigma, wordSum, then all 8 emotion percentages.
               * @param {Object} item
               * @returns {string[]}
               */
              label(item) {
                const r   = item.raw;
                const lines = [
                  `σ  (sigma)  : ${r.sigma?.toFixed(3) ?? '–'}`,
                  `Σ  (wordSum): ${r.wordSum ?? '–'}`,
                  '──────────────────',
                ];
                for (const key of EMOTION_KEYS) {
                  const val   = r[key] ?? 0;
                  const abbr  = EMOTION_ABBR[key];
                  const pct   = (val * 100).toFixed(1);
                  lines.push(`${abbr}  ${pct}%`);
                }
                return lines;
              },
            },
          },
        }, // end plugins

        scales: {
          x: {
            min:   0,
            title: {
              display:  true,
              text:     '◀ LOW MASS — WORD SUM (Σ) — HIGH MASS ▶',
              color:    '#00c8ff',
              font:     { family: FONT_MONO, size: 11 },
              padding:  { top: 8 },
            },
            grid: {
              color: 'rgba(0,200,255,0.08)',
            },
            ticks: {
              color: 'rgba(0,200,255,0.5)',
              font:  { family: FONT_MONO, size: 10 },
            },
          },

          y: {
            min:   0,
            title: {
              display:  true,
              text:     '▲ STRUCTURAL COMPLEXITY — σ (SIGMA) ▲',
              color:    '#00c8ff',
              font:     { family: FONT_MONO, size: 11 },
              padding:  { bottom: 8 },
            },
            grid: {
              color: 'rgba(0,200,255,0.06)',
            },
            ticks: {
              color: 'rgba(0,200,255,0.5)',
              font:  { family: FONT_MONO, size: 10 },
            },
          },
        }, // end scales

        // Hover callback forwarded to caller if provided
        onHover: onHover ?? null,
      }, // end options

      // Register the custom threshold-lines plugin
      plugins: [thresholdLinesPlugin],
    };

    // ── Apply canvas background colour via a one-off beforeDraw plugin ────────
    const bgPlugin = {
      id: 'whCanvasBg',
      beforeDraw(chart) {
        const { ctx, width, height } = chart;
        ctx.save();
        ctx.fillStyle = CHART_BG;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      },
    };
    config.plugins.push(bgPlugin);

    // ── Create chart and register it ──────────────────────────────────────────
    const chart = new Chart(canvas, config);
    _chartRegistry.set(canvas, chart);
  },

  // ─── WH.initTable ─────────────────────────────────────────────────────────

  /**
   * Render a colour-coded heatmap table of all results into `container`.
   *
   * Columns:
   *   WORD | σ | Σ | ANG | FEA | ANT | DIS | SUR | TRU | JOY | SAD
   *
   * Emotion cells use an rgba() background at opacity proportional to the
   * emotion score, creating a visual density heatmap.
   *
   * @param {{
   *   container: HTMLElement,
   *   data: Array<{
   *     word: string, sigma: number, wordSum: number,
   *     anger: number, fear: number, anticipation: number,
   *     disgust: number, surprise: number, trust: number,
   *     joy: number, sadness: number
   *   }>
   * }} config
   */
  initTable({ container, data }) {
    // Clear previous content
    container.innerHTML = '';

    // ── Outer wrapper (provides horizontal scroll on narrow screens) ──────────
    const wrapper = document.createElement('div');
    wrapper.className = 'ca-table-wrap';

    // ── Table element ─────────────────────────────────────────────────────────
    const table = document.createElement('table');
    table.className = 'ca-heatmap-table';

    // ── THEAD ─────────────────────────────────────────────────────────────────
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // First 3 columns: WORD, σ, Σ
    ['WORD', 'σ', 'Σ'].forEach(label => {
      const th = document.createElement('th');
      th.textContent  = label;
      th.style.textAlign = 'left';
      headerRow.appendChild(th);
    });

    // 8 emotion columns using abbreviated names
    for (const key of EMOTION_KEYS) {
      const th = document.createElement('th');
      th.textContent  = EMOTION_ABBR[key];
      th.style.textAlign = 'center';
      // Full emotion name as tooltip
      th.title = key.toUpperCase();
      headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // ── TBODY ─────────────────────────────────────────────────────────────────
    const tbody = document.createElement('tbody');

    for (const result of data) {
      const row = document.createElement('tr');

      // ── Cell 1: WORD ────────────────────────────────────────────────────────
      const wordTd = document.createElement('td');
      wordTd.textContent   = result.word.toUpperCase();
      wordTd.title         = result.word;
      wordTd.style.fontFamily = FONT_MONO;
      wordTd.style.color      = '#ffffff';
      wordTd.style.whiteSpace  = 'nowrap';
      row.appendChild(wordTd);

      // ── Cell 2: σ (sigma) ───────────────────────────────────────────────────
      const sigmaTd = document.createElement('td');
      sigmaTd.textContent = result.sigma.toFixed(2);
      // Colour-code by tier
      if (result.sigma <= T1_SIGMA) {
        sigmaTd.style.color = '#22c55e'; // somatic — green
      } else if (result.sigma <= T3_SIGMA) {
        sigmaTd.style.color = '#f97316'; // bridge  — orange
      } else {
        sigmaTd.style.color = '#ef4444'; // complex — red
      }
      sigmaTd.style.fontFamily = FONT_MONO;
      row.appendChild(sigmaTd);

      // ── Cell 3: Σ (wordSum) ─────────────────────────────────────────────────
      const sumTd = document.createElement('td');
      sumTd.textContent     = String(result.wordSum);
      sumTd.style.color     = '#ffffff';
      sumTd.style.fontFamily = FONT_MONO;
      row.appendChild(sumTd);

      // ── Cells 4–11: emotion intensity heatmap ────────────────────────────────
      EMOTION_KEYS.forEach((key, i) => {
        const value = result[key] ?? 0;
        const [r, g, b] = EMOTION_RGBA[key];

        // Background opacity blends from 0.05 (zero emotion) to 0.90 (peak)
        const alpha = (value * 0.85 + 0.05).toFixed(3);

        const td = document.createElement('td');
        td.innerHTML          = `<span class="ca-cell-val">${(value * 100).toFixed(0)}%</span>`;
        td.style.backgroundColor = `rgba(${r},${g},${b},${alpha})`;
        td.style.color           = 'rgba(255,255,255,0.92)';
        td.style.textAlign       = 'center';
        td.style.fontFamily      = FONT_MONO;
        td.style.fontSize        = '11px';
        td.title = `${EMOTION_KEYS[i].toUpperCase()}: ${(value * 100).toFixed(1)}%`;

        row.appendChild(td);
      });

      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);
  },

}; // end WH
