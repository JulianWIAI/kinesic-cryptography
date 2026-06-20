// js/pipeline.js — Global Localization Bridge v2
//
// Supported modes:
//   western   — pass-through (A-Z, 0-9)
//   japanese  — Hiragana/Katakana → Romaji  (Kuroshiro CDN, lazy-loaded)
//   chinese   — CJK → Pinyin               (pinyin-pro ESM, lazy-loaded)
//   cyrillic  — Cyrillic → Latin           (built-in map, synchronous)
//   arabic    — Arabic / Farsi → Arabizi   (built-in map, synchronous)
//   korean    — Hangul → Romaja RR         (built-in decomposition, synchronous)

// ── CDN-backed state ───────────────────────────────────────

let _pinyinFn   = null;
let _pinyinProm = null;

let _kuroshiroInst  = null;
let _kuroshiroReady = false;
let _kuroshiroProm  = null;

// ── Language Detection ─────────────────────────────────────

/**
 * Heuristic script detector.  Returns the dominant non-Latin script found,
 * or 'western' if the text is already Latin / digit-only.
 * @param {string} text
 * @returns {'western'|'japanese'|'chinese'|'cyrillic'|'arabic'|'korean'}
 */
export function detectLanguage(text) {
  if (!text) return 'western';
  if (/[぀-ゟ゠-ヿ]/.test(text))                                return 'japanese';
  if (/[一-鿿㐀-䶿豈-﫿]/.test(text))                            return 'chinese';
  if (/[Ѐ-ӿ]/.test(text))                             return 'cyrillic';
  if (/[؀-ۿﭐ-﷿ﹰ-﻿]/.test(text))  return 'arabic';
  if (/[가-힣ᄀ-ᇿ㄰-㆏]/.test(text))  return 'korean';
  return 'western';
}

// ══════════════════════════════════════════════════════════
//  TASK 2 — Cyrillic → Latin
// ══════════════════════════════════════════════════════════

/**
 * ISO 9 / BGN-PCGN inspired table.
 * Multi-character digraphs (zh, sh, etc.) come from single Cyrillic letters.
 * Soft/hard signs → '' so they vanish after normalisation.
 */
const _CYRILLIC_MAP = {
  // ── lowercase ──────────────────────────────────────────
  'а':'a',   'б':'b',    'в':'v',    'г':'g',    'д':'d',
  'е':'e',   'ё':'yo',   'ж':'zh',   'з':'z',    'и':'i',
  'й':'y',   'к':'k',    'л':'l',    'м':'m',    'н':'n',
  'о':'o',   'п':'p',    'р':'r',    'с':'s',    'т':'t',
  'у':'u',   'ф':'f',    'х':'kh',   'ц':'ts',   'ч':'ch',
  'ш':'sh',  'щ':'shch', 'ъ':'',     'ы':'y',    'ь':'',
  'э':'e',   'ю':'yu',   'я':'ya',
  // ── uppercase ──────────────────────────────────────────
  'А':'a',   'Б':'b',    'В':'v',    'Г':'g',    'Д':'d',
  'Е':'e',   'Ё':'yo',   'Ж':'zh',   'З':'z',    'И':'i',
  'Й':'y',   'К':'k',    'Л':'l',    'М':'m',    'Н':'n',
  'О':'o',   'П':'p',    'Р':'r',    'С':'s',    'Т':'t',
  'У':'u',   'Ф':'f',    'Х':'kh',   'Ц':'ts',   'Ч':'ch',
  'Ш':'sh',  'Щ':'shch', 'Ъ':'',     'Ы':'y',    'Ь':'',
  'Э':'e',   'Ю':'yu',   'Я':'ya',
  // ── Ukrainian / Bulgarian extras ───────────────────────
  'і':'i',   'ї':'yi',   'є':'ye',   'ґ':'g',
  'І':'i',   'Ї':'yi',   'Є':'ye',   'Ґ':'g',
};

/**
 * Synchronous Cyrillic → Latin transliteration.
 * Unknown characters (Latin digits, spaces) are passed through unchanged;
 * _normalise strips everything non-Latin afterwards.
 * @param {string} text
 * @returns {string}
 */
function _cyrillicToLatin(text) {
  return [...text].map(ch => _CYRILLIC_MAP[ch] ?? ch).join('');
}

// ══════════════════════════════════════════════════════════
//  TASK 2 — Arabic / Farsi → Arabizi (Latin)
// ══════════════════════════════════════════════════════════

/**
 * Tashkeel (vowel diacritics) + Quranic annotation marks.
 * Stripping these first keeps consonant-skeleton mapping clean.
 */
const _ARABIC_DIACRITICS = /[ً-ٰٟٱۖ-ۜ۟-۪ۤۧۨ-ۭ]/g;

