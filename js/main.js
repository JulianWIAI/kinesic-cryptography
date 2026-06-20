/**
 * SOMATIC CIPHER DECODER — Entry Point v3
 *
 * Features: Grid View, Narrative View, Comparison Engine,
 *           Contextual Synthesis Panel, Category-based theming,
 *           Psycholinguistic Diagnostic Engine.
 */

import { processInput, initKuroshiro, isKuroshiroReady }           from './pipeline.js';
import { decodeText }                                              from './decoder.js';
import { renderDiagnostic, hideDiagnosticPanel,
         renderDiagnosticCluster }                                from './diagnosticPanel.js';
import { updateWaveform, destroyWaveform }          from './waveform.js';
import {
  getMicroOscilloscope,
  getGlobalEnvelope,
  runSpectralAnalysis,
  aggregateWindow,
  analyzeWord,
}                                                  from './physics.js';
import { ARCHETYPE_NAMES }                         from './classifier.js';
import {
  renderGlobalEnvelopeChart,
  renderMicroWaveChart,
  renderWordScatterChart,
  destroySpectralCharts,
  renderClusterScatterChart,
  destroyClusterChart,
}                                                  from './charts.js';

// ── App State ─────────────────────────────────────────────
const state = {
  view:          'grid',    // 'grid' | 'narrative' | 'stream'
  comparison:    false,
  synthesisOpen: true,
  language:        'auto',   // 'auto' | 'western' | 'japanese' | 'chinese'
  streamsDisabled: false,   // when true, character image section is hidden in cluster mode
  streams:         { face: true, body: true, egyptian: true, greek: true },
  decoded:         [],       // single-mode results
  cluster:         [],       // cluster-mode results: Array<{ word, decoded, analysis }>
};

// ── Category → CSS class map ─────────────────────────────
const CATEGORY_CLASS = {
  Physical:     'category-physical',
  Emotional:    'category-emotional',
  Intellectual: 'category-intellectual',
};

// ── DOM refs ──────────────────────────────────────────────

// Single input
const inputSectionSingle  = document.getElementById('input-section-single');
const inputEl             = document.getElementById('cipher-input');
const decodeBtn           = document.getElementById('decode-btn');

// Cluster input
const inputSectionComp    = document.getElementById('input-section-comparison');
const clusterInputEl      = /** @type {HTMLTextAreaElement} */ (document.getElementById('cluster-input'));
const decodeBtnComp       = document.getElementById('decode-btn-comparison');

// Controls
const viewTogglesEl       = document.getElementById('view-toggles');
const btnGridView         = document.getElementById('btn-grid-view');
const btnNarrView         = document.getElementById('btn-narrative-view');
const btnStreamView       = document.getElementById('btn-stream-view');
const btnCompMode         = document.getElementById('btn-comparison-mode');

// Output areas
const outputGrid          = document.getElementById('output-grid');
const narrativeContainer  = document.getElementById('narrative-container');
const wordStreamContainer = document.getElementById('word-stream-container');
const narrativeTimeline   = document.getElementById('narrative-timeline');
const comparisonContainer = document.getElementById('comparison-container');
const outputHeader        = document.getElementById('output-header');
const charCountEl         = document.getElementById('char-count');
const emptyState          = document.getElementById('empty-state');

// Synthesis panel
const synthesisPanel      = document.getElementById('synthesis-panel');
const synthesisToggleBtn  = document.getElementById('synthesis-toggle');
const synthesisBody       = document.getElementById('synthesis-body');
const synthesisText       = document.getElementById('synthesis-text');

// Wavelength telemetry panel
const waveformPanel       = document.getElementById('waveform-panel');
const waveformCanvas      = /** @type {HTMLCanvasElement} */ (document.getElementById('waveform-canvas'));
const waveformStatusEl    = document.getElementById('waveform-status');

// Localization bar
const locStatusEl     = document.getElementById('loc-status');
const locBtns         = /** @type {NodeListOf<HTMLButtonElement>} */ (
  document.querySelectorAll('.loc-btn')
);

// Base Signal box
const baseSignalBox       = document.getElementById('base-signal-box');
const baseSignalValue     = document.getElementById('base-signal-value');

// Disable-streams toggle (cluster mode only)
const btnDisableStreams   = document.getElementById('btn-disable-streams');
const streamsToggleDivider = document.getElementById('streams-divider');

// Stream visibility checkboxes
const streamCheckFace     = /** @type {HTMLInputElement} */ (document.getElementById('stream-check-face'));
const streamCheckBody     = /** @type {HTMLInputElement} */ (document.getElementById('stream-check-body'));
const streamCheckEgyptian = /** @type {HTMLInputElement} */ (document.getElementById('stream-check-egyptian'));
const streamCheckGreek    = /** @type {HTMLInputElement} */ (document.getElementById('stream-check-greek'));

// Wave equation + export
const waveEqBox     = document.getElementById('wave-eq-box');
const waveEqContent = document.getElementById('wave-eq-content');
const exportBar     = document.getElementById('export-bar');
const exportBtn     = document.getElementById('export-btn');

// Dossier print elements
const dossierDocId    = document.getElementById('dossier-doc-id');
const dossierTimestamp = document.getElementById('dossier-timestamp');

// ── Spectral Analysis Engine DOM refs ──────────────────────
const spectralCollapseBtn   = document.getElementById('spectral-collapse-btn');
const spectralBodyEl        = document.getElementById('spectral-body');
const spectralOscSection    = document.getElementById('spectral-osc-section');
const spectralResultsEl     = document.getElementById('spectral-analysis-results');
const spectralWindowMetrics = document.getElementById('spectral-window-metrics');
const spectralHarmonicTiles = document.getElementById('spectral-harmonic-tiles');
const oscGlobalCanvas       = /** @type {HTMLCanvasElement} */ (document.getElementById('osc-global-canvas'));
const oscMicroCanvas        = /** @type {HTMLCanvasElement} */ (document.getElementById('osc-micro-canvas'));
const spectralScatterCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('spectral-scatter-canvas'));

// ── Event Listeners ───────────────────────────────────────

decodeBtn.addEventListener('click', handleDecodeSingle);
inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') handleDecodeSingle(); });

// Real-time waveform — fires on every keystroke in single mode
inputEl.addEventListener('input', handleWaveformSingle);

