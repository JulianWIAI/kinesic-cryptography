/**
 * SOMATIC CIPHER DECODER — Entry Point v3
 *
 * Features: Grid View, Narrative View, Comparison Engine,
 *           Contextual Synthesis Panel, Category-based theming,
 *           Psycholinguistic Diagnostic Engine.
 */

import { decodeText }                              from './decoder.js';
import { renderDiagnostic, hideDiagnosticPanel }   from './diagnosticPanel.js';
import { updateWaveform, destroyWaveform }          from './waveform.js';

// ── App State ─────────────────────────────────────────────
const state = {
  view:          'grid',  // 'grid' | 'narrative' | 'stream'
  comparison:    false,
  synthesisOpen: true,
  decoded:       [],      // single-mode results
  decodedA:      [],      // comparison Word A
  decodedB:      [],      // comparison Word B
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

// Comparison input
const inputSectionComp    = document.getElementById('input-section-comparison');
const inputElA            = document.getElementById('cipher-input-a');
const inputElB            = document.getElementById('cipher-input-b');
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

// ── Event Listeners ───────────────────────────────────────

decodeBtn.addEventListener('click', handleDecodeSingle);
inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') handleDecodeSingle(); });

// Real-time waveform — fires on every keystroke in single mode
inputEl.addEventListener('input', handleWaveformSingle);

decodeBtnComp.addEventListener('click', handleDecodeComparison);
inputElA.addEventListener('keydown', e => { if (e.key === 'Enter') handleDecodeComparison(); });
inputElB.addEventListener('keydown', e => { if (e.key === 'Enter') handleDecodeComparison(); });

// Real-time waveform — fires on every keystroke in comparison mode
inputElA.addEventListener('input', handleWaveformComparison);
inputElB.addEventListener('input', handleWaveformComparison);

btnGridView.addEventListener('click', () => setView('grid'));
btnNarrView.addEventListener('click', () => setView('narrative'));
btnStreamView.addEventListener('click', () => setView('stream'));
btnCompMode.addEventListener('click', toggleComparisonMode);
synthesisToggleBtn.addEventListener('click', toggleSynthesisCollapse);

// ── Decode Handlers ───────────────────────────────────────

function handleDecodeSingle() {
  state.decoded = decodeText(inputEl.value);
  renderSingle();
  renderDiagnostic(inputEl.value, null);
}

function handleDecodeComparison() {
  state.decodedA = decodeText(inputElA.value);
  state.decodedB = decodeText(inputElB.value);
  renderComparison();
  renderDiagnostic(inputElA.value, inputElB.value);
}

// ── Waveform Handlers (real-time) ─────────────────────────

/**
 * Updates the waveform for single-input mode.
 * Fires on every `input` event so the chart tracks the user's typing live.
 */
function handleWaveformSingle() {
  const visible = updateWaveform(waveformCanvas, [
    { label: 'SIGNAL', text: inputEl.value },
  ]);
  setWaveformPanelVisible(visible);
}

/**
 * Updates the waveform for comparison mode — overlays both waveforms on one chart.
 */
function handleWaveformComparison() {
  const visible = updateWaveform(waveformCanvas, [
    { label: 'WORD A', text: inputElA.value },
    { label: 'WORD B', text: inputElB.value },
  ]);
  setWaveformPanelVisible(visible);
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
  clearAllOutputs();

  if (state.decoded.length === 0) {
    showEmptyState();
    hideSynthesisPanel();
    return;
  }

  hideEmptyState();
  updateOutputHeader(state.decoded, inputEl.value);

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
  } else {
    outputGrid.removeAttribute('hidden');
    state.decoded.forEach((item, i) => outputGrid.appendChild(createCardElement(item, i)));
  }

  populateSynthesis(state.decoded, null);
}

// ── Comparison Renderer ───────────────────────────────────

function renderComparison() {
  clearAllOutputs();

  if (state.decodedA.length === 0 && state.decodedB.length === 0) {
    showEmptyState();
    hideSynthesisPanel();
    return;
  }

  hideEmptyState();
  comparisonContainer.removeAttribute('hidden');
  comparisonContainer.appendChild(buildComparisonRow('a', inputElA.value, state.decodedA));

  const divider = document.createElement('div');
  divider.className = 'comparison-divider';
  comparisonContainer.appendChild(divider);

  comparisonContainer.appendChild(buildComparisonRow('b', inputElB.value, state.decodedB));

  populateSynthesis(state.decodedA, state.decodedB);
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

  if (state.decoded.length > 0) renderSingle();
}

// ── Comparison Mode Toggle ────────────────────────────────

function toggleComparisonMode() {
  state.comparison = !state.comparison;
  btnCompMode.classList.toggle('active', state.comparison);
  btnCompMode.setAttribute('aria-pressed', String(state.comparison));

  if (state.comparison) {
    inputSectionSingle.setAttribute('hidden', '');
    inputSectionComp.removeAttribute('hidden');
    viewTogglesEl.setAttribute('hidden', '');
  } else {
    inputSectionSingle.removeAttribute('hidden');
    inputSectionComp.setAttribute('hidden', '');
    viewTogglesEl.removeAttribute('hidden');
  }

  clearAllOutputs();
  showEmptyState();
  hideSynthesisPanel();
  // Reset waveform when switching modes — chart dataset count may change
  destroyWaveform();
  setWaveformPanelVisible(false);
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

  node.appendChild(charEl);
  node.appendChild(imagesEl);
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

function clearAllOutputs() {
  outputGrid.innerHTML          = '';
  narrativeTimeline.innerHTML   = '';
  wordStreamContainer.innerHTML = '';
  comparisonContainer.innerHTML = '';

  outputGrid.setAttribute('hidden', '');
  narrativeContainer.setAttribute('hidden', '');
  wordStreamContainer.setAttribute('hidden', '');
  comparisonContainer.setAttribute('hidden', '');
  outputHeader.setAttribute('hidden', '');

  // Also reset the diagnostic panel
  hideDiagnosticPanel();
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
  const isFace = type === 'face';
  const label  = isFace ? 'Facial Articulation Stream' : 'Somatic Posture Stream';

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
  const imgSrc        = type === 'face' ? faceImg : bodyImg;
  const altText       = `${type === 'face' ? 'Facial articulation' : 'Somatic posture'} for ${displayChar}`;
  const categoryClass = data?.category ? (CATEGORY_CLASS[data.category] ?? '') : '';

  const node = document.createElement('div');
  node.className = ['word-stream-node', categoryClass].filter(Boolean).join(' ');
  node.setAttribute('aria-label', `${displayChar} — ${data?.category ?? 'no data'}`);
  node.style.setProperty('--card-index', index);

  const charEl = document.createElement('div');
  charEl.className = 'word-stream-node-char';
  charEl.textContent = displayChar;
  charEl.setAttribute('aria-hidden', 'true');

  const imgWrap = document.createElement('div');
  imgWrap.className = 'word-stream-node-img-wrap';
  imgWrap.appendChild(buildImg(imgSrc, altText, 'word-stream-node-img', imgWrap));

  const categoryEl = document.createElement('span');
  categoryEl.className = 'word-stream-node-category';
  categoryEl.textContent = data?.category ?? '';

  node.appendChild(charEl);
  node.appendChild(imgWrap);
  node.appendChild(categoryEl);
  return node;
}