/**
 * Canonical Arabic/Farsi → Latin (Arabizi / Fingilish) map.
 * Covers the Arabic Unicode block (U+0600–U+06FF) and the most common
 * Arabic-Indic digits.  Presentation forms (FB50–FEFF) are collapsed to
 * their canonical equivalents via NFKC before this map is applied.
 */
const _ARABIC_MAP = {
  // ── Alef / Hamza family ────────────────────────────────
  'ا':'a',  'أ':'a',  'إ':'i',  'آ':'a',  'ٱ':'a',
  'ء':'',   'ئ':'y',  'ؤ':'w',
  // ── Core consonants ────────────────────────────────────
  'ب':'b',
  'ت':'t',  'ث':'th',
  'ج':'j',  'ح':'h',  'خ':'kh',
  'د':'d',  'ذ':'dh',
  'ر':'r',  'ز':'z',
  'س':'s',  'ش':'sh',
  // Emphatics → simplified Latin equivalents
  'ص':'s',  'ض':'d',  'ط':'t',  'ظ':'z',
  // Pharyngeals / uvulars
  'ع':'a',  'غ':'gh',
  'ف':'f',  'ق':'q',
  'ك':'k',  'ل':'l',  'م':'m',  'ن':'n',
  'ه':'h',  'ة':'h',  // ta marbuta
  'و':'w',
  'ي':'y',  'ى':'a',  // alef maqsura
  // ── Arabic-Indic digits → ASCII ────────────────────────
  '٠':'0','١':'1','٢':'2','٣':'3','٤':'4',
  '٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
  // ── Farsi / Persian extras ─────────────────────────────
  'پ':'p',  'چ':'ch', 'ژ':'zh', 'گ':'g',
  'ک':'k',             // Farsi kaf (U+06A9)
  'ی':'y',             // Farsi yeh (U+06CC)
  // ── Extended Arabic (Urdu, Pashto, etc.) ───────────────
  'ڈ':'d',  'ڑ':'r',  'ں':'n',  'ھ':'h',  'ڤ':'v',
  'ڡ':'f',  'ڪ':'k',  'ڥ':'v',
};

/**
 * Synchronous Arabic/Farsi → Latin transliteration.
 * 1. NFKC-normalise (collapses presentation forms → canonical Arabic codepoints)
 * 2. Strip tashkeel
 * 3. Map consonant skeleton to Latin; unknown non-Arabic chars pass through
 * @param {string} text
 * @returns {string}
 */
function _arabicToLatin(text) {
  const canonical = text.normalize('NFKC');
  const clean     = canonical.replace(_ARABIC_DIACRITICS, '');
  return [...clean].map(ch => _ARABIC_MAP[ch] ?? ch).join('');
}

// ══════════════════════════════════════════════════════════
//  TASK 3 — Korean Hangul → Romaja (Revised Romanization)
// ══════════════════════════════════════════════════════════

/**
 * 19 Choseong (initial consonants) — index matches syllable decomposition.
 */
const _CHO = [
  'g','kk','n','d','tt','r','m','b','pp',
  's','ss','','j','jj','ch','k','t','p','h',
];

/**
 * 21 Jungseong (vowels).
 */
const _JUNG = [
  'a','ae','ya','yae','eo','e','yeo','ye',
  'o','wa','wae','oe','yo',
  'u','wo','we','wi','yu','eu','ui','i',
];

/**
 * 28 Jongseong (final consonants); index 0 = no final.
 */
const _JONG = [
  '','k','kk','ks','n','nj','nh','t',
  'l','lg','lm','lb','ls','lt','lp','lh',
  'm','p','ps','s','ss','ng','j','ch','k','t','p','h',
];

/**
 * Compatibility Jamo (U+3130–U+318F) → Romaja for individual jamo characters
 * that appear outside syllable blocks.
 */
const _JAMO_MAP = {
  'ㄱ':'g',  'ㄲ':'kk', 'ㄴ':'n',  'ㄷ':'d',  'ㄸ':'tt', 'ㄹ':'r',
  'ㅁ':'m',  'ㅂ':'b',  'ㅃ':'pp', 'ㅅ':'s',  'ㅆ':'ss', 'ㅇ':'',
  'ㅈ':'j',  'ㅉ':'jj', 'ㅊ':'ch', 'ㅋ':'k',  'ㅌ':'t',  'ㅍ':'p',  'ㅎ':'h',
  'ㅏ':'a',  'ㅐ':'ae', 'ㅑ':'ya', 'ㅒ':'yae','ㅓ':'eo', 'ㅔ':'e',
  'ㅕ':'yeo','ㅖ':'ye', 'ㅗ':'o',  'ㅘ':'wa', 'ㅙ':'wae','ㅚ':'oe',
  'ㅛ':'yo', 'ㅜ':'u',  'ㅝ':'wo', 'ㅞ':'we', 'ㅟ':'wi', 'ㅠ':'yu',
  'ㅡ':'eu', 'ㅢ':'ui', 'ㅣ':'i',
};

