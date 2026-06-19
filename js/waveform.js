/**
 * Waveform Module — Wavelength Telemetry & Linguistic Waveform Visualisation
 *
 * Converts the current input text into an ordered array of letter values
 * (the "Wavelength Telemetry" array) and renders a real-time line chart
 * that behaves like an oscilloscope / frequency monitor.
 *
 * Chart behaviour:
 *   — Updates instantly on every keystroke (no animation)
 *   — Smooth bezier curves (tension: 0.4) for a continuous waveform feel
 *   — X-axis grid hidden → clean oscilloscope readout
 *   — Gradient fill under the curve
 *   — Single-mode shows one waveform; comparison mode overlays two
 *
 * Requires Chart.js v4 loaded as a global (window.Chart) via CDN.
 */

import { LETTER_MAP } from './letterMap.js';

// Singleton Chart.js instance — updated in place on each keystroke
let waveformInstance = null;

// ── Public API ────────────────────────────────────────────

/**
 * Extracts the ordered Wavelength Telemetry array from raw input text.
 * Only letters present in LETTER_MAP contribute a value; digits and
 * unsupported characters are silently skipped.
 *
 * @param {string} text — raw user input (any case, umlauts supported)
 * @returns {number[]}  — ordered array of letter values e.g. [23,9,18,20,19,3,8,1,6,20]
 */
export function extractTelemetry(text) {
  return [...text.toLowerCase()]
    .map(c => LETTER_MAP[c]?.value)
    .filter(v => v !== undefined);
}

/**
 * Destroys the current waveform chart instance.
 * Call when navigating away or resetting the view.
 */
export function destroyWaveform() {
  if (waveformInstance) {
    waveformInstance.destroy();
    waveformInstance = null;
  }
}

/**
 * Updates (or creates) the waveform chart for one or two input words.
 * Designed to be called on every `input` event for real-time feedback.
 *
 * @param {HTMLCanvasElement}              canvas
 * @param {{ label: string, text: string }[]} datasets
 *   Each entry is one input stream; typically 1 (single mode) or 2 (comparison).
 * @returns {boolean} — true if the panel should be visible, false if all inputs are empty
 */
export function updateWaveform(canvas, datasets) {
  if (!window.Chart) { console.warn('[waveform] Chart.js not loaded'); return false; }

  // Build telemetry for each dataset
  const telemetry = datasets.map(d => ({
    label:  d.label,
    values: extractTelemetry(d.text),
  }));

  // Nothing to render if all inputs have no letters
  const hasData = telemetry.some(t => t.values.length > 0);
  if (!hasData) {
    destroyWaveform();
    return false;
  }

  if (waveformInstance) {
    // Dataset count changed (e.g. toggling comparison mode mid-type) → rebuild
    if (waveformInstance.data.datasets.length !== telemetry.length) {
      destroyWaveform();
      return buildChart(canvas, telemetry);
    }

    // Fast in-place update — no destroy, no animation
    waveformInstance.data.datasets.forEach((ds, i) => {
      ds.label = telemetry[i].label;
      ds.data  = telemetry[i].values.map((v, pos) => ({ x: pos + 1, y: v }));
    });
    waveformInstance.update('none');
    return true;
  }

  return buildChart(canvas, telemetry);
}

// ── Internal ──────────────────────────────────────────────

/**
 * Builds a brand-new Chart.js line chart for the given telemetry sets.
 *
 * @param {HTMLCanvasElement}                      canvas
 * @param {{ label: string, values: number[] }[]} telemetry
 * @returns {boolean}
 */
function buildChart(canvas, telemetry) {
  if (!window.Chart) return false;

  const ctx    = canvas.getContext('2d');
  const height = canvas.parentElement?.offsetHeight || 180;

  // Series colour palette: accent cyan (face stream) + violet (body stream)
  const SERIES = [
    { line: '#00c8ff', gradientStart: 'rgba(0, 200, 255, 0.22)', gradientEnd: 'rgba(0, 200, 255, 0)' },
    { line: '#a78bfa', gradientStart: 'rgba(167, 139, 250, 0.20)', gradientEnd: 'rgba(167, 139, 250, 0)' },
  ];

  const chartDatasets = telemetry.map((t, i) => {
    const s        = SERIES[i % SERIES.length];
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, s.gradientStart);
    gradient.addColorStop(1, s.gradientEnd);

    return {
      label:              t.label,
      data:               t.values.map((v, pos) => ({ x: pos + 1, y: v })),
      borderColor:        s.line,
      backgroundColor:    gradient,
      borderWidth:        2,
      tension:            0.4,   // smooth bezier — oscilloscope feel
      fill:               true,
      pointRadius:        t.values.length < 20 ? 3 : 0, // hide dots on long strings
      pointHoverRadius:   6,
      pointBackgroundColor: s.line,
      pointBorderColor:   'transparent',
    };
  });

  waveformInstance = new window.Chart(canvas, {
    type: 'line',
    data: { datasets: chartDatasets },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           false,   // disable all animation for true real-time feel
      plugins: {
        legend: {
          display: telemetry.length > 1,  // only show legend in comparison mode
          labels:  { color: '#5a6a82', font: { family: 'Space Mono, monospace', size: 10 } },
        },
        tooltip: {
          callbacks: {
            title: items => `Position ${items[0].parsed.x}`,
            label: ctx  => `${ctx.dataset.label}: value ${ctx.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          type:   'linear',
          title:  { display: false },
          ticks:  { display: false },
          grid:   { display: false },       // ← hidden — clean oscilloscope readout
          border: { display: false },
        },
        y: {
          min:    0,
          max:    27,
          ticks:  {
            color:     '#2e3b50',
            font:      { family: 'Space Mono, monospace', size: 9 },
            stepSize:  5,
            callback:  v => v === 0 ? '' : v,
          },
          grid:   { color: 'rgba(30, 37, 53, 0.8)' },
          border: { display: false },
        },
      },
    },
  });

  return true;
}