decodeBtnComp.addEventListener('click', handleDecodeCluster);

// Real-time waveform — fires on every keystroke in cluster mode (uses first two words)
clusterInputEl.addEventListener('input', handleWaveformCluster);

btnGridView.addEventListener('click', () => setView('grid'));
btnNarrView.addEventListener('click', () => setView('narrative'));
btnStreamView.addEventListener('click', () => setView('stream'));
btnCompMode.addEventListener('click', toggleComparisonMode);
synthesisToggleBtn.addEventListener('click', toggleSynthesisCollapse);
btnDisableStreams?.addEventListener('click', toggleStreamsDisabled);

streamCheckFace?.addEventListener('change', () => {
  state.streams.face = streamCheckFace.checked;
  document.body.classList.toggle('hide-face', !streamCheckFace.checked);
});
streamCheckBody?.addEventListener('change', () => {
  state.streams.body = streamCheckBody.checked;
  document.body.classList.toggle('hide-body', !streamCheckBody.checked);
});
streamCheckEgyptian?.addEventListener('change', () => {
  state.streams.egyptian = streamCheckEgyptian.checked;
  document.body.classList.toggle('hide-egyptian', !streamCheckEgyptian.checked);
});
streamCheckGreek?.addEventListener('change', () => {
  state.streams.greek = streamCheckGreek.checked;
  document.body.classList.toggle('hide-greek', !streamCheckGreek.checked);
});

exportBtn?.addEventListener('click', exportDossier);

// ── Language Selection ────────────────────────────────────

locBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    if (lang === state.language) return;
    state.language = lang;
    locBtns.forEach(b => {
      b.classList.toggle('loc-btn--active', b.dataset.lang === lang);
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    _hideBaseSignal();
    if (lang === 'japanese') _initKuroshiroLazy();
  });
});

function _setLocStatus(msg, cls = '') {
  if (!locStatusEl) return;
  locStatusEl.textContent = msg;
  locStatusEl.className   = ['loc-status', cls].filter(Boolean).join(' ');
}

async function _initKuroshiroLazy() {
  if (isKuroshiroReady()) return;
  _setBusy(true);
  try {
    await initKuroshiro(msg => _setLocStatus(msg, 'loc-status--loading'));
    _setLocStatus('JP READY', '');
  } catch (err) {
    _setLocStatus('JP DICT ERROR', 'loc-status--error');
  } finally {
    _setBusy(false);
  }
}

function _setBusy(busy) {
  decodeBtn.disabled    = busy;
  decodeBtnComp.disabled = busy;
  const singleLabel = decodeBtn.querySelector('.btn-label');
  const clusterLabel = decodeBtnComp.querySelector('.btn-label');
  if (singleLabel)  singleLabel.textContent  = busy ? 'DECRYPTING…' : 'DECODE';
  if (clusterLabel) clusterLabel.textContent = busy ? 'DECRYPTING…' : 'ANALYZE CLUSTER';
}

function _showBaseSignal(latinized) {
  if (!baseSignalBox || !baseSignalValue) return;
  baseSignalValue.textContent = latinized;
  baseSignalBox.removeAttribute('hidden');
}

function _hideBaseSignal() {
  baseSignalBox?.setAttribute('hidden', '');
}

// ── Helpers ───────────────────────────────────────────────

/**
 * Parses a comma-separated cluster input string into trimmed, non-empty word tokens.
 * @param {string} raw
 * @returns {string[]}
 */
function parseClusterInput(raw) {
  return raw
    .split(',')
    .map(w => w.trim())
    .filter(w => w.length > 0);
}

// ── Decode Handlers ───────────────────────────────────────

async function handleDecodeSingle() {
  _setBusy(true);
  try {
    const result = await processInput(inputEl.value, state.language);
    const text   = result.engineInput;

    if (result.mode !== 'western') {
      _showBaseSignal(result.latinized);
      // Drive oscilloscopes from the Latin signal after transliteration
      const datasets = [{ label: 'SIGNAL', text }];
      setWaveformPanelVisible(updateWaveform(waveformCanvas, datasets));
      updateSpectralOscilloscopes(datasets);
    } else {
      _hideBaseSignal();
    }

    state.decoded = decodeText(text);
    renderSingle();
    renderDiagnostic(text, null);
    runDeepSpectralAnalysis(text);
    _renderWaveEquation([{ label: result.latinized || inputEl.value.trim(), decoded: state.decoded }]);
    exportBar?.removeAttribute('hidden');
  } catch (err) {
    _setLocStatus(err.message, 'loc-status--error');
  } finally {
    _setBusy(false);
  }
}

async function handleDecodeCluster() {
  const rawWords = parseClusterInput(clusterInputEl.value);
  if (rawWords.length === 0) {
    clearAllOutputs();
    showEmptyState();
    hideSynthesisPanel();
    return;
  }

  _setBusy(true);
  try {
    const results = await Promise.all(rawWords.map(w => processInput(w, state.language)));

    const hasTranslit = results.some(r => r.mode !== 'western');
    if (hasTranslit) {
      _showBaseSignal(results.map(r => r.latinized).join('  /  '));
    } else {
      _hideBaseSignal();
    }

    const engineTexts = results.map(r => r.engineInput);
    state.cluster = results.map((r, i) => ({
      word:     r.engineInput || rawWords[i],
      decoded:  decodeText(r.engineInput),
      analysis: analyzeWord(r.engineInput),
    }));

    renderCluster();
    renderDiagnosticCluster(engineTexts);
    runDeepSpectralAnalysis(engineTexts.join(' '));
    _renderWaveEquation(state.cluster.map(c => ({ label: c.word, decoded: c.decoded })));
    exportBar?.removeAttribute('hidden');
  } catch (err) {
    _setLocStatus(err.message, 'loc-status--error');
  } finally {
    _setBusy(false);
  }
}

// ── Waveform Handlers (real-time) ─────────────────────────

/**
 * Updates the waveform for single-input mode.
 * Fires on every `input` event so the chart tracks the user's typing live.
 */
function handleWaveformSingle() {
  const datasets = [{ label: 'SIGNAL', text: inputEl.value }];
  setWaveformPanelVisible(updateWaveform(waveformCanvas, datasets));
  updateSpectralOscilloscopes(datasets);
}

