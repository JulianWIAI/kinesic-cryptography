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
import { CLUSTER_COLORS }         from './palette.js';

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

// Series colour palette — shared with waveform and diagnostic engine via palette.js

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
        const c = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
        return {
          label:                d.label,
          data:                 CATEGORIES.map(cat => +((d.radarValues[cat] ?? 0).toFixed(1))),
          backgroundColor:      c.fill,
          borderColor:          c.line,
          borderWidth:          2,
          pointBackgroundColor: c.line,
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

// ── Spectral Chart Singletons ─────────────────────────────
let globalEnvInstance   = null;
let microWaveInstance   = null;
let wordScatterInstance = null;

/**
 * Destroys all three spectral chart instances.
 * Call when the corpus textarea is cleared or the spectral panel resets.
 */
export function destroySpectralCharts() {
  if (globalEnvInstance)   { globalEnvInstance.destroy();   globalEnvInstance   = null; }
  if (microWaveInstance)   { microWaveInstance.destroy();   microWaveInstance   = null; }
  if (wordScatterInstance) { wordScatterInstance.destroy(); wordScatterInstance = null; }
}

// ── Cluster Scatter Singleton ──────────────────────────────
let clusterScatterInstance = null;

/** Destroys the cluster scatter chart instance. */
export function destroyClusterChart() {
  if (clusterScatterInstance) { clusterScatterInstance.destroy(); clusterScatterInstance = null; }
}

// ── Cluster Bar Chart (Balkendiagramm) ───────────────────
let clusterBarInstance = null;

/** Destroys the cluster bar chart instance. */
export function destroyClusterBarChart() {
  if (clusterBarInstance) { clusterBarInstance.destroy(); clusterBarInstance = null; }
}

/**
 * Renders a horizontal Balkendiagramm comparing Word Sum (Σ) per word.
 * One coloured bar per word — colors aligned with CLUSTER_COLORS palette.
 * Tooltip shows Σ, σ, and Tier.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ word: string, wordSum: number, sigma: number }>} entries
 */
export function renderClusterBarChart(canvas, entries) {
  if (!window.Chart) { console.warn('[charts] Chart.js not loaded'); return; }
  destroyClusterBarChart();
  if (!entries || entries.length === 0) return;

  // Adaptive height: 38px per word, bounded to [120, 480]
  const parent = canvas.parentElement;
  if (parent) parent.style.height = Math.min(480, Math.max(120, entries.length * 38)) + 'px';

  const getTier = s => s < 2.0 ? 'T1' : s < 5.0 ? 'T2' : 'T3';

  clusterBarInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels:   entries.map(e => e.word.toUpperCase()),
      datasets: [{
        label:           'Word Sum Σ',
        data:            entries.map(e => e.wordSum),
        backgroundColor: entries.map((_, i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length].fill),
        borderColor:     entries.map((_, i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length].line),
        borderWidth:     1.5,
        borderRadius:    3,
      }],
    },
    options: {
      indexAxis:           'y',
      responsive:          true,
      maintainAspectRatio: false,
      animation:           false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const e = entries[ctx.dataIndex];
              return [`Σ = ${e.wordSum}`, `σ = ${e.sigma.toFixed(2)}`, `Tier: ${getTier(e.sigma)}`];
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true, text: 'Word Sum (Σ)',
            color: '#5a6a82', font: { family: 'Space Mono, monospace', size: 10 },
          },
          ticks: { color: '#5a6a82', font: { size: 10 } },
          grid:  { color: 'rgba(148,163,184,0.08)' },
          min:   0,
        },
        y: {
          ticks: {
            color: '#8899aa',
            font:  { family: 'Space Mono, monospace', size: 10, weight: 'bold' },
          },
          grid: { display: false },
        },
      },
    },
  });
}

// ── Shared oscilloscope Chart.js base options ─────────────

