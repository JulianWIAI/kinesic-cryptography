/**
 * comparisonLayout.js — Comparison Grid Renderer
 *
 * Renders ComparisonResult[] (from comparisonEngine.js) into the
 * comparison.html page as a side-by-side language grid.
 *
 * Each language column contains:
 *   - Translation header card  (with a speak button)
 *   - Threat Matrix scatter (Power vs Danger)
 *   - PDS bars (Power / Danger / Structure)
 *   - Emotion Radar (8-D NRC emotions)
 *   - Oscilloscope (letter value waveform)
 *   - FFT Spectrum
 *
 * Chart.js is consumed from window.Chart (UMD script tag, same as other pages).
 *
 * Exported API:
 *   renderComparison(results, gridEl)  → void
 *   destroyComparison()                → void
 */

import { speak, stopSpeaking, ttsSupported } from './tts.js';

// SIGINT palette (matches existing pages)
const C = {
  bg:        '#07090f',
  surface:   '#0e1118',
  accent:    '#00c8ff',
  danger:    '#ff2222',
  success:   '#22d3a0',
  warning:   '#f59e0b',
  muted:     '#5a6a82',
  text:      '#d0d8e8',
  gridX:     'rgba(0,200,255,0.08)',
  gridY:     'rgba(255,34,34,0.08)',
  font:      "'Space Mono','Courier New',monospace",
};

// Emotion colours (8 dimensions)
const E_COLORS = {
  anger:        '#ff4444',
  fear:         '#ff8800',
  anticipation: '#ffcc00',
  disgust:      '#88cc00',
  surprise:     '#00ccff',
  trust:        '#00ff88',
  joy:          '#ff66cc',
  sadness:      '#6688ff',
};

const EMOTION_KEYS = ['anger','fear','anticipation','disgust','surprise','trust','joy','sadness'];

// Active Chart.js instances — keyed by canvas id
const _charts = new Map();

function _destroyChart(id) {
  const c = _charts.get(id);
  if (c) { c.destroy(); _charts.delete(id); }
}

function _mkCanvas(id, cssClass = '') {
  const c = document.createElement('canvas');
  c.id = id;
  if (cssClass) c.className = cssClass;
  return c;
}

// ── Chart constructors ────────────────────────────────────────────────────────

function _renderThreatMatrix(canvasId, pdsWords) {
  _destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const normal = pdsWords.filter(w => !(w.power >= 0.65 && w.danger >= 0.65));
  const apex   = pdsWords.filter(w =>   w.power >= 0.65 && w.danger >= 0.65);

  const Chart = window.Chart;
  _charts.set(canvasId, new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Words',
          data: normal.map(w => ({ x: w.power, y: w.danger, _w: w.word })),
          backgroundColor: C.accent,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Apex',
          data: apex.map(w => ({ x: w.power, y: w.danger, _w: w.word })),
          backgroundColor: C.danger,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = ctx.raw;
              return `${d._w}  P:${(d.x*100).toFixed(0)} D:${(d.y*100).toFixed(0)}`;
            },
          },
        },
      },
      scales: {
        x: {
          min: 0, max: 1,
          title: { display: true, text: 'POWER', color: C.muted, font: { family: C.font, size: 9 } },
          grid: { color: C.gridX },
          ticks: { color: C.muted, font: { family: C.font, size: 8 } },
        },
        y: {
          min: 0, max: 1,
          title: { display: true, text: 'DANGER', color: C.muted, font: { family: C.font, size: 9 } },
          grid: { color: C.gridY },
          ticks: { color: C.muted, font: { family: C.font, size: 8 } },
        },
      },
    },
  }));
}

function _renderPdsBars(canvasId, aggregate) {
  _destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const { power = 0, danger = 0, structure = 0 } = aggregate || {};
  const Chart = window.Chart;

  _charts.set(canvasId, new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['POWER', 'DANGER', 'STRUCTURE'],
      datasets: [{
        data: [power, danger, structure],
        backgroundColor: [C.accent, C.danger, C.success],
        borderWidth: 0,
        borderRadius: 2,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          min: 0, max: 1,
          grid: { color: C.gridX },
          ticks: { color: C.muted, font: { family: C.font, size: 8 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: C.text, font: { family: C.font, size: 9 } },
        },
      },
    },
  }));
}

