// js/pipeline.js — Global Localization Bridge
// Converts Japanese (→ Romaji via Kuroshiro) and Chinese (→ Pinyin via pinyin-pro)
// before feeding text into the physics / decoder engine.

// ── Pinyin state ───────────────────────────────────────────
let _pinyinFn   = null;
let _pinyinProm = null;

// ── Kuroshiro state ────────────────────────────────────────
let _kuroshiroInst  = null;
let _kuroshiroReady = false;
let _kuroshiroProm  = null;

// ── Language Detection ─────────────────────────────────────

/**
 * Heuristic: Hiragana/Katakana → Japanese, CJK Unified Ideographs → Chinese.
 * @param {string} text
 * @returns {'western'|'japanese'|'chinese'}
 */
export function detectLanguage(text) {
  if (!text) return 'western';
  if (/[぀-ゟ゠-ヿ]/.test(text)) return 'japanese';
  if (/[一-鿿㐀-䶿豈-﫿]/.test(text)) return 'chinese';
  return 'western';
}

// ── Pinyin (lazy ESM load via esm.sh) ─────────────────────

async function _ensurePinyin() {
  if (_pinyinFn) return;
  if (_pinyinProm) return _pinyinProm;
  _pinyinProm = import('https://esm.sh/pinyin-pro@3').then(m => {
    _pinyinFn = m.pinyin;
  });
  return _pinyinProm;
}

// ── Kuroshiro init ─────────────────────────────────────────

/**
 * Initialise Kuroshiro + Kuromoji dictionary (~8 MB, one-time download).
 * @param {((msg: string) => void)|null} onStatus  Receives status strings.
 */
export async function initKuroshiro(onStatus) {
  if (_kuroshiroReady) return;
  if (_kuroshiroProm) return _kuroshiroProm;

  onStatus?.('LOADING JP DICTIONARY…');

  _kuroshiroProm = (async () => {
    const KuroshiroClass = (typeof window.Kuroshiro === 'function')
      ? window.Kuroshiro
      : window.Kuroshiro?.default;
    const AnalyzerClass = (typeof window.KuromojiAnalyzer === 'function')
      ? window.KuromojiAnalyzer
      : window.KuromojiAnalyzer?.default;

    if (!KuroshiroClass || !AnalyzerClass) {
      throw new Error('Kuroshiro CDN scripts failed to load — check network.');
    }

    const k = new KuroshiroClass();
    await k.init(new AnalyzerClass({
      dictPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict',
    }));

    _kuroshiroInst  = k;
    _kuroshiroReady = true;
    onStatus?.('READY');
  })();

  return _kuroshiroProm;
}

/** @returns {boolean} */
export function isKuroshiroReady() { return _kuroshiroReady; }

// ── Transliterators ────────────────────────────────────────

async function _toPinyin(text) {
  await _ensurePinyin();
  return _pinyinFn(text, { toneType: 'none', separator: ' ' });
}

async function _toRomaji(text) {
  if (!_kuroshiroReady) throw new Error('Kuroshiro not initialised.');
  return _kuroshiroInst.convert(text, { to: 'romaji', mode: 'spaced' });
}

// ── Normaliser ─────────────────────────────────────────────

/**
 * NFD-decompose → strip combining diacriticals (tone marks, accents) →
 * lowercase → keep only a–z and 0–9.
 * @param {string} text
 * @returns {string}
 */
function _normalise(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // drop all combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// ── Public API ─────────────────────────────────────────────

/**
 * Process one text token through the localization bridge.
 *
 * @param {string} rawText
 * @param {'auto'|'western'|'japanese'|'chinese'} languageMode
 * @returns {Promise<{
 *   mode:        'western'|'japanese'|'chinese',
 *   latinized:   string,   // human-readable Romaji/Pinyin (shown in UI)
 *   engineInput: string,   // stripped a–z 0–9 fed to the physics engine
 * }>}
 */
export async function processInput(rawText, languageMode) {
  const mode = languageMode === 'auto' ? detectLanguage(rawText) : languageMode;

  if (mode === 'western') {
    return { mode, latinized: rawText, engineInput: rawText };
  }

  const latinized = mode === 'chinese'
    ? await _toPinyin(rawText)
    : await _toRomaji(rawText);

  return { mode, latinized, engineInput: _normalise(latinized) };
}