function oscBaseOptions() {
  return {
    responsive:          true,
    maintainAspectRatio: false,
    animation:           false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: items => `Position ${items[0].parsed.x}`,
          label: ctx   => `Value: ${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        type:   'linear',
        ticks:  { display: false },
        grid:   { display: false },
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
  };
}

// Oscilloscope colour palette — uses shared CLUSTER_COLORS from palette.js

/**
 * Renders or live-updates Chart A — Global Envelope.
 * Accepts one or two datasets (single mode / comparison mode).
 * Uses smooth bezier (tension: 0.4) for the macro signal contour.
 * Updates in-place when dataset count is unchanged; rebuilds otherwise.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ label: string, data: number[] }>} datasets
 *   Each entry is one input stream: { label, data: 100-float envelope }
 */
export function renderGlobalEnvelopeChart(canvas, datasets) {
  if (!window.Chart) { console.warn('[charts] Chart.js not loaded'); return; }

  // Dataset count changed (e.g. single → comparison) → rebuild
  if (globalEnvInstance && globalEnvInstance.data.datasets.length !== datasets.length) {
    globalEnvInstance.destroy();
    globalEnvInstance = null;
  }

  if (globalEnvInstance) {
    datasets.forEach((ds, i) => {
      globalEnvInstance.data.datasets[i].label = ds.label;
      globalEnvInstance.data.datasets[i].data  = ds.data.map((v, idx) => ({ x: idx, y: v }));
    });
    globalEnvInstance.update('none');
    return;
  }

  const ctx    = canvas.getContext('2d');
  const height = canvas.parentElement?.offsetHeight || 160;

  const chartDatasets = datasets.map((ds, i) => {
    const s        = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, s.gradStart);
    gradient.addColorStop(1, s.gradEnd);
    return {
      label:                ds.label,
      data:                 ds.data.map((v, idx) => ({ x: idx, y: v })),
      borderColor:          s.line,
      backgroundColor:      gradient,
      borderWidth:          2,
      tension:              0.4,
      fill:                 true,
      pointRadius:          0,
      pointHoverRadius:     4,
      pointBackgroundColor: s.line,
    };
  });

  const opts = oscBaseOptions();
  opts.plugins.legend = {
    display: datasets.length > 1,
    labels:  { color: '#5a6a82', font: { family: 'Space Mono, monospace', size: 10 } },
  };

  globalEnvInstance = new window.Chart(canvas, {
    type: 'line',
    data: { datasets: chartDatasets },
    options: opts,
  });
}

/**
 * Renders or live-updates Chart B — Micro Wavelength.
 * Accepts one or two datasets (single mode / comparison mode).
 * Uses zero tension (step-like) to expose high-frequency jaggedness.
 * Updates in-place when dataset count is unchanged; rebuilds otherwise.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ label: string, data: number[] }>} datasets
 *   Each entry is one input stream: { label, data: up-to-256 letter values }
 */
export function renderMicroWaveChart(canvas, datasets) {
  if (!window.Chart) { console.warn('[charts] Chart.js not loaded'); return; }

  // Dataset count changed → rebuild
  if (microWaveInstance && microWaveInstance.data.datasets.length !== datasets.length) {
    microWaveInstance.destroy();
    microWaveInstance = null;
  }

  if (microWaveInstance) {
    datasets.forEach((ds, i) => {
      microWaveInstance.data.datasets[i].label = ds.label;
      microWaveInstance.data.datasets[i].data  = ds.data.map((v, idx) => ({ x: idx + 1, y: v }));
    });
    microWaveInstance.update('none');
    return;
  }

  const ctx    = canvas.getContext('2d');
  const height = canvas.parentElement?.offsetHeight || 160;

  const chartDatasets = datasets.map((ds, i) => {
    const s        = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, s.gradStart);
    gradient.addColorStop(1, s.gradEnd);
    return {
      label:                ds.label,
      data:                 ds.data.map((v, idx) => ({ x: idx + 1, y: v })),
      borderColor:          s.line,
      backgroundColor:      gradient,
      borderWidth:          1.5,
      tension:              0,
      fill:                 true,
      pointRadius:          0,
      pointHoverRadius:     4,
      pointBackgroundColor: s.line,
    };
  });

  const opts = oscBaseOptions();
  opts.plugins.legend = {
    display: datasets.length > 1,
    labels:  { color: '#5a6a82', font: { family: 'Space Mono, monospace', size: 10 } },
  };

  microWaveInstance = new window.Chart(canvas, {
    type: 'line',
    data: { datasets: chartDatasets },
    options: opts,
  });
}

/**
 * Renders the Complexity Scatter — one point per word at [WordSum, σ].
 *
 * Colour encoding by complexity tier:
 *   T1 (σ < 2.0) — green   · T2 (2.0 ≤ σ < 5.0) — orange   · T3 (σ ≥ 5.0) — red
 *
 * Draws dashed threshold lines at σ = 2.0 (T1/T2 boundary) and
 * σ = 5.0 (T2/T3 boundary) via a custom inline Chart.js plugin —
 * no external annotation package required.
 *
 * Downsamples automatically to ≤ 1 000 points for very large corpora.
 *
 * @param {HTMLCanvasElement}      canvas
 * @param {Array<[number,number]>} scatterData — [WordSum, σ] pairs
 */
export function renderWordScatterChart(canvas, scatterData) {
  if (!window.Chart) { console.warn('[charts] Chart.js not loaded'); return; }
  if (wordScatterInstance) { wordScatterInstance.destroy(); wordScatterInstance = null; }

  const getTier = sigma => sigma < 2.0 ? 1 : sigma < 5.0 ? 2 : 3;
  const TIER_BG = {
    1: 'rgba( 34, 211, 160, 0.75)',
    2: 'rgba(245, 158,  11, 0.75)',
    3: 'rgba(239,  68,  68, 0.75)',
  };
  const TIER_LINE = {
    1: 'rgba( 34, 211, 160, 1)',
    2: 'rgba(245, 158,  11, 1)',
    3: 'rgba(239,  68,  68, 1)',
  };

  // Downsample to 1 000 points for performance on large corpora
  const step   = scatterData.length > 1000
    ? Math.ceil(scatterData.length / 1000) : 1;
  const sample = scatterData.filter((_, i) => i % step === 0);

  const points = sample.map(([sum, sigma]) => ({ x: sum, y: sigma }));
  const bgs    = sample.map(([, sigma]) => TIER_BG[getTier(sigma)]);
  const lines  = sample.map(([, sigma]) => TIER_LINE[getTier(sigma)]);
  const maxSigma = Math.max(6, ...sample.map(([, s]) => s));

  // Inline plugin — draws dashed σ threshold lines without the annotation plugin
  const thresholdPlugin = {
    id: 'waveThresholds',
    afterDraw(chart) {
      const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
      const drawLine = (sigma, color, label) => {
        const yPx = y.getPixelForValue(sigma);
        if (yPx < top || yPx > bottom) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1;
        ctx.setLineDash([5, 4]);
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(left,  yPx);
        ctx.lineTo(right, yPx);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.fillStyle   = color;
        ctx.font        = '9px "Space Mono", monospace';
        ctx.textAlign   = 'left';
        ctx.fillText(label, left + 4, yPx - 3);
        ctx.restore();
      };
      drawLine(2.0, 'rgba( 34, 197,  94, 0.9)', 'T1/T2  σ = 2.0');
      drawLine(5.0, 'rgba(239,  68,  68, 0.9)', 'T2/T3  σ = 5.0');
    },
  };

  wordScatterInstance = new window.Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label:            'Words',
        data:             points,
        backgroundColor:  bgs,
        borderColor:      lines,
        pointRadius:      sample.length > 200 ? 3 : 6,
        pointHoverRadius: 9,
        borderWidth:      1,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const t = getTier(ctx.raw.y);
              return `Sum: ${ctx.raw.x}  σ: ${ctx.raw.y.toFixed(2)}  [Tier ${t}]`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true, text: 'Word Sum (Σ)',
            color: '#5a6a82', font: { family: 'Space Mono, monospace', size: 10 },
          },
          ticks:  { color: '#5a6a82', font: { size: 10 } },
          grid:   { color: 'rgba(148, 163, 184, 0.08)' },
          min:    0,
        },
        y: {
          title: {
            display: true, text: 'σ (Std. Deviation)',
            color: '#5a6a82', font: { family: 'Space Mono, monospace', size: 10 },
          },
          ticks:  { color: '#5a6a82', font: { size: 10 } },
          grid:   { color: 'rgba(148, 163, 184, 0.08)' },
          min:    0,
          max:    Math.ceil(maxSigma) + 1,
        },
      },
    },
    plugins: [thresholdPlugin],
  });
}

/**
 * Renders the Semantic Cluster Scatter — one point per word at [WordSum, σ].
 * Points are coloured by complexity tier and labelled with the word string.
 * Custom afterDraw plugin draws word labels next to each dot.
 * Threshold lines drawn at σ = 2.0 and σ = 5.0.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ word: string, wordSum: number, sigma: number }>} wordData
 */
export function renderClusterScatterChart(canvas, wordData) {
  if (!window.Chart) { console.warn('[charts] Chart.js not loaded'); return; }
  if (clusterScatterInstance) { clusterScatterInstance.destroy(); clusterScatterInstance = null; }
  if (!wordData || wordData.length === 0) return;

  const getTier = sigma => sigma < 2.0 ? 1 : sigma < 5.0 ? 2 : 3;
  const TIER_BG = {
    1: 'rgba( 34, 211, 160, 0.80)',
    2: 'rgba(245, 158,  11, 0.80)',
    3: 'rgba(239,  68,  68, 0.80)',
  };
  const TIER_LINE = {
    1: 'rgba( 34, 211, 160, 1)',
    2: 'rgba(245, 158,  11, 1)',
    3: 'rgba(239,  68,  68, 1)',
  };

  const points = wordData.map(({ word, wordSum, sigma }) => ({
    x: wordSum,
    y: sigma,
    word,
  }));
  const bgs   = wordData.map(({ sigma }) => TIER_BG[getTier(sigma)]);
  const lines = wordData.map(({ sigma }) => TIER_LINE[getTier(sigma)]);
  const maxSigma = Math.max(6, ...wordData.map(d => d.sigma));

  // Inline plugin — draws σ threshold lines and word labels next to dots
  const clusterPlugin = {
    id: 'clusterLabels',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: { left, right, top, bottom }, scales: { x, y } } = chart;

      // Draw threshold lines
      const drawThreshold = (sigma, color, label) => {
        const yPx = y.getPixelForValue(sigma);
        if (yPx < top || yPx > bottom) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1;
        ctx.setLineDash([5, 4]);
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(left,  yPx);
        ctx.lineTo(right, yPx);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.fillStyle   = color;
        ctx.font        = '9px "Space Mono", monospace';
        ctx.textAlign   = 'left';
        ctx.fillText(label, left + 4, yPx - 3);
        ctx.restore();
      };
      drawThreshold(2.0, 'rgba( 34, 197,  94, 0.9)', 'T1/T2  σ = 2.0');
      drawThreshold(5.0, 'rgba(239,  68,  68, 0.9)', 'T2/T3  σ = 5.0');

      // Draw word labels next to each point
      const meta = chart.getDatasetMeta(0);
      ctx.save();
      ctx.font      = '10px "Space Mono", monospace';
      ctx.textAlign = 'left';
      meta.data.forEach((el, i) => {
        const pt = chart.data.datasets[0].data[i];
        if (!pt || !pt.word) return;
        const px = el.x;
        const py = el.y;
        const tier  = getTier(pt.y);
        ctx.fillStyle = TIER_LINE[tier];
        ctx.fillText(pt.word.toUpperCase(), px + 7, py + 4);
      });
      ctx.restore();
    },
  };

  clusterScatterInstance = new window.Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label:            'Cluster',
        data:             points,
        backgroundColor:  bgs,
        borderColor:      lines,
        pointRadius:      7,
        pointHoverRadius: 11,
        borderWidth:      1.5,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const { word, x, y: sigma } = ctx.raw;
              const tier = getTier(sigma);
              return `${word.toUpperCase()} — Σ:${x}  σ:${sigma.toFixed(2)}  [T${tier}]`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true, text: 'Word Sum (Σ)',
            color: '#5a6a82', font: { family: 'Space Mono, monospace', size: 10 },
          },
          ticks:  { color: '#5a6a82', font: { size: 10 } },
          grid:   { color: 'rgba(148,163,184,0.08)' },
          min:    0,
        },
        y: {
          title: {
            display: true, text: 'σ (Std. Deviation)',
            color: '#5a6a82', font: { family: 'Space Mono, monospace', size: 10 },
          },
          ticks:  { color: '#5a6a82', font: { size: 10 } },
          grid:   { color: 'rgba(148,163,184,0.08)' },
          min:    0,
          max:    Math.ceil(maxSigma) + 1,
        },
      },
    },
    plugins: [clusterPlugin],
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
