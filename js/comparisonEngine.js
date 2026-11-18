/**
 * comparisonEngine.js — Multilingual Comparison Orchestrator
 *
 * Takes raw user input, detects its language, translates it into every
 * selected target language, then runs the full psycholinguistic analysis
 * pipeline on each translation.
 *
 * Returns a structured ComparisonResult[] — one entry per language —
 * which comparisonLayout.js renders into the comparison grid.
 *
 * Exported API:
 *   runComparison(text, selectedLangs, mode) → Promise<ComparisonResult[]>
 *
 * ComparisonResult shape:
 * {
 *   lang, label,
 *   inputText,         // original user input
 *   translatedText,    // native-script translation
 *   latinizedText,     // romanized version (for character-level analysis)
 *   engineInput,       // stripped a-z 0-9 fed to physics engine
 *   isSource,          // true if this IS the input language
 *   vad:    { perWord: [{word,v,a,d}], aggregate: {v,a,d} },
 *   pds:    { words: [...], aggregate: {power,danger,structure}, apexThreats: [...] },
 *   emotions8d: { perWord: ResultObject[], aggregate: {anger,fear,...} },
 *   letterValues: number[],
 *   wordStats:    { wordSum, mean, sigma, tier, tierLabel } | null,
 *   spectral:     { powerSpectrum: [...], microWave: [...] },
 * }
 */

import { detectInputLanguage }                      from './languageDetector.js';
import { translate }                                from './translator.js';
import { processInput }                             from './pipeline.js';
import { analyzeVad }                               from './vad.js';
import { computePdsWords, computeAggregatePds, detectApexThreats } from './ousiometrics.js';
import { runAnalysis }                              from './analysisEngine.js';
import { extractLetterValues, analyzeWord, runSpectralAnalysis } from './physics.js';

// ── COMPARISON_LANGS metadata (also in languageDetector.js, re-imported here) ─
const _LANG_LABELS = {
  en: 'English', de: 'German', fr: 'French',
  es: 'Spanish', it: 'Italian', ja: 'Japanese',
};

/**
 * Map our language codes to the existing pipeline.js language modes.
 * pipeline.js detectLanguage() returns 'western' for all Latin-script languages.
 * For Japanese it returns 'japanese'.
 */
function _toPipelineMode(lang) {
  return lang === 'ja' ? 'japanese' : 'western';
}

/**
 * Aggregate an array of per-word emotion objects into one mean vector.
 * Missing words (no lexicon hit) are skipped so they don't dilute averages.
 */
function _aggregateEmotions(perWord) {
  const keys = ['anger','fear','anticipation','disgust','surprise','trust','joy','sadness'];
  const sums  = Object.fromEntries(keys.map(k => [k, 0]));
  let count = 0;
  for (const r of perWord) {
    const hasScore = keys.some(k => r[k] > 0);
    if (!hasScore) continue;
    for (const k of keys) sums[k] += (r[k] || 0);
    count++;
  }
  if (count === 0) return Object.fromEntries(keys.map(k => [k, 0]));
  return Object.fromEntries(keys.map(k => [k, sums[k] / count]));
}

/**
 * Aggregate per-word VAD into a single {v,a,d} mean (skip misses).
 */
function _aggregateVad(perWord) {
  const hits = perWord.filter(r => r.v !== undefined && (r.v + r.a + r.d) > 0);
  if (hits.length === 0) return { v: 0.5, a: 0.5, d: 0.5 };
  return {
    v: hits.reduce((s, r) => s + r.v, 0) / hits.length,
    a: hits.reduce((s, r) => s + r.a, 0) / hits.length,
    d: hits.reduce((s, r) => s + r.d, 0) / hits.length,
  };
}

/**
 * Run the full analysis pipeline for one (translatedText, langCode) pair.
 *
 * @param {string} translatedText  Native-script text (may be Japanese, Latin, etc.)
 * @param {string} lang            Language code e.g. 'de'
 * @param {string} inputText       Original user input (for display)
 * @param {boolean} isSource       True if this is the input language
 * @returns {Promise<ComparisonResult>}
 */
