/**
 * vad.js — Multilingual NRC VAD Lexicon Integration Module
 *
 * Provides lazy-loaded access to the NRC Valence–Arousal–Dominance (VAD)
 * lexicons for English, German, Spanish, Arabic, and Chinese.
 *
 * Based on the NRC VAD Lexicon methodology:
 *   Mohammad, S.M. (2018). Obtaining Reliable Human Ratings of Valence,
 *   Arousal, and Dominance for 20,000 English Words. ACL 2018.
 *
 * Exported API:
 *   loadVadLexicon(langCode)         → Promise<Object>
 *   getVadLangCode(text, stateLang)  → string
 *   analyzeVad(text, stateLang)      → Promise<Array<{word, v, a, d}>>
 */

// ── Module-level cache ───────────────────────────────────────────────────────
// Stores already-fetched lexicons so we never re-request the same file.
// Keys are lang codes like 'en', 'de', 'es', 'ar', 'zh'.
// Values are the parsed JSON objects (word → { v, a, d }).
const _lexiconCache = {};

// ── In-flight promise cache ──────────────────────────────────────────────────
// Tracks pending fetch Promises to avoid duplicate concurrent requests.
// If two callers request the same lexicon simultaneously, they share one fetch.
const _loadingPromises = {};

// ── Lexicon path mapping ─────────────────────────────────────────────────────
// Maps language codes to their respective JSON file paths,
// relative to the project root (served via the web server).
const VAD_PATHS = {
  en: 'data/vad-en.json',
  de: 'data/vad-de.json',
  es: 'data/vad-es.json',
  fr: 'data/vad-fr.json',
  it: 'data/vad-it.json',
  ar: 'data/vad-ar.json',
  zh: 'data/vad-zh.json',
  ja: 'data/vad-ja.json',
  ko: 'data/vad-ko.json',
};

// ── Unicode range constants ──────────────────────────────────────────────────
// Arabic Unicode block: U+0600–U+06FF (Basic Arabic)
const ARABIC_RE = /[\u0600-\u06FF]/;

// CJK Unified Ideographs: U+4E00–U+9FFF (core CJK block)
const CJK_RE    = /[\u4E00-\u9FFF]/;

// Japanese: Hiragana U+3040–U+309F and Katakana U+30A0–U+30FF
const JAPANESE_RE = /[\u3040-\u309F\u30A0-\u30FF]/;

// Korean: Hangul Syllables U+AC00–U+D7AF and Hangul Jamo U+1100–U+11FF
const KOREAN_RE = /[\uAC00-\uD7AF\u1100-\u11FF]/;

// German-specific characters: umlauts and Eszett
const GERMAN_CHAR_RE = /[äöüÄÖÜß]/;

// Common high-frequency German function words used as a secondary signal
// when no umlaut characters are present.
const GERMAN_WORDS = new Set([
  'der', 'die', 'das', 'und', 'ist', 'nicht', 'mit', 'von',
  'sie', 'er', 'wir', 'ich', 'ein', 'eine', 'auf', 'für',
  'den', 'dem', 'des', 'aber', 'oder', 'war', 'bei', 'noch',
]);

// Spanish-specific characters and punctuation
const SPANISH_CHAR_RE = /[ñÑ¿¡]/;

// Common high-frequency Spanish function words used as a fallback signal.
const SPANISH_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'es', 'son', 'de',
  'en', 'que', 'con', 'por', 'para', 'del', 'al', 'se', 'lo',
  'le', 'su', 'una', 'no', 'si', 'como', 'pero', 'más', 'ya',
]);

// French-specific accented characters (beyond basic Latin-1 letters shared
// with other Romance languages — ç and œ are strong French signals).
const FRENCH_CHAR_RE = /[çœÇŒ]/;

// Common high-frequency French function words used as a fallback signal.
const FRENCH_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'au', 'aux',
  'et', 'est', 'sont', 'pas', 'que', 'qui', 'ne', 'se', 'sur',
  'par', 'mais', 'ou', 'donc', 'je', 'tu', 'il', 'nous', 'vous',
]);


/**
 * loadVadLexicon
 * ─────────────
 * Lazily loads a VAD lexicon JSON file for the given language code.
 * Results are cached in-memory; subsequent calls return instantly.
 *
 * @param  {string} langCode  One of: 'en', 'de', 'es', 'ar', 'zh'
 * @returns {Promise<Object>} Resolves to { word: { v, a, d }, ... }
 */
