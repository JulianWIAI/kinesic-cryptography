/**
 * Physics Engine — Psycholinguistic & Wavelength Engine
 *
 * Treats text as a physical frequency signal. Provides:
 *   — Letter value extraction from the canonical LETTER_MAP
 *   — Word-level sum / σ / digital root analysis
 *   — Window aggregation: avg_word_sigma, dominant_quersumme,
 *     sovereignty_score, somatic_score, word_scatter_data
 *   — Micro Oscilloscope: first 256 valid letter values
 *   — Radix-2 Cooley-Tukey FFT (pure JS, zero external dependencies)
 *   — Global Signal Decimation: 100-bucket envelope for book-scale text
 */

import { LETTER_MAP }           from './letterMap.js';
import { analyzeComplexity }    from './complexity.js';
import { calculateDigitalRoot } from './quersumme.js';
import { analyzeCategorical }   from './categoricalAnalysis.js';

// ── Letter Value Extraction ───────────────────────────────

/**
 * Extract an ordered array of valid letter values from raw text.
 * Characters absent from LETTER_MAP (digits, punctuation, spaces) are skipped.
 *
 * @param {string} text
 * @returns {number[]}
 */
export function extractLetterValues(text) {
  const result = [];
  for (const c of text.toLowerCase()) {
    const entry = LETTER_MAP[c];
    if (entry !== undefined) result.push(entry.value);
  }
  return result;
}

// ── Word-Level Analysis ───────────────────────────────────

/**
 * Full analysis for a single whitespace-delimited token.
 * Returns null when the word contains no letters in LETTER_MAP.
 *
 * @param {string} word
 * @returns {{
 *   wordSum: number, mean: number, sigma: number,
 *   tier: number, tierLabel: string,
 *   values: number[], quersumme: number
 * } | null}
 */
export function analyzeWord(word) {
  const comp = analyzeComplexity(word);
  if (comp.values.length === 0) return null;
  return {
    wordSum:   comp.wordSum,
    mean:      comp.mean,
    sigma:     comp.sigma,
    tier:      comp.tier,
    tierLabel: comp.tierLabel,
    values:    comp.values,
    quersumme: calculateDigitalRoot(comp.wordSum),
  };
}

// ── Window Aggregation ────────────────────────────────────

/**
 * Aggregate psycholinguistic metrics across every word in a text block.
 * Designed to scale from single paragraphs to full books.
 *
 * Exports:
 *   avg_word_sigma      — mean σ across all valid words
 *   dominant_quersumme  — most-frequent digital root in the window
 *   sovereignty_score   — % of total letter value from Sovereign letters
 *   somatic_score       — % of total letter value from Kinetic + Liminal
 *   word_scatter_data   — [WordSum, σ] coordinate per word
 *   wordCount           — number of valid words analysed
 *
 * @param {string} text
 * @returns {{
 *   avg_word_sigma:      number,
 *   dominant_quersumme: number,
 *   sovereignty_score:  number,
 *   somatic_score:      number,
 *   word_scatter_data:  Array<[number, number]>,
 *   wordCount:          number,
 * } | null}
 */
export function aggregateWindow(text) {
  const words        = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordAnalyses = words.map(analyzeWord).filter(Boolean);

  if (wordAnalyses.length === 0) return null;

  const avg_word_sigma =
    wordAnalyses.reduce((s, a) => s + a.sigma, 0) / wordAnalyses.length;

  // Most-frequently occurring digital root across all words
  const qFreq = {};
  for (const a of wordAnalyses) {
    qFreq[a.quersumme] = (qFreq[a.quersumme] ?? 0) + 1;
  }
  const dominant_quersumme = Number(
    Object.entries(qFreq).sort((a, b) => b[1] - a[1])[0][0]
  );

  // Categorical scores from the full corpus (not per-word average)
  const cat             = analyzeCategorical(text);
  const sovereignty_score = cat.sovereigntyScore;
  const somatic_score     = cat.somaticScore;

  // Scatter payload: [WordSum, σ] per analysed word
  const word_scatter_data = wordAnalyses.map(
    a => /** @type {[number, number]} */ ([a.wordSum, a.sigma])
  );

  return {
    avg_word_sigma,
    dominant_quersumme,
    sovereignty_score,
    somatic_score,
    word_scatter_data,
    wordCount: wordAnalyses.length,
  };
}

// ── Micro Oscilloscope ────────────────────────────────────