/**
 * Updates the waveform for cluster mode — overlays the first two words as coloured lines.
 * Also drives the Spectral Engine oscilloscopes.
 */
function handleWaveformCluster() {
  const words = parseClusterInput(clusterInputEl.value);
  if (words.length === 0) {
    setWaveformPanelVisible(false);
    return;
  }
  const datasets = words.map((w, i) => ({ label: w.toUpperCase() || `W${i + 1}`, text: w }));
  setWaveformPanelVisible(updateWaveform(waveformCanvas, datasets));
  updateSpectralOscilloscopes(datasets);
}

/**
 * Shows or hides the waveform panel and updates the status label.
 * @param {boolean} visible
 */
function setWaveformPanelVisible(visible) {
  if (!waveformPanel) return;
  if (visible) {
    waveformPanel.removeAttribute('hidden');
    if (waveformStatusEl) waveformStatusEl.textContent = 'LIVE';
  } else {
    waveformPanel.setAttribute('hidden', '');
    if (waveformStatusEl) waveformStatusEl.textContent = 'SCANNING\u2026';
  }
}

// ── Single-mode Renderer ──────────────────────────────────

function renderSingle() {
  _clearCardOutputs();

  if (state.decoded.length === 0) {
    showEmptyState();
    hideSynthesisPanel();
    waveEqBox?.setAttribute('hidden', '');
    exportBar?.setAttribute('hidden', '');
    return;
  }

  hideEmptyState();
  updateOutputHeader(state.decoded, inputEl.value);

  if (!state.streamsDisabled) {
    if (state.view === 'narrative') {
      narrativeContainer.removeAttribute('hidden');
      state.decoded.forEach((item, i) => {
        narrativeTimeline.appendChild(createTimelineNode(item, i));
        if (i < state.decoded.length - 1) {
          narrativeTimeline.appendChild(createConnector());
        }
      });
    } else if (state.view === 'stream') {
      wordStreamContainer.removeAttribute('hidden');
      wordStreamContainer.appendChild(buildWordStreamRow('face', state.decoded));
      wordStreamContainer.appendChild(buildWordStreamRow('body', state.decoded));
      wordStreamContainer.appendChild(buildWordStreamRow('egyptian', state.decoded));
      wordStreamContainer.appendChild(buildWordStreamRow('greek', state.decoded));
    } else {
      outputGrid.removeAttribute('hidden');
      state.decoded.forEach((item, i) => outputGrid.appendChild(createCardElement(item, i)));
    }
  }

  populateSynthesis(state.decoded, null);
}

// ── Cluster Renderer ──────────────────────────────────────

function renderCluster() {
  _clearCardOutputs();

  if (state.cluster.length === 0) {
    showEmptyState();
    hideSynthesisPanel();
    return;
  }

  hideEmptyState();
  comparisonContainer.removeAttribute('hidden');

  // ── Center of Gravity metrics ─────────────────────────
  const validWords = state.cluster.filter(c => c.analysis !== null);
  const avgSum     = validWords.length
    ? validWords.reduce((s, c) => s + c.analysis.wordSum, 0) / validWords.length
    : 0;
  const avgSigma   = validWords.length
    ? validWords.reduce((s, c) => s + c.analysis.sigma, 0) / validWords.length
    : 0;

  const gravityEl = document.createElement('div');
  gravityEl.className = 'cluster-gravity';
  gravityEl.innerHTML = `
    <div class="cluster-gravity-title">
      <span class="cluster-gravity-dot" aria-hidden="true"></span>
      CLUSTER CENTER OF GRAVITY &mdash; ${validWords.length} word${validWords.length !== 1 ? 's' : ''}
    </div>
    <div class="cluster-gravity-metrics">
      <div class="cluster-metric-tile">
        <span class="cluster-metric-label">AVG WORD SUM (&Sigma;)</span>
        <span class="cluster-metric-value">${avgSum.toFixed(1)}</span>
      </div>
      <div class="cluster-metric-tile">
        <span class="cluster-metric-label">AVG &sigma;</span>
        <span class="cluster-metric-value">${avgSigma.toFixed(2)}</span>
      </div>
      <div class="cluster-metric-tile">
        <span class="cluster-metric-label">WORD COUNT</span>
        <span class="cluster-metric-value">${validWords.length}</span>
      </div>
    </div>
  `;
  comparisonContainer.appendChild(gravityEl);

  // ── Word metrics table ────────────────────────────────
  const tableEl = document.createElement('div');
  tableEl.className = 'cluster-table';
  tableEl.innerHTML = `
    <div class="cluster-table-header">
      <span>WORD</span><span>&Sigma;</span><span>&sigma;</span><span>TIER</span><span>ARCHETYPE</span>
    </div>
    ${state.cluster.map(c => {
      const a = c.analysis;
      if (!a) return `<div class="cluster-table-row cluster-table-row--empty"><span>${c.word.toUpperCase()}</span><span colspan="4">—</span></div>`;
      const tier = a.sigma < 2.0 ? 'T1' : a.sigma < 5.0 ? 'T2' : 'T3';
      return `<div class="cluster-table-row cluster-table-row--${tier.toLowerCase()}">
        <span class="cluster-table-word">${c.word.toUpperCase()}</span>
        <span>${a.wordSum}</span>
        <span>${a.sigma.toFixed(2)}</span>
        <span class="cluster-tier-badge cluster-tier-badge--${tier.toLowerCase()}">${tier}</span>
        <span>${a.quersumme} &mdash; ${ARCHETYPE_NAMES[a.quersumme] ?? '—'}</span>
      </div>`;
    }).join('')}
  `;
  comparisonContainer.appendChild(tableEl);

  // ── Scatter canvas ─────────────────────────────────────
  const scatterWrap = document.createElement('div');
  scatterWrap.className = 'cluster-scatter-wrap';
  const scatterTitle = document.createElement('div');
  scatterTitle.className = 'cluster-scatter-title';
  scatterTitle.textContent = 'CLUSTER SCATTER — Word Sum (Σ) × σ';
  const scatterBg = document.createElement('div');
  scatterBg.className = 'cluster-scatter-bg';
  const canvas = document.createElement('canvas');
  canvas.id = 'cluster-scatter-canvas';
  canvas.setAttribute('aria-label', 'Semantic cluster scatter plot');
  scatterBg.appendChild(canvas);
  scatterWrap.appendChild(scatterTitle);
  scatterWrap.appendChild(scatterBg);
  comparisonContainer.appendChild(scatterWrap);

  // Render the chart
  const scatterData = state.cluster
    .filter(c => c.analysis !== null)
    .map(c => ({ word: c.word, wordSum: c.analysis.wordSum, sigma: c.analysis.sigma }));
  renderClusterScatterChart(canvas, scatterData);

  // ── Per-word character stream section (skipped when disabled) ──
  if (!state.streamsDisabled) {
    const streamSection = document.createElement('div');
    streamSection.className = 'cluster-stream-section';

    const streamTitle = document.createElement('div');
    streamTitle.className = 'cluster-stream-title';
    streamTitle.textContent = 'CHARACTER STREAMS';
    streamSection.appendChild(streamTitle);

    state.cluster.forEach((item, i) => {
      if (item.decoded.length > 0) {
        streamSection.appendChild(buildClusterWordBlock(item, i));
      }
    });
    comparisonContainer.appendChild(streamSection);
  }

  // ── Synthesis ─────────────────────────────────────────
  const allDecoded = state.cluster.flatMap(c => c.decoded);
  populateSynthesis(allDecoded, null);
}

