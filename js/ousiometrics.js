/**
 * ousiometrics.js — Ousiometric PDS Transformation Module
 *
 * Implements the Power–Danger–Structure (PDS) dimensional reduction of
 * raw NRC Valence–Arousal–Dominance (VAD) scores.
 *
 * Methodology based on:
 *   Dodds et al. (2021) "Ousiometrics and Telegnomics"
 *   arXiv:2110.06847 — Language as a physical system.
 *
 * The three PDS dimensions collapse the 3D VAD space into human-interpretable
 * psycholinguistic axes:
 *
 *   POWER     — How much authority/strength does the word convey?
 *               (dominance-heavy blend with valence contribution)
 *
 *   DANGER    — How threatening/harmful is the word?
 *               (inverse valence signals negativity; arousal signals urgency)
 *
 *   STRUCTURE — How stable/orderly is the word's semantic field?
 *               (valence signals positivity; inverse arousal signals calm)
 *
 * The "Apex Zone" is where POWER and DANGER are both high (≥ APEX_THRESHOLD),
 * indicating language that is simultaneously authoritative AND threatening —
 * a SIGINT red-flag pattern.
 */

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * APEX_THRESHOLD
 * The minimum PDS score (on both Power and Danger axes) for a word to be
 * classified as an "Apex Threat" — language that is both powerful and dangerous.
 * Value: 0.65 (65th percentile of the 0–1 normalised scale).
 *
 * @type {number}
 */
export const APEX_THRESHOLD = 0.65;

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * _clamp01
 * ────────
 * Clamps a number to the [0, 1] range.
 * Prevents floating-point arithmetic from producing out-of-range PDS values.
 *
 * @param  {number} x  Input value.
 * @returns {number}   Value clamped to [0, 1].
 */
function _clamp01(x) {
  return Math.max(0, Math.min(1, x));
}


// ── Core PDS transformation ──────────────────────────────────────────────────

/**
 * calculateOusiometrics
 * ─────────────────────
 * Transforms a single (V, A, D) triplet into the three PDS dimensions.
 *
 * Formulae:
 *   Power     = (D × 0.65) + (V × 0.35)
 *   Danger    = ((1 − V) × 0.60) + (A × 0.40)
 *   Structure = (V × 0.55) + ((1 − A) × 0.45)
 *
 * Weights are calibrated so that:
 *   - Power is primarily driven by dominance (who is in control?)
 *     with valence as a secondary signal (positive framing boosts power slightly).
 *   - Danger is primarily driven by inverse valence (negative = threatening)
 *     with arousal boosting urgency/intensity.
 *   - Structure is primarily driven by valence (positive = stable)
 *     with low arousal (calm) reinforcing the sense of order.
 *
 * All outputs are clamped to [0, 1].
 *
 * @param  {number} v  Valence    (0 = very negative, 1 = very positive)
 * @param  {number} a  Arousal    (0 = very calm,     1 = very aroused)
 * @param  {number} d  Dominance  (0 = very weak,     1 = very dominant)
 * @returns {{ power: number, danger: number, structure: number }}
 */
export function calculateOusiometrics(v, a, d) {
  // Power: dominance is the primary driver (65%), valence secondary (35%).
  // A word can be powerful even with negative valence (e.g. "war" has d=0.65).
  const power     = _clamp01((d * 0.65) + (v * 0.35));

  // Danger: inverse valence is primary (60%) — negative words are dangerous.
  // Arousal adds urgency (40%) — excited/intense words escalate danger.
  const danger    = _clamp01(((1 - v) * 0.60) + (a * 0.40));

  // Structure: positive valence creates order (55%).
  // Low arousal (calmness) reinforces stability (45%).
  const structure = _clamp01((v * 0.55) + ((1 - a) * 0.45));

  return { power, danger, structure };
}


// ── Batch processing helpers ─────────────────────────────────────────────────

/**
 * computePdsWords
 * ───────────────
 * Applies the PDS transformation to every word in a VAD result array.
 * Returns a new array that extends each entry with power, danger, structure.
 *
 * @param  {Array<{word: string, v: number, a: number, d: number}>} vadResults
 *         Output from analyzeVad() in vad.js.
 * @returns {Array<{word: string, v: number, a: number, d: number, power: number, danger: number, structure: number}>}
 *          Each element has all original VAD fields plus the three PDS scores.
 */
export function computePdsWords(vadResults) {
  return vadResults.map(entry => {
    const { power, danger, structure } = calculateOusiometrics(
      entry.v,
      entry.a,
      entry.d
    );
    return {
      word:      entry.word,
      v:         entry.v,
      a:         entry.a,
      d:         entry.d,
      power,
      danger,
      structure,
    };
  });
}


/**
 * computeAggregatePds
 * ───────────────────
 * Computes the arithmetic mean of Power, Danger, and Structure across
 * all PDS-enriched words. This gives a holistic "signature" for the
 * entire passage being analysed.
 *
 * Returns { power: 0, danger: 0, structure: 0 } when the input is empty
 * to avoid division-by-zero and provide safe defaults for UI rendering.
 *
 * @param  {Array<{power: number, danger: number, structure: number}>} pdsWords
 *         Output from computePdsWords().
 * @returns {{ power: number, danger: number, structure: number }}
 *          Averaged PDS scores for the whole passage, or zeros if empty.
 */
export function computeAggregatePds(pdsWords) {
  // Guard: return safe zeros for empty input.
  if (!pdsWords || pdsWords.length === 0) {
    return { power: 0, danger: 0, structure: 0 };
  }

  // Accumulate sums over all words.
  let sumPower = 0;
  let sumDanger = 0;
  let sumStructure = 0;

  for (const w of pdsWords) {
    sumPower     += w.power;
    sumDanger    += w.danger;
    sumStructure += w.structure;
  }

  const count = pdsWords.length;
  return {
    power:     sumPower     / count,
    danger:    sumDanger    / count,
    structure: sumStructure / count,
  };
}


/**
 * detectApexThreats
 * ─────────────────
 * Filters a PDS word array to identify "Apex Threat" vocabulary —
 * words that score above APEX_THRESHOLD on BOTH the Power AND Danger axes.
 *
 * These words occupy the top-right quadrant of the Threat Matrix scatter
 * plot and represent language that is simultaneously authoritative and violent
 * or threatening — a key SIGINT indicator.
 *
 * Examples of apex-zone words: "war", "kill", "massacre", "execute", "annihilate"
 * (high danger) combined with sufficient dominance/valence to cross the power threshold.
 *
 * @param  {Array<{word: string, power: number, danger: number, structure: number}>} pdsWords
 *         Output from computePdsWords().
 * @returns {Array<{word: string, power: number, danger: number, structure: number}>}
 *          Subset of pdsWords where power ≥ APEX_THRESHOLD AND danger ≥ APEX_THRESHOLD.
 */
export function detectApexThreats(pdsWords) {
  return pdsWords.filter(
    w => w.power >= APEX_THRESHOLD && w.danger >= APEX_THRESHOLD
  );
}