/**
 * Returns the first 256 valid letter values from the text — the raw
 * signal window rendered by Chart B (Micro Wavelength oscilloscope).
 *
 * @param {string} text
 * @returns {number[]} — at most 256 values
 */
export function getMicroOscilloscope(text) {
  return extractLetterValues(text).slice(0, 256);
}

// ── Fast Fourier Transform (Radix-2 Cooley-Tukey) ────────

/**
 * In-place decimation-in-time FFT on pre-allocated Float64Arrays.
 * N MUST be a power of 2.
 *
 * @param {Float64Array} re — real parts, modified in place
 * @param {Float64Array} im — imaginary parts, modified in place
 */
function fft(re, im) {
  const N = re.length;

  // ── Bit-reversal permutation ──────────────────────────
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
          t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }

  // ── Butterfly stages ──────────────────────────────────
  for (let len = 2; len <= N; len <<= 1) {
    const half  = len >> 1;
    const angle = -2 * Math.PI / len;
    const wbRe  = Math.cos(angle);
    const wbIm  = Math.sin(angle);

    for (let i = 0; i < N; i += len) {
      let wRe = 1, wIm = 0;
      for (let j = 0; j < half; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + half] * wRe - im[i + j + half] * wIm;
        const vIm = re[i + j + half] * wIm + im[i + j + half] * wRe;

        re[i + j]        = uRe + vRe;
        im[i + j]        = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;

        const nextWRe = wRe * wbRe - wIm * wbIm;
        wIm = wRe * wbIm + wIm * wbRe;
        wRe = nextWRe;
      }
    }
  }
}

// ── Spectral Analysis ─────────────────────────────────────

/**
 * Runs spectral analysis on the first 256 letter values of the text.
 *
 * Pipeline:
 *   1. Extract up to 256 letter values (zero-pad remainder).
 *   2. Apply Hann window to suppress spectral leakage.
 *   3. Run in-place Radix-2 Cooley-Tukey FFT.
 *   4. Compute one-sided power spectrum (bins 0 – N/2-1).
 *   5. Return the top 5 non-DC harmonics by power.
 *
 * @param {string} text
 * @returns {{
 *   microWave:     number[],
 *   powerSpectrum: Array<{ bin: number, frequency: number, power: number }>,
 *   topHarmonics:  Array<{ bin: number, frequency: number, power: number, label: string }>,
 * }}
 */
export function runSpectralAnalysis(text) {
  const N   = 256;
  const raw = getMicroOscilloscope(text);
  const re  = new Float64Array(N);   // signal (real)
  const im  = new Float64Array(N);   // imaginary (all zero for real input)

  // Load signal, zero-pad tail automatically (Float64Array initialises to 0)
  raw.forEach((v, i) => { re[i] = v; });

  // Hann window — reduces spectral leakage on finite-length signals
  for (let i = 0; i < N; i++) {
    re[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
  }

  fft(re, im);

  // One-sided power spectrum: bins 0 … N/2-1 (real-signal symmetry)
  const half = N >> 1;
  const powerSpectrum = Array.from({ length: half }, (_, k) => ({
    bin:       k,
    frequency: k / N,                          // cycles per letter
    power:     re[k] * re[k] + im[k] * im[k],
  }));

  // Top 5 non-DC harmonics (bin 0 = DC offset, excluded)
  const topHarmonics = [...powerSpectrum]
    .slice(1)
    .sort((a, b) => b.power - a.power)
    .slice(0, 5)
    .map(h => ({
      ...h,
      label: `Bin ${h.bin} · f = ${h.frequency.toFixed(4)} c/l`,
    }));

  return { microWave: raw, powerSpectrum, topHarmonics };
}

// ── Global Signal Decimation ──────────────────────────────

/**
 * Divides the full letter-value sequence into 100 uniform buckets
 * and returns the mean letter value per bucket — the "Global Envelope".
 *
 * Safe for book-scale corpora; runs synchronously in O(n) time.
 * The resulting 100-float array feeds Chart A (Global Envelope).
 *
 * @param {string} text
 * @returns {number[]} — exactly 100 floats
 */
export function getGlobalEnvelope(text) {
  const values = extractLetterValues(text);
  if (values.length === 0) return new Array(100).fill(0);

  return Array.from({ length: 100 }, (_, i) => {
    const start = Math.floor(i       * values.length / 100);
    const end   = Math.floor((i + 1) * values.length / 100);
    const slice = values.slice(start, end);
    return slice.length
      ? slice.reduce((s, v) => s + v, 0) / slice.length
      : 0;
  });
}