function toggleStreamsDisabled() {
  state.streamsDisabled = !state.streamsDisabled;
  btnDisableStreams.classList.toggle('view-toggle--active', state.streamsDisabled);
  btnDisableStreams.setAttribute('aria-pressed', String(state.streamsDisabled));
  if (state.comparison && state.cluster.length > 0) renderCluster();
  else if (!state.comparison && state.decoded.length > 0) renderSingle();
}

// ── Cluster Word Block Factory ────────────────────────────

const _WORD_COLORS = [
  '#00c8ff', '#00ffc8', '#a78bfa', '#fb923c',
  '#f59e0b', '#22d3a0', '#f472b6', '#60a5fa',
];

function buildClusterWordBlock(item, wordIndex) {
  const { word, decoded } = item;
  const color = _WORD_COLORS[wordIndex % _WORD_COLORS.length];

  const block = document.createElement('div');
  block.className = 'cluster-word-block';

  const header = document.createElement('div');
  header.className = 'cluster-word-block-header';
  header.style.borderLeftColor = color;
  header.innerHTML = `
    <span class="cluster-word-block-idx">#${String(wordIndex + 1).padStart(2, '0')}</span>
    <span class="cluster-word-block-name" style="color:${color}">${word.toUpperCase()}</span>
    <span class="cluster-word-block-count">${decoded.length} chr</span>
  `;
  block.appendChild(header);

  const content = document.createElement('div');
  content.className = 'cluster-word-block-content';

  if (state.view === 'narrative') {
    content.classList.add('narrative-container');
    const timeline = document.createElement('div');
    timeline.className = 'narrative-timeline';
    timeline.setAttribute('role', 'list');
    decoded.forEach((d, i) => {
      timeline.appendChild(createTimelineNode(d, i));
      if (i < decoded.length - 1) timeline.appendChild(createConnector());
    });
    content.appendChild(timeline);
  } else if (state.view === 'stream') {
    content.appendChild(buildWordStreamRow('face', decoded));
    content.appendChild(buildWordStreamRow('body', decoded));
    content.appendChild(buildWordStreamRow('egyptian', decoded));
    content.appendChild(buildWordStreamRow('greek', decoded));
  } else {
    content.classList.add('output-grid');
    decoded.forEach((d, i) => content.appendChild(createCardElement(d, i)));
  }

  block.appendChild(content);
  return block;
}

// ── View Toggle ───────────────────────────────────────────

function setView(view) {
  state.view = view;

  btnGridView.classList.toggle('view-toggle--active', view === 'grid');
  btnNarrView.classList.toggle('view-toggle--active', view === 'narrative');
  btnStreamView.classList.toggle('view-toggle--active', view === 'stream');
  btnGridView.setAttribute('aria-pressed', String(view === 'grid'));
  btnNarrView.setAttribute('aria-pressed', String(view === 'narrative'));
  btnStreamView.setAttribute('aria-pressed', String(view === 'stream'));

  if (state.comparison && state.cluster.length > 0) renderCluster();
  else if (state.decoded.length > 0) renderSingle();
}

// ── Comparison Mode Toggle ────────────────────────────────

function toggleComparisonMode() {
  state.comparison = !state.comparison;
  btnCompMode.classList.toggle('active', state.comparison);
  btnCompMode.setAttribute('aria-pressed', String(state.comparison));

  // View toggles remain visible in both modes so the user can switch
  // character stream layout in cluster mode too
  if (state.comparison) {
    inputSectionSingle.setAttribute('hidden', '');
    inputSectionComp.removeAttribute('hidden');
  } else {
    inputSectionSingle.removeAttribute('hidden');
    inputSectionComp.setAttribute('hidden', '');
  }
  viewTogglesEl.removeAttribute('hidden');

  clearAllOutputs();
  showEmptyState();
  hideSynthesisPanel();
  // Reset waveform, spectral and cluster charts — dataset count may change between modes
  destroyWaveform();
  setWaveformPanelVisible(false);
  destroySpectralCharts();
  spectralOscSection?.setAttribute('hidden', '');
  state.cluster = [];
}

// ── Card Factory (Grid View) ──────────────────────────────

function createCardElement(decoded, index) {
  const { char, data, faceImg, bodyImg } = decoded;
  const displayChar   = char.toUpperCase();
  const categoryClass = data?.category ? (CATEGORY_CLASS[data.category] ?? '') : '';

  const article = document.createElement('article');
  article.className = ['char-card', categoryClass, !data ? 'card--no-data' : ''].filter(Boolean).join(' ');
  article.setAttribute('role', 'listitem');
  article.setAttribute('aria-label', `Character analysis for ${displayChar}`);
  article.style.setProperty('--card-index', index);

  const header = document.createElement('div');
  header.className = 'card-header';

  const charSpan = document.createElement('span');
  charSpan.className = 'card-char';
  charSpan.setAttribute('aria-hidden', 'true');
  charSpan.textContent = displayChar;

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `
    <span class="card-tag">${data?.category ?? 'Unknown'}</span>
    <span class="card-index">#${String(index + 1).padStart(3, '0')}</span>
  `;

  header.appendChild(charSpan);
  header.appendChild(meta);

  const streams = document.createElement('div');
  streams.className = 'card-streams';
  streams.appendChild(createStream('face', displayChar, faceImg, data?.face ?? null));
  streams.appendChild(createStream('body', displayChar, bodyImg, data?.body ?? null));

  article.appendChild(header);
  article.appendChild(streams);
  article.appendChild(createEgyptianStream(decoded));
  article.appendChild(createGreekStream(decoded));
  return article;
}

