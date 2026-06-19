/**
 * Categorical Analysis Module
 *
 * Determines the archetypal category distribution of a word and
 * derives three composite scores:
 *
 *   Sovereignty Score — % of total word value in Sovereign letters
 *   Somatic Score     — % in Kinetic + Liminal letters
 *   Resonant Score    — % in Resonant + Origin letters
 */

import { LETTER_MAP, CATEGORIES } from './letterMap.js';

/**
 * @typedef {Object} CategoryBreakdown
 * @property {string} category   — one of the five CATEGORIES
 * @property {number} count      — number of letters in this category
 * @property {number} totalValue — sum of letter values in this category
 * @property {number} percentage — share of the word's total value (0–100)
 */

/**
 * @typedef {Object} CategoricalResult
 * @property {string}                  dominantCategory  — category with highest total value
 * @property {number}                  sovereigntyScore  — % of value from Sovereign
 * @property {number}                  somaticScore      — % of value from Kinetic + Liminal
 * @property {number}                  resonantScore     — % of value from Resonant + Origin
 * @property {CategoryBreakdown[]}     breakdown         — per-category stats in CATEGORIES order
 * @property {Object<string, number>}  radarValues       — % per category, keyed by category name
 */

/**
 * Analyses the categorical composition of a word.
 *
 * @param {string} word — any-case (umlauts supported)
 * @returns {CategoricalResult}
 */
export function analyzeCategorical(word) {
  const chars = [...word.toLowerCase()];

  // Only include characters that have a defined letter value
  const entries = chars
    .map(c => ({ char: c, ...LETTER_MAP[c] }))
    .filter(e => e.value !== undefined);

  const totalValue = entries.reduce((sum, e) => sum + e.value, 0);

  // Initialise accumulators for each category
  const catValues = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  const catCounts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));

  for (const e of entries) {
    if (e.category) {
      catValues[e.category] += e.value;
      catCounts[e.category] += 1;
    }
  }

  // Build ordered breakdown array
  const breakdown = CATEGORIES.map(cat => ({
    category:   cat,
    count:      catCounts[cat],
    totalValue: catValues[cat],
    percentage: totalValue > 0 ? (catValues[cat] / totalValue) * 100 : 0,
  }));

  // Find dominant category (highest total value)
  const dominantCategory = [...breakdown]
    .sort((a, b) => b.totalValue - a.totalValue)[0]?.category ?? 'Unknown';

  const sovereigntyScore = totalValue > 0 ? (catValues['Sovereign'] / totalValue) * 100 : 0;
  const somaticScore     = totalValue > 0 ? ((catValues['Kinetic']  + catValues['Liminal']) / totalValue) * 100 : 0;
  const resonantScore    = totalValue > 0 ? ((catValues['Resonant'] + catValues['Origin'])  / totalValue) * 100 : 0;

  // Radar values: % per category for Chart.js
  const radarValues = Object.fromEntries(
    CATEGORIES.map(cat => [cat, totalValue > 0 ? (catValues[cat] / totalValue) * 100 : 0])
  );

  return { dominantCategory, sovereigntyScore, somaticScore, resonantScore, breakdown, radarValues };
}