function _renderEmotionRadar(canvasId, aggregate) {
  _destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const Chart = window.Chart;
  const values = EMOTION_KEYS.map(k => (aggregate?.[k] || 0) * 100);
  const hasData = values.some(v => v > 0);

  _charts.set(canvasId, new Chart(ctx, {
    type: 'radar',
    data: {
      labels: EMOTION_KEYS.map(k => k.toUpperCase()),
      datasets: [{
        data: hasData ? values : EMOTION_KEYS.map(() => 0),
        backgroundColor: 'rgba(0,200,255,0.12)',
        borderColor: C.accent,
        borderWidth: 1.5,
        pointBackgroundColor: C.accent,
        pointRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          backgroundColor: C.surface,
          grid:       { color: 'rgba(0,200,255,0.1)' },
          angleLines: { color: 'rgba(0,200,255,0.1)' },
          pointLabels: { color: C.muted, font: { family: C.font, size: 8 } },
          ticks: { display: false },
        },
      },
    },
  }));
}

function _renderOscilloscope(canvasId, microWave) {
  _destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const Chart = window.Chart;
  const data    = (microWave && microWave.length) ? microWave : [0];
  const hasData = data.length > 1 && data.some(v => v !== 0);

  _charts.set(canvasId, new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{
        data,
        borderColor: C.accent,
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
        tension: 0.1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          // If no data, force a 0–1 range so the chart doesn't show -1/+1
          min: hasData ? undefined : 0,
          max: hasData ? undefined : 1,
          grid: { color: C.gridX },
          ticks: { color: C.muted, font: { family: C.font, size: 8 } },
        },
      },
    },
  }));
}

function _renderFFT(canvasId, powerSpectrum) {
  _destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const Chart = window.Chart;

  // powerSpectrum is Array<{bin, frequency, power}> from runSpectralAnalysis.
  // Skip DC bin (index 0) and take next 32 bins; normalize to [0,1].
  const bins  = Array.isArray(powerSpectrum) ? powerSpectrum.slice(1, 33) : [];
  const raw   = bins.map(b => (typeof b === 'object' ? (b.power ?? 0) : b));
  const maxP  = Math.max(...raw, 1);
  const vals  = raw.map(p => p / maxP);

  _charts.set(canvasId, new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins.map(b => b.bin ?? ''),
      datasets: [{
        data: vals,
        backgroundColor: 'rgba(0,200,255,0.5)',
        borderColor:     C.accent,
        borderWidth:     1,
        borderRadius:    1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          min: 0, max: 1,
          grid: { color: C.gridX },
          ticks: { color: C.muted, font: { family: C.font, size: 8 } },
        },
      },
    },
  }));
}

// ── Column builder ────────────────────────────────────────────────────────────