export async function loadVadLexicon(langCode) {
  // Return immediately if already cached.
  if (_lexiconCache[langCode]) {
    return _lexiconCache[langCode];
  }

  // If a fetch is already in-flight for this language, await the same promise.
  if (_loadingPromises[langCode]) {
    return _loadingPromises[langCode];
  }

  // Validate the lang code before attempting fetch.
  const path = VAD_PATHS[langCode];
  if (!path) {
    console.warn(`[vad.js] Unknown language code: "${langCode}". Falling back to English.`);
    return loadVadLexicon('en');
  }

  // Create and store the fetch promise so concurrent callers can share it.
  _loadingPromises[langCode] = (async () => {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading ${path}`);
      }
      const data = await response.json();
      // Store in cache and remove the in-flight marker.
      _lexiconCache[langCode] = data;
      delete _loadingPromises[langCode];
      return data;
    } catch (err) {
      // Clean up the in-flight entry so future calls can retry.
      delete _loadingPromises[langCode];
      console.error(`[vad.js] Failed to load lexicon for "${langCode}":`, err);
      // Return an empty object so callers still get a valid (empty) result.
      return {};
    }
  })();

  return _loadingPromises[langCode];
}


/**
 * getVadLangCode
 * ──────────────
 * Determines the most appropriate VAD lexicon language based on
 * (1) the explicit stateLanguage setting from app state, and
 * (2) Unicode character heuristics within the text itself.
 *
 * Detection priority order:
 *  1. Explicit 'arabic'   → 'ar'
 *  2. Explicit 'chinese'  → 'zh'
 *  3. Explicit 'japanese' → 'ja'
 *  4. Explicit 'korean'   → 'ko'
 *  5. Explicit 'french'   → 'fr'
 *  6. Arabic Unicode chars in text    → 'ar'
 *  7. CJK Unicode chars in text       → 'zh'
 *  8. Hiragana/Katakana chars in text → 'ja'
 *  9. Hangul chars in text            → 'ko'
 * 10. German umlauts or common DE words → 'de'
 * 11. Spanish ñ/¡/¿ or common ES words  → 'es'
 * 12. French ç/œ or common FR words     → 'fr'
 * 13. Default → 'en'
 *
 * @param  {string} text          The raw input text to analyse.
 * @param  {string} stateLanguage The app's current state.language value.
 * @returns {string} Language code: 'en'|'de'|'es'|'fr'|'ar'|'zh'|'ja'|'ko'
 */
export function getVadLangCode(text, stateLanguage) {
  // ── 0. Direct ISO code passthrough (used by comparison engine) ───────────
  // If stateLanguage is already a known ISO-639-1 code, use it directly.
  if (VAD_PATHS[stateLanguage]) return stateLanguage;

  // ── 1. Honour explicit language setting for non-ambiguous scripts ─────────
  if (stateLanguage === 'arabic')   return 'ar';
  if (stateLanguage === 'chinese')  return 'zh';
  if (stateLanguage === 'japanese') return 'ja';
  if (stateLanguage === 'korean')   return 'ko';
  if (stateLanguage === 'french')   return 'fr';

  // ── 2. Script-based Unicode detection (always reliable) ──────────────────
  if (ARABIC_RE.test(text))   return 'ar';
  if (CJK_RE.test(text))      return 'zh';
  if (JAPANESE_RE.test(text)) return 'ja';
  if (KOREAN_RE.test(text))   return 'ko';

  // ── 3. German detection: character-level then word-level ─────────────────
  if (GERMAN_CHAR_RE.test(text)) return 'de';

  // Check a token sample for common function words across Latin languages.
  const tokens = text.toLowerCase().split(/[\s\p{P}]+/u).filter(t => t.length > 1);
  const germanHits = tokens.filter(t => GERMAN_WORDS.has(t)).length;
  if (germanHits >= 2) return 'de';

  // ── 4. Spanish detection: character-level then word-level ─────────────────
  if (stateLanguage === 'spanish') return 'es';
  if (SPANISH_CHAR_RE.test(text))  return 'es';

  const spanishHits = tokens.filter(t => SPANISH_WORDS.has(t)).length;
  if (spanishHits >= 2) return 'es';

  // ── 5. French detection: character-level then word-level ──────────────────
  if (FRENCH_CHAR_RE.test(text)) return 'fr';

  const frenchHits = tokens.filter(t => FRENCH_WORDS.has(t)).length;
  if (frenchHits >= 2) return 'fr';

  // ── 6. Default to English ─────────────────────────────────────────────────
  return 'en';
}


/**
 * _tokenize
 * ─────────
 * Internal helper: splits text into clean word tokens for lexicon lookup.
 * Handles five distinct tokenization strategies:
 *  - Latin scripts (en/de/es/fr): whitespace + punctuation split, lowercase.
 *  - Arabic: whitespace split, filter to tokens containing Arabic chars.
 *  - Chinese: character-by-character, filter to CJK range.
 *  - Japanese: whitespace split filtered to kana/kanji; falls back to
 *    individual kana/kanji characters for unsegmented text.
 *  - Korean: whitespace split, filter to tokens containing Hangul chars.
 *
 * @param  {string} text      Raw input string.
 * @param  {string} langCode  'en'|'de'|'es'|'fr'|'ar'|'zh'|'ja'|'ko'
 * @returns {string[]}        Array of cleaned token strings.
 */
function _tokenize(text, langCode) {
  if (langCode === 'zh') {
    // Chinese: each CJK character is its own token.
    return [...text].filter(ch => CJK_RE.test(ch));
  }

  if (langCode === 'ar') {
    // Arabic: split on whitespace, keep tokens containing Arabic characters.
    return text.split(/\s+/).filter(t => ARABIC_RE.test(t));
  }

  if (langCode === 'ja') {
    // Japanese: prefer whitespace-segmented words (hiragana/katakana/kanji).
    // If the text has no spaces (unsegmented), fall back to individual
    // kana and kanji characters as tokens.
    const words = text.split(/\s+/).filter(t => JAPANESE_RE.test(t) || CJK_RE.test(t));
    if (words.length > 0) return words;
    return [...text].filter(ch => JAPANESE_RE.test(ch) || CJK_RE.test(ch));
  }

  if (langCode === 'ko') {
    // Korean: space-separated Hangul words.
    return text.split(/\s+/).filter(t => KOREAN_RE.test(t));
  }

  // Latin scripts (en, de, es, fr):
  // Split on any non-word character (whitespace, punctuation, digits).
  // Lowercase and filter out single-character tokens.
  return text
    .toLowerCase()
    .split(/[^a-záéíóúüäöïëàèâêôûùñßçÿœæ'-]+/i)
    .map(t => t.replace(/^'+|'+$/g, ''))   // strip leading/trailing apostrophes
    .filter(t => t.length > 1);
}


/**
 * analyzeVad
 * ──────────
 * Main entry point for VAD analysis.
 * Tokenizes the input text, auto-detects language (or uses stateLanguage),
 * loads the appropriate lexicon, then returns matched word entries.
 *
 * @param  {string} text          Raw input text to analyse.
 * @param  {string} stateLanguage The app's current state.language value.
 * @returns {Promise<Array<{word: string, v: number, a: number, d: number}>>}
 *          Array of VAD entries for each token found in the lexicon.
 *          Tokens not in the lexicon are silently skipped.
 */
export async function analyzeVad(text, stateLanguage) {
  // Guard: empty or non-string input returns empty results immediately.
  if (!text || typeof text !== 'string' || !text.trim()) {
    return [];
  }

  // Determine which lexicon to load.
  const langCode = getVadLangCode(text, stateLanguage);

  // Load (or retrieve from cache) the lexicon.
  const lexicon = await loadVadLexicon(langCode);

  // Tokenize the text using the language-appropriate strategy.
  const tokens = _tokenize(text, langCode);

  // Look up each token in the lexicon.
  // For Arabic/Chinese, try exact match first.
  // For Latin scripts, also try the capitalised form (for German nouns, etc.).
  const results = [];
  // Track matched words to avoid duplicating the same word multiple times
  // in the results when it appears several times in the text.
  // We keep ALL occurrences (not deduplicated) so aggregate stats are accurate.
  for (const token of tokens) {
    let entry = lexicon[token];

    // For Latin scripts: also check Title-cased form (German nouns are capitalized).
    if (!entry && (langCode === 'de' || langCode === 'es')) {
      const titleCased = token.charAt(0).toUpperCase() + token.slice(1);
      entry = lexicon[titleCased];
    }

    if (entry) {
      results.push({
        word:  token,
        v:     entry.v,
        a:     entry.a,
        d:     entry.d,
      });
    }
  }

  return results;
}
