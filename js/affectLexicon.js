/**
 * affectLexicon.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NRC Emotion Intensity Lexicon — SIGINT / Tactical Context
 *
 * Provides shared constants for the 8-dimensional NRC affect model.
 * The actual word→emotion data is no longer stored here; it is fetched at
 * runtime from per-language JSON files via loadLexicon() in analysisEngine.js.
 *
 * Exports:
 *   EMOTION_KEYS      — canonical ordered list of the 8 emotion dimensions
 *   EMOTION_ABBR      — 3-letter abbreviations for compact UI rendering
 *   EMOTION_COLORS    — hex colour assigned to each emotion for charting
 *   EMOTION_RGBA      — [R, G, B] triples matching EMOTION_COLORS (for alpha ops)
 *   DEFAULT_COLOR     — fallback colour when no dominant emotion is found
 *   NEUTRAL_THRESHOLD — minimum dominant-emotion score to apply colouring
 *
 * Note: AFFECT_LEXICON has been removed.  Word data is now loaded asynchronously
 *   from ./lexicons/nrc_8d_{langCode}.json by loadLexicon() in analysisEngine.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Ordered list of the 8 NRC emotion dimensions ────────────────────────────
/** @type {string[]} */
export const EMOTION_KEYS = [
  'anger',
  'fear',
  'anticipation',
  'disgust',
  'surprise',
  'trust',
  'joy',
  'sadness',
];

// ─── 3-letter abbreviations used in compact table headers ────────────────────
/** @type {Object.<string, string>} */
export const EMOTION_ABBR = {
  anger:        'ANG',
  fear:         'FEA',
  anticipation: 'ANT',
  disgust:      'DIS',
  surprise:     'SUR',
  trust:        'TRU',
  joy:          'JOY',
  sadness:      'SAD',
};

// ─── Hex colours for each emotion (scatter plot dots, legend swatches) ────────
/** @type {Object.<string, string>} */
export const EMOTION_COLORS = {
  anger:        '#FF3333',
  fear:         '#9933FF',
  anticipation: '#FF8800',
  disgust:      '#88FF00',
  surprise:     '#FF00FF',
  trust:        '#00FFFF',
  joy:          '#FFD700',
  sadness:      '#3366FF',
};

// ─── RGB triples matching EMOTION_COLORS, used to build rgba() strings ────────
/** @type {Object.<string, number[]>} */
export const EMOTION_RGBA = {
  anger:        [255,  51,  51],
  fear:         [153,  51, 255],
  anticipation: [255, 136,   0],
  disgust:      [136, 255,   0],
  surprise:     [255,   0, 255],
  trust:        [  0, 255, 255],
  joy:          [255, 215,   0],
  sadness:      [ 51, 102, 255],
};

// ─── Fallback chart colour when dominant emotion score is below threshold ─────
/** @type {string} */
export const DEFAULT_COLOR = '#00c8ff';

// ─── Minimum dominant-emotion score required to colour a data point ───────────
/** @type {number} */
export const NEUTRAL_THRESHOLD = 0.5;

// ─── AFFECT_LEXICON removed ───────────────────────────────────────────────────
// Word data is now loaded at runtime per language from:
//   ./lexicons/nrc_8d_en.json  (English)
//   ./lexicons/nrc_8d_ar.json  (Arabic)
//   ./lexicons/nrc_8d_ru.json  (Russian)
//   ./lexicons/nrc_8d_zh.json  (Chinese)
//   ./lexicons/nrc_8d_fa.json  (Farsi)
//
// Use loadLexicon(langCode) from analysisEngine.js to obtain the data.
// ─────────────────────────────────────────────────────────────────────────────