async function _analyseOne(translatedText, lang, inputText, isSource) {
  const label = _LANG_LABELS[lang] || lang;

  // ── 1. Localization pipeline → latinized + engineInput ───────────────────
  const pipelineMode = _toPipelineMode(lang);
  let latinized   = translatedText;
  let engineInput = translatedText;

  try {
    const processed = await processInput(translatedText, pipelineMode);
    latinized   = processed.latinized;
    engineInput = processed.engineInput;
  } catch {
    // Kuroshiro may not be initialised — fall back gracefully
    engineInput = translatedText.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  // ── 2. VAD analysis ───────────────────────────────────────────────────────
  let vadPerWord = [];
  try {
    vadPerWord = await analyzeVad(translatedText, lang);
  } catch { /* lexicon not available */ }
  const vadAggregate = _aggregateVad(vadPerWord);

  // ── 3. PDS transform ──────────────────────────────────────────────────────
  const pdsWords     = computePdsWords(vadPerWord);
  const pdsAggregate = computeAggregatePds(pdsWords);
  const apexThreats  = detectApexThreats(pdsWords);

  // ── 4. 8-D emotion analysis ───────────────────────────────────────────────
  const wordTokens = translatedText.trim().split(/\s+/).filter(Boolean);
  let emotions8dPerWord = [];
  try {
    emotions8dPerWord = await runAnalysis(wordTokens, lang);
  } catch { /* lexicon not available */ }
  const emotions8dAggregate = _aggregateEmotions(emotions8dPerWord);

  // ── 5. Character-level physics (letter values, spectral) ──────────────────
  const letterValues = extractLetterValues(engineInput);
  const wordStats    = engineInput ? analyzeWord(engineInput) : null;

  let spectral = { powerSpectrum: [], microWave: [] };
  try {
    // runSpectralAnalysis returns { microWave, powerSpectrum, topHarmonics }
    const result = runSpectralAnalysis(engineInput);
    spectral = { powerSpectrum: result.powerSpectrum, microWave: result.microWave };
  } catch { /* short input */ }

  return {
    lang, label, inputText, translatedText, latinizedText: latinized,
    engineInput, isSource,
    vad:        { perWord: vadPerWord, aggregate: vadAggregate },
    pds:        { words: pdsWords, aggregate: pdsAggregate, apexThreats },
    emotions8d: { perWord: emotions8dPerWord, aggregate: emotions8dAggregate },
    letterValues, wordStats, spectral,
  };
}

/**
 * Run the full multilingual comparison.
 *
 * @param {string}   text          Raw user input
 * @param {string[]} selectedLangs Array of language codes to compare (2–6)
 * @param {'word'|'sentence'} mode Analysis mode
 * @returns {Promise<ComparisonResult[]>}  One result per selected language, in order
 */
export async function runComparison(text, selectedLangs, mode = 'word', forcedSourceLang = null) {
  if (!text || !text.trim()) return [];

  // ── Detect input language (or use manual override) ────────────────────────
  const detected    = detectInputLanguage(text.trim());
  const sourceLang  = forcedSourceLang ?? (detected.lang === 'unknown' ? 'en' : detected.lang);

  // ── Translate into every selected language ────────────────────────────────
  // For the source language itself, skip translation.
  const translationJobs = selectedLangs.map(async lang => {
    const isSource = (lang === sourceLang);
    if (isSource) return { lang, text: text.trim(), isSource: true };

    try {
      const translated = await translate(text.trim(), sourceLang, lang);
      return { lang, text: translated, isSource: false };
    } catch (err) {
      return { lang, text: `[${err.message}]`, isSource: false, error: true };
    }
  });

  const translations = await Promise.all(translationJobs);

  // ── Run analysis on each translation ─────────────────────────────────────
  const analysisJobs = translations.map(({ lang, text: tText, isSource }) =>
    _analyseOne(tText, lang, text.trim(), isSource)
  );

  return Promise.all(analysisJobs);
}

/**
 * Detect the input language and return the detection result.
 * Useful for showing a "detected: German" label in the UI before analysis runs.
 */
export { detectInputLanguage };
