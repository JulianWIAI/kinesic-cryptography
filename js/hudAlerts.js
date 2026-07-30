/**
 * hudAlerts.js
 * ─────────────────────────────────────────────────────────────────────────────
 * HUD Editorial Alert System — Psycholinguistic Cluster Analyzer
 *
 * Detects compound psychological trigger patterns in a set of word-analysis
 * results and renders editorial alert banners into a designated container.
 *
 * Compound triggers are heuristic rules that fire when the aggregate emotional
 * and structural profile of the analysed word cluster crosses empirically
 * derived thresholds, indicating a particular propaganda or coercion technique.
 *
 * Exported members:
 *   ui               — object with DOM editorial rendering methods
 *   detectTriggers   — function that evaluates trigger rules against results
 *   calculateAverages — function that computes aggregate metrics (for testing)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { EMOTION_KEYS } from './affectLexicon.js';

// ─────────────────────────────────────────────────────────────────────────────
// calculateAverages  (also exported for unit-testing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute arithmetic averages of sigma and all 8 emotion dimensions across a
 * set of analysis results.
 *
 * @param {Array<{sigma:number, anger:number, fear:number,
 *   anticipation:number, disgust:number, surprise:number,
 *   trust:number, joy:number, sadness:number}>} results
 *
 * @returns {{
 *   avgSigma:        number,
 *   avgAnger:        number,
 *   avgFear:         number,
 *   avgAnticipation: number,
 *   avgDisgust:      number,
 *   avgSurprise:     number,
 *   avgTrust:        number,
 *   avgJoy:          number,
 *   avgSadness:      number,
 * }}
 */
