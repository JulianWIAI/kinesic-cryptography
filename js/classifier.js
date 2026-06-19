/**
 * Classifier Module — Psycholinguistic Complexity & Archetype Engine
 *
 * Consolidates complexity-tier classification and quersumme archetype
 * mapping into a single import surface. Re-exports the core functions
 * from complexity.js and quersumme.js, and provides the canonical
 * archetype short-name table per the Psycholinguistic Spec.
 *
 * Complexity Tiers (by word σ):
 *   Tier 1 — Somatic / Universal : σ < 2.0
 *   Tier 2 — Archetypal Bridge   : 2.0 ≤ σ < 5.0
 *   Tier 3 — State / System      : σ ≥ 5.0
 *
 * Quersumme Archetypes (digital root 1–9):
 *   1 = Source · 2 = Bond · 3 = Overflow · 4 = Foundation
 *   5 = Friction · 6 = Grounding · 7 = Precursor
 *   8 = Infinity/State · 9 = Transcendent
 */

export { analyzeComplexity }                  from './complexity.js';
export { calculateDigitalRoot, getArchetype } from './quersumme.js';

/**
 * Canonical archetype short-names keyed by digital root (1–9).
 * Suitable for compact display in tiles and readouts.
 * @type {Object<number, string>}
 */
export const ARCHETYPE_NAMES = {
  1: 'Source',
  2: 'Bond',
  3: 'Overflow',
  4: 'Foundation',
  5: 'Friction',
  6: 'Grounding',
  7: 'Precursor',
  8: 'Infinity/State',
  9: 'Transcendent',
};

/**
 * Complexity tier σ thresholds.
 */
export const TIER_THRESHOLDS = {
  T1_MAX: 2.0,  // σ < T1_MAX → Tier 1
  T2_MAX: 5.0,  // σ < T2_MAX → Tier 2 (else Tier 3)
};

/**
 * Maps a word's standard deviation to a complexity tier number (1, 2, or 3).
 * @param {number} sigma
 * @returns {1|2|3}
 */
export function getSigmaTier(sigma) {
  if (sigma < 2.0) return 1;
  if (sigma < 5.0) return 2;
  return 3;
}