function _buildColumn(result, colIdx) {
  const prefix = `cmp-${colIdx}`;
  const col = document.createElement('div');
  col.className = 'cmp-col' + (result.isSource ? ' cmp-col--source' : '');
  col.dataset.lang = result.lang;

  // Header card
  const hdr = document.createElement('div');
  hdr.className = 'cmp-lang-header';
  hdr.innerHTML = `
    <span class="cmp-lang-code">${result.lang.toUpperCase()}</span>
    <span class="cmp-lang-label">${result.label}</span>
    ${result.isSource ? '<span class="cmp-source-badge">INPUT</span>' : ''}
    <div class="cmp-word">${result.translatedText || '—'}</div>
    ${result.latinizedText && result.latinizedText !== result.translatedText
      ? `<div class="cmp-word-latin">${result.latinizedText}</div>` : ''}
  `;

  // Speak button — only shown if Web Speech API is available.
  if (ttsSupported && result.translatedText && !result.translatedText.startsWith('[')) {
    const speakBtn = document.createElement('button');
    speakBtn.className = 'cmp-speak-btn';
    speakBtn.type = 'button';
    speakBtn.title = `Speak in ${result.label}`;
    speakBtn.setAttribute('aria-label', `Speak "${result.translatedText}" in ${result.label}`);
    speakBtn.innerHTML = '&#9654;'; // play triangle

    let _isSpeaking = false;

    speakBtn.addEventListener('click', () => {
      if (_isSpeaking) {
        // Stop current speech when button is clicked during playback.
        stopSpeaking();
        _isSpeaking = false;
        speakBtn.innerHTML = '&#9654;';
        speakBtn.classList.remove('cmp-speak-btn--active');
        return;
      }

      _isSpeaking = true;
      speakBtn.innerHTML = '&#9646;'; // stop square
      speakBtn.classList.add('cmp-speak-btn--active');

      speak(
        result.translatedText,
        result.lang,
        () => { /* onStart — button already updated above */ },
        () => {
          // Speech ended naturally or was cancelled.
          _isSpeaking = false;
          speakBtn.innerHTML = '&#9654;';
          speakBtn.classList.remove('cmp-speak-btn--active');
        }
      );
    });

    hdr.appendChild(speakBtn);
  }

  col.appendChild(hdr);

  // Word stats
  if (result.wordStats) {
    const ws = result.wordStats;
    const stats = document.createElement('div');
    stats.className = 'cmp-stats';
    stats.innerHTML = `
      <span>Σ <strong>${ws.wordSum}</strong></span>
      <span>σ <strong>${ws.sigma?.toFixed(2) ?? '—'}</strong></span>
      <span>Tier <strong>${ws.tier ?? '—'}</strong></span>
    `;
    col.appendChild(stats);
  }

  // ── Charts ─────────────────────────────────────────────────────────────
  function _section(title, canvasId) {
    const wrap = document.createElement('div');
    wrap.className = 'cmp-chart-section';
    const lbl = document.createElement('div');
    lbl.className = 'cmp-chart-label';
    lbl.textContent = title;
    const canvas = _mkCanvas(canvasId, 'cmp-canvas');
    wrap.appendChild(lbl);
    wrap.appendChild(canvas);
    col.appendChild(wrap);
    return canvasId;
  }

  const tmId  = _section('THREAT MATRIX',    `${prefix}-tm`);
  const pdsId = _section('P.D.S. TELEMETRY', `${prefix}-pds`);
  const emId  = _section('EMOTION RADAR',    `${prefix}-em`);
  const oscId = _section('OSCILLOSCOPE',     `${prefix}-osc`);
  const fftId = _section('FFT SPECTRUM',     `${prefix}-fft`);

  return { col, tmId, pdsId, emId, oscId, fftId };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render ComparisonResult[] into the comparison grid container.
 *
 * @param {ComparisonResult[]} results
 * @param {HTMLElement} gridEl   The `.cmp-grid` container element
 */
export function renderComparison(results, gridEl) {
  if (!gridEl) return;

  // Clear previous render
  destroyComparison();
  gridEl.innerHTML = '';

  if (!results || results.length === 0) {
    gridEl.innerHTML = '<p class="cmp-empty">No results to display.</p>';
    return;
  }

  const colData = [];

  for (let i = 0; i < results.length; i++) {
    const { col, tmId, pdsId, emId, oscId, fftId } = _buildColumn(results[i], i);
    gridEl.appendChild(col);
    colData.push({ result: results[i], tmId, pdsId, emId, oscId, fftId });
  }

  // Charts must be created AFTER columns are in the DOM
  requestAnimationFrame(() => {
    for (const { result, tmId, pdsId, emId, oscId, fftId } of colData) {
      _renderThreatMatrix(tmId,    result.pds.words);
      _renderPdsBars(pdsId,        result.pds.aggregate);
      _renderEmotionRadar(emId,    result.emotions8d.aggregate);
      _renderOscilloscope(oscId,   result.spectral.microWave);
      _renderFFT(fftId,            result.spectral.powerSpectrum);
    }
  });
}

/** Destroy all active Chart.js instances. */
export function destroyComparison() {
  for (const [id] of _charts) _destroyChart(id);
}