// ── Stream Column Factory ─────────────────────────────────

function createStream(type, displayChar, imgSrc, description) {
  const isFace  = type === 'face';
  const label   = isFace ? 'Facial Articulation' : 'Somatic Posture';
  const altText = `${isFace ? 'Facial articulation' : 'Somatic posture'} for ${displayChar}`;

  const section = document.createElement('div');
  section.className = `stream stream--${type}`;

  const streamHeader = document.createElement('div');
  streamHeader.className = 'stream-header';
  streamHeader.innerHTML = `
    <span class="stream-dot stream-dot--${type}" aria-hidden="true"></span>
    <span class="stream-title">${label}</span>
  `;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'stream-image-wrap';
  imageWrap.appendChild(buildImg(imgSrc, altText, 'stream-img', imageWrap));

  const desc = document.createElement('p');
  desc.className = 'stream-description';
  if (description) {
    desc.textContent = description;
  } else {
    const em = document.createElement('em');
    em.className = 'no-data';
    em.textContent = 'No data on record for this character.';
    desc.appendChild(em);
  }

  section.appendChild(streamHeader);
  section.appendChild(imageWrap);
  section.appendChild(desc);
  return section;
}

// ── Egyptian Etymology Stream Factory ────────────────────

function createEgyptianStream(decoded) {
  const { data } = decoded;
  const egyptian = data?.egyptian;

  const section = document.createElement('div');
  section.className = 'stream stream--egyptian';

  const headerEl = document.createElement('div');
  headerEl.className = 'stream-header';
  headerEl.innerHTML = `
    <span class="stream-dot stream-dot--egyptian" aria-hidden="true"></span>
    <span class="stream-title stream-title--egyptian">Egyptian Etymology</span>
  `;

  const glyphEl = document.createElement('div');
  glyphEl.className = 'card-egyptian-glyph';
  glyphEl.textContent = egyptian?.unicode ?? '?';
  glyphEl.setAttribute('aria-hidden', 'true');

  const desc = document.createElement('p');
  desc.className = 'stream-description';
  if (egyptian?.description) {
    desc.textContent = egyptian.description;
  } else {
    const em = document.createElement('em');
    em.className = 'no-data';
    em.textContent = 'No Egyptian etymology on record.';
    desc.appendChild(em);
  }

  section.appendChild(headerEl);
  section.appendChild(glyphEl);
  section.appendChild(desc);
  return section;
}

// ── Greek Physics Stream Factory ─────────────────────────

function createGreekStream(decoded) {
  const { data } = decoded;
  const greek = data?.greek;

  const section = document.createElement('div');
  section.className = 'stream stream--greek';

  const headerEl = document.createElement('div');
  headerEl.className = 'stream-header';
  headerEl.innerHTML = `
    <span class="stream-dot stream-dot--greek" aria-hidden="true"></span>
    <span class="stream-title stream-title--greek">Greek Physics Variable</span>
  `;

  const glyphEl = document.createElement('div');
  glyphEl.className = 'card-greek-glyph';
  glyphEl.textContent = greek?.unicode ?? '?';
  glyphEl.setAttribute('aria-hidden', 'true');

  const desc = document.createElement('p');
  desc.className = 'stream-description';
  if (greek?.description) {
    desc.textContent = greek.description;
  } else {
    const em = document.createElement('em');
    em.className = 'no-data';
    em.textContent = 'No Greek physics variable for this character.';
    desc.appendChild(em);
  }

  section.appendChild(headerEl);
  section.appendChild(glyphEl);
  section.appendChild(desc);
  return section;
}

// ── Timeline Node Factory (Narrative View) ────────────────

function createTimelineNode(decoded, index) {
  const { char, data, faceImg, bodyImg } = decoded;
  const displayChar   = char.toUpperCase();
  const categoryClass = data?.category ? (CATEGORY_CLASS[data.category] ?? '') : '';

  const node = document.createElement('div');
  node.className = ['narrative-node', categoryClass].filter(Boolean).join(' ');
  node.setAttribute('role', 'listitem');
  node.setAttribute('aria-label', `${displayChar} — ${data?.category ?? 'no data'}`);
  node.style.setProperty('--card-index', index);

  const charEl = document.createElement('div');
  charEl.className = 'node-char';
  charEl.textContent = displayChar;
  charEl.setAttribute('aria-hidden', 'true');

  const imagesEl = document.createElement('div');
  imagesEl.className = 'node-images';
  imagesEl.appendChild(buildNodeImage(faceImg, 'face', 'F', displayChar));
  imagesEl.appendChild(buildNodeImage(bodyImg, 'body', 'S', displayChar));

  const metaEl = document.createElement('div');
  metaEl.className = 'node-meta';
  metaEl.textContent = data?.category ?? '';

  const hieroglyphWrap = document.createElement('div');
  hieroglyphWrap.className = 'node-hieroglyph-wrap';
  const hieroglyphGlyph = document.createElement('span');
  hieroglyphGlyph.className = 'node-hieroglyph';
  hieroglyphGlyph.textContent = data?.egyptian?.unicode ?? '';
  hieroglyphGlyph.setAttribute('aria-hidden', 'true');
  hieroglyphWrap.appendChild(hieroglyphGlyph);

  const greekWrap = document.createElement('div');
  greekWrap.className = 'node-greek-wrap';
  const greekGlyph = document.createElement('span');
  greekGlyph.className = 'node-greek';
  greekGlyph.textContent = data?.greek?.unicode ?? '';
  greekGlyph.setAttribute('aria-hidden', 'true');
  greekWrap.appendChild(greekGlyph);

  node.appendChild(charEl);
  node.appendChild(imagesEl);
  node.appendChild(hieroglyphWrap);
  node.appendChild(greekWrap);
  node.appendChild(metaEl);
  return node;
}

