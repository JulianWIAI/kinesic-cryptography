/**
 * Charts Module
 *
 * Manages Chart.js instances for the Psycholinguistic Diagnostic Engine.
 *
 * Provides two chart types:
 *   1. Radar Chart  — visualises the archetypal category profile (% per category).
 *   2. Scatter Plot — maps letter values by position; points coloured by category.
 *
 * Requires Chart.js v4 to be loaded globally (window.Chart) via a CDN <script> tag
 * in index.html before this module runs.
 */

import { CATEGORIES, LETTER_MAP } from './letterMap.js';

// ── Category colour palette ────────────────────────────────
const CAT_BG = {
  Origin:    'rgba(251, 191,  36, 0.85)',
  Kinetic:   'rgba(239,  68,  68, 0.85)',
  Sovereign: 'rgba( 59, 130, 246, 0.85)',
  Liminal:   'rgba(168,  85, 247, 0.85)',
  Resonant:  'rgba( 34, 197,  94, 0.85)',
};

const CAT_BORDER = {
  Origin:    'rgba(251, 191,  36, 1)',
  Kinetic:   'rgba(239,  68,  68, 1)',
  Sovereign: 'rgba( 59, 130, 246, 1)',
  Liminal:   'rgba(168,  85, 247, 1)',
  Resonant:  'rgba( 34, 197,  94, 1)',
};

// Two series colours for comparison mode (Word A / Word B)
const SERIES_COLORS = [
  { bg: 'rgba( 59, 130, 246, 0.18)', border: 'rgba( 59, 130, 246, 1)' },
  { bg: 'rgba(239,  68,  68, 0.18)', border: 'rgba(239,  68,  68, 1)' },
];

// Singleton chart instances — destroyed before each re-render
let radarInstance   = null;
let scatterInstance = null;

/**
 * Destroys both chart instances to allow canvas re-use.
 * Must be called before renderRadarChart / renderScatterChart.
 */
export function destroyCharts() {
  if (radarInstance)   { radarInstance.destroy();   radarInstance   = null; }
  if (scatterInstance) { scatterInstance.destroy();  scatterInstance = null; }
}

/**
 * Renders a radar chart showing the categorical profile of one or two words.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ label: string, radarValues: Object<string,number> }[]} datasets
 *   Each entry represents one word.
 */
export function renderRadarChart(canvas, datasets) {
  if (!window.Chart) { console.warn('[charts] Chart.js not loaded'); return; }
  if (radarInstance) { radarInstance.destroy(); radarInstance = null; }

  radarInstance = new window.Chart(canvas, {
    type: 'radar',
    data: {
      labels: CATEGORIES,
      datasets: datasets.map((d, i) => {
        const c = SERIES_COLORS[i % SERIES_COLORS.length];
        return {
          label:                d.label,
          data:                 CATEGORIES.map(cat => +((d.radarValues[cat] ?? 0).toFixed(1))),
          backgroundColor:      c.bg,
          borderColor:          c.border,
          borderWidth:          2,
          pointBackgroundColor: c.border,
          pointRadius:          4,
          pointHoverRadius:     6,
        };
      }),
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#8899aa', font: { family: 'Space Mono, monospace', size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}%`,
          },
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            color:           '#5a6a82',
            backdropColor:   'transparent',
            stepSize:        20,
            font:            { family: 'Space Mono, monospace', size: 9 },
          },
          grid:        { color: 'rgba(148,163,184,0.12)' },
          angleLines:  { color: 'rgba(148,163,184,0.12)' },
          pointLabels: {
            color: '#8899aa',
            font:  { family: 'Space Mono, monospace', size: 10 },
          },
        },
      },
    },
  });
}

/**
 * Renders a scatter plot of letter values by position.
 * Each data point is coloured by its archetypal category.
 * In comparison mode two datasets are plotted side by side.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ label: string, word: string }[]} wordSets
 */
export function renderScatterChart(canvas, wordSets) {
  if (!window.Chart) { console.warn('[charts] Chart.js not loaded'); return; }
  if (scatterInstance) { scatterInstance.destroy(); scatterInstance = null; }

  const chartDatasets = wordSets.map(ws => {
    const chars = [...ws.word.toLowerCase()];
    const points = chars
      .map((c, i) => ({ c, pos: i + 1, ...LETTER_MAP[c] }))
      .filter(p => p.value !== undefined);

    return {
      label:           ws.label,
      data:            points.map(p => ({
        x:        p.pos,
        y:        p.value,
        category: p.category,
        char:     p.c.toUpperCase(),
      })),
      // Per-point colours based on category
      backgroundColor: points.map(p => CAT_BG[p.category]    ?? 'rgba(148,163,184,0.7)'),
      borderColor:     points.map(p => CAT_BORDER[p.category] ?? 'rgba(148,163,184,1)'),
      pointRadius:     8,
      pointHoverRadius: 11,
      borderWidth:     1.5,
    };
  });

  scatterInstance = new window.Chart(canvas, {
    type: 'scatter',
    data: { datasets: chartDatasets },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#8899aa', font: { family: 'Space Mono, monospace', size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const { char, x, y, category } = ctx.raw;
              return `${char} — pos ${x}, value ${y} [${category}]`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text:    'Letter Position',
            color:   '#5a6a82',
            font:    { family: 'Space Mono, monospace', size: 10 },
          },
          ticks: { color: '#5a6a82', stepSize: 1, font: { size: 10 } },
          grid:  { color: 'rgba(148,163,184,0.08)' },
          min:   0,
        },
        y: {
          title: {
            display: true,
            text:    'Letter Value',
            color:   '#5a6a82',
            font:    { family: 'Space Mono, monospace', size: 10 },
          },
          ticks: { color: '#5a6a82', font: { size: 10 } },
          grid:  { color: 'rgba(148,163,184,0.08)' },
          min:   0,
          max:   27,
        },
      },
    },
  });
}
