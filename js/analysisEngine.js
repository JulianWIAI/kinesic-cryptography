/**
 * analysisEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core analysis pipeline for the Psycholinguistic Cluster Analyzer.
 *
 * Combines two data sources for each input word:
 *   1. Structural complexity metrics (sigma σ, word-sum Σ) from complexity.js
 *   2. Eight-dimensional NRC emotion intensity scores fetched from a
 *      per-language JSON lexicon file in ./lexicons/
 *
 * Exported functions:
 *   parseWordInput(rawInput) → string[]
 *     — Splits raw comma/newline-separated text into cleaned word tokens.
 *
 *   loadLexicon(langCode) → Promise<Object>
 *     — Async fetches and caches the NRC 8-D lexicon for the given language.
 *       Subsequent calls for the same langCode return from the in-memory cache.
 *
 *   runAnalysis(words, langCode) → Promise<ResultObject[]>
 *     — Async. Loads the appropriate lexicon, then maps each word token to a
 *       full result object containing structural and affective dimensions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Structural complexity metrics ─────────────────────────────────────────────
// analyzeComplexity(word) returns { wordSum, mean, sigma, tier, tierLabel, values }
import { analyzeComplexity } from './complexity.js';

// ── Emotion key list (shared constants — word data is now fetched) ─────────────
import { EMOTION_KEYS } from './affectLexicon.js';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ResultObject
 * @property {string} word        — trimmed, lowercased token (canonical key)
 * @property {string} displayWord — trimmed original casing (for display)
 * @property {number} sigma       — population standard deviation of letter values
 * @property {number} wordSum     — sum of all letter values
 * @property {number} anger       — NRC anger intensity [0, 1]
 * @property {number} fear        — NRC fear intensity [0, 1]
 * @property {number} anticipation — NRC anticipation intensity [0, 1]
 * @property {number} disgust     — NRC disgust intensity [0, 1]
 * @property {number} surprise    — NRC surprise intensity [0, 1]
 * @property {number} trust       — NRC trust intensity [0, 1]
 * @property {number} joy         — NRC joy intensity [0, 1]
 * @property {number} sadness     — NRC sadness intensity [0, 1]
 */

// ─────────────────────────────────────────────────────────────────────────────
// Lexicon fetch cache
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fully resolved lexicons keyed by langCode.
 * Once a lexicon is fetched it lives here for the lifetime of the page,
 * so subsequent analyses for the same language are synchronous.
 *
 * @type {Map<string, Object>}
 */
const _lexiconCache = new Map();

/**
 * In-flight fetch promises keyed by langCode.
 * Prevents duplicate parallel HTTP requests when runAnalysis() is called
 * multiple times before the first fetch resolves.
 *
 * @type {Map<string, Promise<Object>>}
 */
const _lexiconFetchInFlight = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// loadLexicon
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch (or return from cache) the NRC 8-D emotion lexicon for a language.
 *
 * File resolved from: ./lexicon/nrc_8d_{langCode}.json
 * Expected JSON shape: { "<word>": { anger, fear, anticipation, disgust,
 *                                    surprise, trust, joy, sadness }, … }
 *
 * On network or parse error the function logs a warning and returns an empty
 * object so the rest of the analysis pipeline can continue with 0.0 defaults.
 *
 * @param {string} langCode — 'en' | 'ar' | 'ru' | 'zh' | 'fa'
 * @returns {Promise<Object>} — word → emotion-vector mapping
 */