function buildNodeImage(src, type, badgeText, displayChar) {
  const wrap = document.createElement('div');
  wrap.className = `node-image-wrap node-image-wrap--${type}`;

  const altText = `${type === 'face' ? 'Facial' : 'Somatic'} image for ${displayChar}`;
  wrap.appendChild(buildImg(src, altText, 'node-img', wrap));

  const label = document.createElement('span');
  label.className = 'node-image-label';
  label.textContent = badgeText;
  label.setAttribute('aria-hidden', 'true');
  wrap.appendChild(label);

  return wrap;
}

function createConnector() {
  const conn = document.createElement('div');
  conn.className = 'timeline-connector';
  conn.setAttribute('aria-hidden', 'true');

  const line = document.createElement('span');
  line.className = 'connector-line';

  const arrow = document.createElement('span');
  arrow.className = 'connector-arrow';
  arrow.textContent = '▶';

  conn.appendChild(line);
  conn.appendChild(arrow);
  return conn;
}

// ── Comparison Row Factory ────────────────────────────────

function buildComparisonRow(label, rawInput, decoded) {
  const row = document.createElement('div');
  row.className = `comparison-row comparison-row--${label}`;

  const rowHeader = document.createElement('div');
  rowHeader.className = 'comparison-row-header';

  const rowLabel = document.createElement('span');
  rowLabel.className = 'comparison-row-label';
  rowLabel.textContent = `WORD ${label.toUpperCase()}`;

  const rowWord = document.createElement('span');
  rowWord.className = 'comparison-row-word';
  // Preserve letters a–z, umlauts ä ö ü, and digits
  rowWord.textContent = rawInput.toLowerCase().replace(/[^a-z0-9äöü]/g, '') || '—';

  rowHeader.appendChild(rowLabel);
  rowHeader.appendChild(rowWord);

  const stream = document.createElement('div');
  stream.className = 'comparison-stream';
  stream.setAttribute('role', 'list');

  if (decoded.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'comparison-empty';
    empty.textContent = 'No valid characters.';
    stream.appendChild(empty);
  } else {
    decoded.forEach((item, i) => {
      const nodeWrapper = document.createElement('div');
      nodeWrapper.setAttribute('role', 'listitem');
      nodeWrapper.appendChild(createComparisonNode(item, i));
      stream.appendChild(nodeWrapper);

      if (i < decoded.length - 1) {
        const conn = document.createElement('div');
        conn.className = 'comparison-connector';
        conn.setAttribute('aria-hidden', 'true');
        stream.appendChild(conn);
      }
    });
  }

  row.appendChild(rowHeader);
  row.appendChild(stream);
  return row;
}

// ── Comparison Node Factory ───────────────────────────────

function createComparisonNode(decoded, index) {
  const { char, data, faceImg, bodyImg } = decoded;
  const displayChar   = char.toUpperCase();
  const categoryClass = data?.category ? (CATEGORY_CLASS[data.category] ?? '') : '';

  const node = document.createElement('div');
  node.className = ['comparison-node', categoryClass].filter(Boolean).join(' ');
  node.setAttribute('aria-label', `${displayChar} — ${data?.category ?? 'no data'}`);
  node.style.setProperty('--card-index', index);

  const charEl = document.createElement('div');
  charEl.className = 'comparison-node-char';
  charEl.textContent = displayChar;
  charEl.setAttribute('aria-hidden', 'true');

  // Body image — primary (somatic stream)
  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'comparison-node-img-wrap comparison-node-img-wrap--body';
  bodyWrap.appendChild(buildImg(bodyImg, `Somatic posture for ${displayChar}`, 'comparison-node-img', bodyWrap));

  // Face image — secondary reference
  const faceWrap = document.createElement('div');
  faceWrap.className = 'comparison-node-img-wrap comparison-node-img-wrap--face';
  faceWrap.appendChild(buildImg(faceImg, `Facial articulation for ${displayChar}`, 'comparison-node-img', faceWrap));

  const categoryEl = document.createElement('span');
  categoryEl.className = 'comparison-node-category';
  categoryEl.textContent = data?.category ?? '';

  node.appendChild(charEl);
  node.appendChild(bodyWrap);
  node.appendChild(faceWrap);
  node.appendChild(categoryEl);
  return node;
}

// ── Shared Image Builder ──────────────────────────────────

function buildImg(src, alt, className, wrapEl) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = className;
  img.loading = 'lazy';
  img.addEventListener('error', () => onImageError(img, wrapEl));
  return img;
}

function onImageError(img, wrap) {
  img.remove();
  const placeholder = document.createElement('div');
  placeholder.className = 'img-placeholder';
  placeholder.setAttribute('aria-label', 'Image not yet available');
  placeholder.textContent = 'Image pending';
  wrap.appendChild(placeholder);
}

// ── Synthesis Panel ───────────────────────────────────────

/**
 * Populates and shows the synthesis panel.
 * @param {import('./decoder.js').DecodedCharacter[]} primaryDecoded
 * @param {import('./decoder.js').DecodedCharacter[]|null} secondaryDecoded — null in single mode
 */
function populateSynthesis(primaryDecoded, secondaryDecoded) {
  synthesisText.innerHTML = '';

  if (secondaryDecoded === null) {
    // Single mode: one continuous narrative paragraph
    const story = primaryDecoded
      .filter(d => d.data)
      .map(d => `${d.data.face} ${d.data.body}`)
      .join(' ');

    if (!story) { hideSynthesisPanel(); return; }

    const p = document.createElement('p');
    p.textContent = story;
    synthesisText.appendChild(p);
  } else {
    // Comparison mode: two labelled paragraphs
    const buildParagraph = (decoded, label) => {
      const story = decoded.filter(d => d.data).map(d => `${d.data.face} ${d.data.body}`).join(' ');
      if (!story) return null;
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `WORD ${label}: `;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(story));
      return p;
    };

    const pA = buildParagraph(primaryDecoded, 'A');
    const pB = buildParagraph(secondaryDecoded, 'B');

    if (!pA && !pB) { hideSynthesisPanel(); return; }
    if (pA) synthesisText.appendChild(pA);
    if (pB) synthesisText.appendChild(pB);
  }

  synthesisPanel.removeAttribute('hidden');
  updateBodyPadding();
}