export function calculateAverages(results) {
  const n = results.length;

  // Guard: return all-zero averages for an empty result set
  if (n === 0) {
    return {
      avgSigma: 0, avgAnger: 0, avgFear: 0, avgAnticipation: 0,
      avgDisgust: 0, avgSurprise: 0, avgTrust: 0, avgJoy: 0, avgSadness: 0,
    };
  }

  // Accumulate sums
  let sumSigma        = 0;
  let sumAnger        = 0;
  let sumFear         = 0;
  let sumAnticipation = 0;
  let sumDisgust      = 0;
  let sumSurprise     = 0;
  let sumTrust        = 0;
  let sumJoy          = 0;
  let sumSadness      = 0;

  for (const r of results) {
    sumSigma        += r.sigma        ?? 0;
    sumAnger        += r.anger        ?? 0;
    sumFear         += r.fear         ?? 0;
    sumAnticipation += r.anticipation ?? 0;
    sumDisgust      += r.disgust      ?? 0;
    sumSurprise     += r.surprise     ?? 0;
    sumTrust        += r.trust        ?? 0;
    sumJoy          += r.joy          ?? 0;
    sumSadness      += r.sadness      ?? 0;
  }

  return {
    avgSigma:        sumSigma        / n,
    avgAnger:        sumAnger        / n,
    avgFear:         sumFear         / n,
    avgAnticipation: sumAnticipation / n,
    avgDisgust:      sumDisgust      / n,
    avgSurprise:     sumSurprise     / n,
    avgTrust:        sumTrust        / n,
    avgJoy:          sumJoy          / n,
    avgSadness:      sumSadness      / n,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// detectTriggers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate compound psychological trigger rules against an array of analysis
 * results and return an array of alert configuration objects for any rules
 * that fire.
 *
 * Currently defined triggers:
 *
 *   Trigger 1 — Systemic Coercion ("The Obey Trigger")
 *     Fires when:  avgSigma > 4.0  AND  avgFear > 0.5  AND  avgTrust > 0.5
 *     Interpretation: High structural complexity combined with simultaneous
 *     fear and trust signals suggests language engineered to demand compliance
 *     by pairing intimidation with authority.
 *
 *   Trigger 2 — Volatile Populism ("The Outrage Trigger")
 *     Fires when:  avgSigma < 2.5  AND  avgAnger > 0.6  AND  avgDisgust > 0.5
 *     Interpretation: Low structural complexity (simple, blunt vocabulary)
 *     paired with peak anger and disgust indicates primal, unstructured
 *     language optimised for outrage and tribal polarisation.
 *
 * @param {Array<object>} results — output of runAnalysis()
 * @returns {Array<{type: string, message: string, detail: string}>}
 *   Array of alert configs (may be empty, length 1, or length 2).
 */
export function detectTriggers(results) {
  // No words analysed — no triggers possible
  if (results.length === 0) return [];

  // Compute aggregate metrics
  const {
    avgSigma,
    avgAnger,
    avgFear,
    avgDisgust,
    avgTrust,
  } = calculateAverages(results);

  /** @type {Array<{type:string, message:string, detail:string}>} */
  const triggered = [];

  // ── Trigger 1: Systemic Coercion ──────────────────────────────────────────
  // Rule: high structural complexity + elevated fear + elevated trust
  // The simultaneous presence of fear and trust signals manufactured authority.
  if (avgSigma > 4.0 && avgFear > 0.5 && avgTrust > 0.5) {
    triggered.push({
      type:    'critical',
      message: '⚠ CRITICAL: Systemic Coercion Detected',
      detail:
        `High structural complexity (σ̄ = ${avgSigma.toFixed(2)}) paired with ` +
        `Fear (${(avgFear * 100).toFixed(1)}%) + ` +
        `Trust (${(avgTrust * 100).toFixed(1)}%) — ` +
        `language engineered to demand compliance through simultaneous ` +
        `intimidation and authority.`,
    });
  }

  // ── Trigger 2: Volatile Populism ─────────────────────────────────────────
  // Rule: low structural complexity + peak anger + elevated disgust
  // Simple vocabulary maximises emotional impact and minimises critical thought.
  if (avgSigma < 2.5 && avgAnger > 0.6 && avgDisgust > 0.5) {
    triggered.push({
      type:    'critical',
      message: '⚠ CRITICAL: Volatile Populism Detected',
      detail:
        `Low structural complexity (σ̄ = ${avgSigma.toFixed(2)}) with ` +
        `Anger (${(avgAnger * 100).toFixed(1)}%) + ` +
        `Disgust (${(avgDisgust * 100).toFixed(1)}%) — ` +
        `primal, unstructured language engineered for pure outrage and tribalism.`,
    });
  }

  return triggered;
}

// ─────────────────────────────────────────────────────────────────────────────
// ui  — DOM editorial rendering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @namespace ui
 * @description Editorial alert banner renderer for the HUD container.
 */
export const ui = {

  /**
   * Render or clear an editorial alert banner inside a container element.
   *
   * When type === 'clear':
   *   - Empties the container and hides it via the `hidden` attribute.
   *
   * When type === 'critical' or 'warning':
   *   - Removes the `hidden` attribute from the container.
   *   - Builds and injects a banner with the appropriate icon, title, and
   *     detail text.
   *   - The CSS class `ca-editorial--critical` triggers a flashing animation.
   *
   * @param {{
   *   container: HTMLElement,
   *   message:   string,
   *   detail:    string,
   *   type:      'critical' | 'warning' | 'clear'
   * }} config
   */
  setEditorial({ container, message, detail, type }) {
    // ── Clear / hide ──────────────────────────────────────────────────────────
    if (type === 'clear') {
      container.innerHTML = '';
      container.setAttribute('hidden', '');
      return;
    }

    // ── Icon selection ────────────────────────────────────────────────────────
    // Unicode symbols chosen for strong visual salience in a monochrome
    // terminal / SIGINT aesthetic context.
    const icon = type === 'critical' ? '⚠' : '◈';

    // ── Build banner HTML ─────────────────────────────────────────────────────
    // Using a template literal for clarity; all values are controlled strings
    // (not user-supplied rich HTML), so injection risk is minimal.
    const bannerHTML = `
      <div class="ca-editorial ca-editorial--${type}">
        <div class="ca-editorial-icon" aria-hidden="true">${icon}</div>
        <div class="ca-editorial-body">
          <div class="ca-editorial-title">${message}</div>
          <div class="ca-editorial-detail">${detail}</div>
        </div>
      </div>
    `.trim();

    // ── Inject and reveal ─────────────────────────────────────────────────────
    container.removeAttribute('hidden');
    container.innerHTML = bannerHTML;
  },
};