/**
 * Synchronous Hangul → Romaja (Revised Romanization) conversion.
 * Uses the Unicode mathematical syllable decomposition:
 *   syllable index = (cho × 21 + jung) × 28 + jong
 * Syllable block range: U+AC00–U+D7A3.
 * Individual Jamo (U+3130–U+318F) mapped via _JAMO_MAP.
 * All other characters (Latin, digits) pass through unchanged.
 * @param {string} text
 * @returns {string}
 */
function _hangulToRomaja(text) {
  return [...text].map(ch => {
    const cp = ch.codePointAt(0);
    if (cp >= 0xAC00 && cp <= 0xD7A3) {
      const idx  = cp - 0xAC00;
      const cho  = Math.floor(idx / (21 * 28));
      const jung = Math.floor((idx % (21 * 28)) / 28);
      const jong = idx % 28;
      return _CHO[cho] + _JUNG[jung] + _JONG[jong];
    }
    if (ch in _JAMO_MAP) return _JAMO_MAP[ch];
    return ch;
  }).join('');
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

async function _toPinyin(text) {
  await _ensurePinyin();
  return _pinyinFn(text, { toneType: 'none', separator: ' ' });
}

// ── Kuroshiro (lazy CDN init — ~8 MB Kuromoji dict) ────────

/**
 * Initialise Kuroshiro + Kuromoji dictionary (one-time download).
 * @param {((msg: string) => void)|null} onStatus
 */
export async function initKuroshiro(onStatus) {
  if (_kuroshiroReady) return;
  if (_kuroshiroProm)  return _kuroshiroProm;

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

async function _toRomaji(text) {
  if (!_kuroshiroReady) throw new Error('Kuroshiro not initialised.');
  return _kuroshiroInst.convert(text, { to: 'romaji', mode: 'spaced' });
}

// ── Normaliser ─────────────────────────────────────────────

/**
 * NFD-decompose → strip all combining diacriticals → lowercase →
 * keep only a–z and 0–9.
 * This is the final gatekeeping step before the physics engine.
 * @param {string} text
 * @returns {string}
 */
function _normalise(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// ══════════════════════════════════════════════════════════
//  TASK 4 — Public API / Router
// ══════════════════════════════════════════════════════════

/**
 * Process one text token through the full localization bridge.
 *
 * Routing:
 *   western  → identity pass-through
 *   japanese → Kuroshiro (async CDN)
 *   chinese  → pinyin-pro (async ESM)
 *   cyrillic → _cyrillicToLatin (sync map)
 *   arabic   → _arabicToLatin  (sync map + NFKC + tashkeel strip)
 *   korean   → _hangulToRomaja (sync Unicode decomposition)
 *
 * All synchronous converters run off the call stack within a single
 * microtask — they never block the main UI thread.
 *
 * @param {string} rawText
 * @param {'auto'|'western'|'japanese'|'chinese'|'cyrillic'|'arabic'|'korean'} languageMode
 * @returns {Promise<{
 *   mode:        string,   // effective language mode used
 *   latinized:   string,   // human-readable result shown in Base Signal box
 *   engineInput: string,   // stripped a–z 0–9 fed to physics engine
 * }>}
 */
export async function processInput(rawText, languageMode) {
  const mode = (languageMode === 'auto') ? detectLanguage(rawText) : languageMode;

  // ── Identity pass ──────────────────────────────────────
  if (mode === 'western') {
    return { mode, latinized: rawText, engineInput: rawText };
  }

  // ── CDN-backed (async) ─────────────────────────────────
  if (mode === 'japanese') {
    const latinized = await _toRomaji(rawText);
    return { mode, latinized, engineInput: _normalise(latinized) };
  }

  if (mode === 'chinese') {
    const latinized = await _toPinyin(rawText);
    return { mode, latinized, engineInput: _normalise(latinized) };
  }

  // ── Built-in maps (synchronous, wrapped in Promise for uniform API) ─
  if (mode === 'cyrillic') {
    const latinized = _cyrillicToLatin(rawText);
    return { mode, latinized, engineInput: _normalise(latinized) };
  }

  if (mode === 'arabic') {
    const latinized = _arabicToLatin(rawText);
    return { mode, latinized, engineInput: _normalise(latinized) };
  }

  if (mode === 'korean') {
    const latinized = _hangulToRomaja(rawText);
    return { mode, latinized, engineInput: _normalise(latinized) };
  }

  // ── Fallback ───────────────────────────────────────────
  return { mode: 'western', latinized: rawText, engineInput: rawText };
}