function hideSynthesisPanel() {
  synthesisPanel.setAttribute('hidden', '');
  document.body.style.paddingBottom = '';
}

function toggleSynthesisCollapse() {
  state.synthesisOpen = !state.synthesisOpen;
  synthesisBody.classList.toggle('synthesis-body--collapsed', !state.synthesisOpen);
  synthesisToggleBtn.textContent = state.synthesisOpen ? '▼' : '▲';
  synthesisToggleBtn.setAttribute('aria-expanded', String(state.synthesisOpen));
  synthesisToggleBtn.setAttribute('aria-label', state.synthesisOpen ? 'Collapse synthesis panel' : 'Expand synthesis panel');
  updateBodyPadding();
}

function updateBodyPadding() {
  if (!synthesisPanel.hidden) {
    requestAnimationFrame(() => {
      document.body.style.paddingBottom = synthesisPanel.offsetHeight + 16 + 'px';
    });
  }
}

// ── Output State Helpers ──────────────────────────────────

// Clears only the character-card output areas.
// Diagnostic and spectral panels are intentionally left alone so that
// toggling "Disable Images" or switching view does not hide the analysis.
function _clearCardOutputs() {
  outputGrid.innerHTML          = '';
  narrativeTimeline.innerHTML   = '';
  wordStreamContainer.innerHTML = '';
  comparisonContainer.innerHTML = '';

  outputGrid.setAttribute('hidden', '');
  narrativeContainer.setAttribute('hidden', '');
  wordStreamContainer.setAttribute('hidden', '');
  comparisonContainer.setAttribute('hidden', '');
  outputHeader.setAttribute('hidden', '');

  destroyClusterChart();
}

// Full reset — also clears the diagnostic and spectral panels.
// Only called on mode switch and when the decoded result is empty.
function clearAllOutputs() {
  _clearCardOutputs();
  hideDiagnosticPanel();
  spectralResultsEl?.setAttribute('hidden', '');
  waveEqBox?.setAttribute('hidden', '');
  exportBar?.setAttribute('hidden', '');
}

function showEmptyState()  { emptyState.removeAttribute('hidden'); }
function hideEmptyState()  { emptyState.setAttribute('hidden', ''); }

function updateOutputHeader(decoded, raw) {
  outputHeader.removeAttribute('hidden');
  // Count unique characters — include letters, digits, and umlauts
  const unique = new Set([...raw.toLowerCase()].filter(c => /^[a-z0-9äöü]$/.test(c))).size;
  charCountEl.textContent = `${decoded.length} character${decoded.length !== 1 ? 's' : ''} decoded — ${unique} unique`;
}

// ── Word Stream View ──────────────────────────────────────

function buildWordStreamRow(type, decoded) {
  const isFace     = type === 'face';
  const isEgyptian = type === 'egyptian';
  const isGreek    = type === 'greek';
  const label      = isEgyptian ? 'Egyptian Etymology Stream'
    : isGreek    ? 'Greek Physics Variables Stream'
    : isFace     ? 'Facial Articulation Stream'
    : 'Somatic Posture Stream';

  const row = document.createElement('div');
  row.className = `word-stream-row word-stream-row--${type}`;

  const rowHeader = document.createElement('div');
  rowHeader.className = 'word-stream-row-header';
  rowHeader.innerHTML = `
    <span class="word-stream-row-dot" aria-hidden="true"></span>
    <span class="word-stream-row-title">${label}</span>
  `;

  const track = document.createElement('div');
  track.className = 'comparison-stream';
  track.setAttribute('role', 'list');

  decoded.forEach((item, i) => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('role', 'listitem');
    wrapper.appendChild(createWordStreamNode(item, i, type));
    track.appendChild(wrapper);

    if (i < decoded.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'comparison-connector';
      conn.setAttribute('aria-hidden', 'true');
      track.appendChild(conn);
    }
  });

  row.appendChild(rowHeader);
  row.appendChild(track);
  return row;
}

function createWordStreamNode(decoded, index, type) {
  const { char, data, faceImg, bodyImg } = decoded;
  const displayChar   = char.toUpperCase();
  const categoryClass = data?.category ? (CATEGORY_CLASS[data.category] ?? '') : '';

  const node = document.createElement('div');
  node.className = ['word-stream-node', categoryClass].filter(Boolean).join(' ');
  node.setAttribute('aria-label', `${displayChar} — ${data?.category ?? 'no data'}`);
  node.style.setProperty('--card-index', index);

  const charEl = document.createElement('div');
  charEl.className = 'word-stream-node-char';
  charEl.textContent = displayChar;
  charEl.setAttribute('aria-hidden', 'true');

  node.appendChild(charEl);

  if (type === 'egyptian') {
    const glyphEl = document.createElement('div');
    glyphEl.className = 'word-stream-node-glyph';
    glyphEl.textContent = data?.egyptian?.unicode ?? '?';
    glyphEl.setAttribute('aria-hidden', 'true');
    node.appendChild(glyphEl);
  } else if (type === 'greek') {
    const glyphEl = document.createElement('div');
    glyphEl.className = 'word-stream-node-greek-glyph';
    glyphEl.textContent = data?.greek?.unicode ?? '?';
    glyphEl.setAttribute('aria-hidden', 'true');
    node.appendChild(glyphEl);
  } else {
    const imgSrc  = type === 'face' ? faceImg : bodyImg;
    const altText = `${type === 'face' ? 'Facial articulation' : 'Somatic posture'} for ${displayChar}`;
    const imgWrap = document.createElement('div');
    imgWrap.className = 'word-stream-node-img-wrap';
    imgWrap.appendChild(buildImg(imgSrc, altText, 'word-stream-node-img', imgWrap));
    node.appendChild(imgWrap);
  }

  const categoryEl = document.createElement('span');
  categoryEl.className = 'word-stream-node-category';
  categoryEl.textContent = data?.category ?? '';
  node.appendChild(categoryEl);

  return node;
}

// ── Wave Equation Renderer ────────────────────────────────

/**
 * Builds one equation line per word from Greek letter mappings.
 * @param {Array<{ label: string, decoded: Array }>} wordGroups
 */
