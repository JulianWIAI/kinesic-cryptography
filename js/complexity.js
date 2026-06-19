/**
 * Complexity Analysis Module
 *
 * Computes the Word Sum and population Standard Deviation (σ) for a word,
 * then classifies it into one of three complexity tiers:
 *
 *   Tier 1 — Somatic/Universal  : σ < 2.0
 *   Tier 2 — Archetypal Bridge  : 2.0 ≤ σ < 5.0
 *   Tier 3 — State/System       : σ ≥ 5.0
 */

import { LETTER_MAP } from './letterMap.js';

/**
 * Extracts numeric letter values from a word string.
 * Characters absent from LETTER_MAP (digits, punctuation) are skipped.
 *
 * @param {string} word
 * @returns {number[]}
 */
function getLetterValues(word) {
  return [...word.toLowerCase()]
    .map(c => LETTER_MAP[c]?.value)
    .filter(v => v !== undefined);
}

/**
 * @typedef {Object} ComplexityResult
 * @property {number}   wordSum   — sum of all letter values
 * @property {number}   mean      — arithmetic mean of letter values
 * @property {number}   sigma     — population standard deviation
 * @property {number}   tier      — 1 | 2 | 3
 * @property {string}   tierLabel — human-readable tier name
 * @property {number[]} values    — per-letter values in order
 */

/**
 * Runs full complexity analysis on a raw input word.
 *
 * @param {string} word — any-case string (umlauts supported)
 * @returns {ComplexityResult}
 */
export function analyzeComplexity(word) {
  const values = getLetterValues(word);

  if (values.length === 0) {
    return { wordSum: 0, mean: 0, sigma: 0, tier: 1, tierLabel: 'Somatic/Universal', values: [] };
  }

  const wordSum  = values.reduce((a, b) => a + b, 0);
  const mean     = wordSum / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const sigma    = Math.sqrt(variance);

  let tier, tierLabel;
  if (sigma < 2.0) {
    tier = 1; tierLabel = 'Somatic/Universal';
  } else if (sigma < 5.0) {
    tier = 2; tierLabel = 'Archetypal Bridge';
  } else {
    tier = 3; tierLabel = 'State/System';
  }

  return { wordSum, mean, sigma, tier, tierLabel, values };
}