export async function loadLexicon(langCode) {
  // ── 1. Cache hit — return immediately ────────────────────────────────────
  if (_lexiconCache.has(langCode)) {
    return _lexiconCache.get(langCode);
  }

  // ── 2. In-flight dedup — reuse the pending promise ────────────────────────
  if (_lexiconFetchInFlight.has(langCode)) {
    return _lexiconFetchInFlight.get(langCode);
  }

  // ── 3. Start a new fetch ──────────────────────────────────────────────────
  const url = `./lexicon/nrc_8d_${langCode}.json`;

  const fetchPromise = fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
      }
      return response.json();
    })
    .then(data => {
      // Store in permanent cache, remove from in-flight registry
      _lexiconCache.set(langCode, data);
      _lexiconFetchInFlight.delete(langCode);
      return data;
    })
    .catch(err => {
      // Non-fatal: log and fall back to an empty lexicon so the pipeline
      // continues with 0.0 emotion defaults for all words.
      console.warn(`[loadLexicon] Failed to load "${langCode}" lexicon:`, err);
      _lexiconFetchInFlight.delete(langCode);

      // Cache the empty object to suppress repeated failing fetches
      const empty = {};
      _lexiconCache.set(langCode, empty);
      return empty;
    });

  // Register in-flight so parallel calls reuse this promise
  _lexiconFetchInFlight.set(langCode, fetchPromise);
  return fetchPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// parseWordInput
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse raw user input into an array of word tokens.
 *
 * Accepts comma-separated, newline-separated, or mixed input.
 * Each token is trimmed; empty strings after trimming are discarded.
 *
 * @param {string} rawInput — raw textarea / user input string
 * @returns {string[]}      — array of non-empty, untransformed word strings
 *
 * @example
 * parseWordInput("war, peace\nterror")
 * // → ['war', 'peace', 'terror']
 */
export function parseWordInput(rawInput) {
  if (typeof rawInput !== 'string') return [];

  return rawInput
    .split(/[,\n]+/)            // split on commas or newlines (one or more)
    .map(token => token.trim()) // strip surrounding whitespace
    .filter(token => token.length > 0); // discard empty tokens
}

// ─────────────────────────────────────────────────────────────────────────────
// runAnalysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the full psycholinguistic analysis pipeline over an array of word tokens.
 *
 * This function is async because it first fetches (or retrieves from cache)
 * the NRC 8-D lexicon for the requested language before performing analysis.
 *
 * For each token the function:
 *   1. Normalises to lowercase for lexicon lookup and metric computation.
 *   2. Retrieves structural complexity metrics (sigma, wordSum) via
 *      analyzeComplexity() — which uses the LETTER_MAP to score each character.
 *   3. Looks up the word in the fetched lexicon to obtain 8 emotion intensity
 *      floats; defaults each dimension to 0.0 if the word is not found.
 *   4. Assembles and returns a ResultObject.
 *
 * Words that are empty after normalisation are silently skipped.
 * Words not present in the lexicon are included with all-zero emotion vectors
 * so that structural complexity data is still plotted for them.
 *
 * @param {string[]} words    — array of raw word strings (output of parseWordInput)
 * @param {string}   langCode — language code for lexicon selection (default 'en')
 * @returns {Promise<ResultObject[]>}
 */
export async function runAnalysis(words, langCode = 'en') {
  // ── Fetch the appropriate lexicon ─────────────────────────────────────────
  // loadLexicon returns from cache on subsequent calls; no redundant fetches.
  const lexicon = await loadLexicon(langCode);

  /** @type {ResultObject[]} */
  const results = [];

  for (const rawWord of words) {
    // ── 1. Normalise ──────────────────────────────────────────────────────────
    const displayWord = rawWord.trim();
    const lower       = displayWord.toLowerCase();

    // Silently discard tokens that are empty after trimming
    if (lower.length === 0) continue;

    // ── 2. Structural complexity ───────────────────────────────────────────────
    // analyzeComplexity returns { wordSum, mean, sigma, tier, tierLabel, values }
    const complexity = analyzeComplexity(lower);
    const sigma      = complexity.sigma;
    const wordSum    = complexity.wordSum;

    // ── 3. Affect lookup ──────────────────────────────────────────────────────
    // If the word is not in the fetched lexicon, emotions default to {}
    // and each dimension is then set to 0.0 below.
    const emotions = lexicon[lower] ?? {};

    // Build the emotion sub-object with safe defaults for missing dimensions
    const emotionFields = {};
    for (const key of EMOTION_KEYS) {
      emotionFields[key] = typeof emotions[key] === 'number' ? emotions[key] : 0.0;
    }

    // ── 4. Assemble result ────────────────────────────────────────────────────
    results.push({
      word:        lower,
      displayWord: displayWord,
      sigma:       sigma,
      wordSum:     wordSum,
      ...emotionFields,
    });
  }

  return results;
}