function _renderWaveEquation(wordGroups) {
  if (!waveEqBox || !waveEqContent) return;

  const lines = wordGroups
    .map(({ label, decoded }) => {
      const terms = decoded
        .filter(d => d.data?.greek?.unicode)
        .map(d => d.data.greek.unicode);
      if (terms.length === 0) return null;
      const wordLabel = (label || '?').replace(/[^a-zA-ZÄÖÜäöü0-9]/g, '').toUpperCase() || label.toUpperCase();
      return { wordLabel, equation: terms.join(' + ') };
    })
    .filter(Boolean);

  if (lines.length === 0) {
    waveEqBox.setAttribute('hidden', '');
    return;
  }

  waveEqContent.innerHTML = lines.map(({ wordLabel, equation }) =>
    `<div class="wave-eq-line">` +
    `<span class="wave-eq-func">WAVE_FUNC</span>` +
    `(<span class="wave-eq-word">${wordLabel}</span>) = ` +
    `<span class="wave-eq-terms">${equation}</span>` +
    `</div>`
  ).join('');

  waveEqBox.removeAttribute('hidden');
}

// ── SIGINT Dossier Export ─────────────────────────────────

function exportDossier() {
  const docId = 'SCD-' + Date.now().toString(36).toUpperCase();
  const ts    = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  if (dossierDocId)    dossierDocId.textContent    = docId;
  if (dossierTimestamp) dossierTimestamp.textContent = ts;
  window.print();
}

// ── Spectral Analysis Engine ──────────────────────────────

let spectralPanelOpen = true;

/**
 * Updates both oscilloscope charts from the current input stream(s).
 * Called from handleWaveformSingle / handleWaveformComparison on every keystroke.
 *
 * @param {Array<{ label: string, text: string }>} datasets
 */
function updateSpectralOscilloscopes(datasets) {
  const hasLetters = datasets.some(d =>
    [...d.text.toLowerCase()].some(c => /[a-zäöü]/.test(c))
  );

  if (!hasLetters) {
    spectralOscSection?.setAttribute('hidden', '');
    destroySpectralCharts();
    return;
  }

  spectralOscSection?.removeAttribute('hidden');

  renderGlobalEnvelopeChart(
    oscGlobalCanvas,
    datasets.map(d => ({ label: d.label, data: getGlobalEnvelope(d.text) }))
  );
  renderMicroWaveChart(
    oscMicroCanvas,
    datasets.map(d => ({ label: d.label, data: getMicroOscilloscope(d.text) }))
  );
}

/**
 * Runs FFT + window aggregation + scatter on the given text.
 * Called from handleDecodeSingle / handleDecodeComparison after a decode.
 *
 * @param {string} text — primary word / phrase to analyse
 */
function runDeepSpectralAnalysis(text) {
  if (!text.trim()) return;

  const spectral  = runSpectralAnalysis(text);
  const aggregate = aggregateWindow(text);
  if (!aggregate) return;

  _renderWindowMetrics(aggregate);
  _renderHarmonicTiles(spectral.topHarmonics, spectral.powerSpectrum);
  renderWordScatterChart(spectralScatterCanvas, aggregate.word_scatter_data);
  spectralResultsEl?.removeAttribute('hidden');
}

function _renderWindowMetrics(agg) {
  if (!spectralWindowMetrics) return;
  const archetypeName = ARCHETYPE_NAMES[agg.dominant_quersumme] ?? '—';

  spectralWindowMetrics.innerHTML = `
    <div class="spectral-metric-grid">
      <div class="spectral-metric-tile">
        <span class="spectral-metric-label">AVG WORD &sigma;</span>
        <span class="spectral-metric-value">${agg.avg_word_sigma.toFixed(3)}</span>
        <span class="spectral-metric-sub">Window spread</span>
      </div>
      <div class="spectral-metric-tile">
        <span class="spectral-metric-label">DOM. QUERSUMME</span>
        <span class="spectral-metric-value spectral-metric-value--quersumme">${agg.dominant_quersumme}</span>
        <span class="spectral-metric-sub">${archetypeName}</span>
      </div>
      <div class="spectral-metric-tile">
        <span class="spectral-metric-label">SOVEREIGNTY</span>
        <span class="spectral-metric-value spectral-metric-value--sovereign">${agg.sovereignty_score.toFixed(1)}%</span>
        <span class="spectral-metric-sub">Sovereign letters</span>
      </div>
      <div class="spectral-metric-tile">
        <span class="spectral-metric-label">SOMATIC</span>
        <span class="spectral-metric-value spectral-metric-value--somatic">${agg.somatic_score.toFixed(1)}%</span>
        <span class="spectral-metric-sub">Kin + Liminal</span>
      </div>
      <div class="spectral-metric-tile">
        <span class="spectral-metric-label">WORD COUNT</span>
        <span class="spectral-metric-value">${agg.wordCount.toLocaleString()}</span>
        <span class="spectral-metric-sub">Valid tokens</span>
      </div>
    </div>
  `;
}

function _renderHarmonicTiles(harmonics, fullSpectrum) {
  if (!spectralHarmonicTiles) return;
  const maxPower = Math.max(1, ...fullSpectrum.slice(1).map(h => h.power));

  spectralHarmonicTiles.innerHTML = harmonics.map((h, i) => {
    const pct = (h.power / maxPower * 100).toFixed(1);
    return `
      <div class="spectral-harmonic-tile">
        <div class="spectral-harmonic-rank">H${i + 1}</div>
        <div class="spectral-harmonic-freq">${h.label}</div>
        <div class="spectral-harmonic-bar-wrap">
          <div class="spectral-harmonic-bar" style="width:${pct}%"></div>
        </div>
        <div class="spectral-harmonic-power">${pct}%</div>
      </div>
    `;
  }).join('');
}

// ── Spectral panel collapse toggle ────────────────────────

if (spectralCollapseBtn && spectralBodyEl) {
  spectralCollapseBtn.addEventListener('click', () => {
    spectralPanelOpen = !spectralPanelOpen;
    spectralBodyEl.classList.toggle('spectral-body--collapsed', !spectralPanelOpen);
    spectralCollapseBtn.textContent = spectralPanelOpen ? '▼' : '▲';
    spectralCollapseBtn.setAttribute('aria-expanded', String(spectralPanelOpen));
    spectralCollapseBtn.setAttribute('aria-label',
      spectralPanelOpen ? 'Collapse spectral panel' : 'Expand spectral panel');
  });
}
