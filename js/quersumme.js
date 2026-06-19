/**
 * Quersumme Engine
 *
 * Computes the digital root (German: Quersumme) of a word sum and
 * maps it to one of nine Archetypes (1–9).
 *
 * The digital root is the single digit you get by repeatedly summing
 * all digits of a number (e.g. 85 → 8+5=13 → 1+3=4).
 * Fractional sums (caused by umlauts ä/ö/ü) are rounded before reduction.
 */

/**
 * Nine Archetypes — the vibrational core of a word.
 * @type {Object<number, { name: string, description: string }>}
 */
const ARCHETYPES = {
  1: {
    name:        'The Source',
    description: 'Absolute necessity. The "Achtung" energy. Essential for survival and initialization.',
  },
  2: {
    name:        'The Bond',
    description: 'Partnership, duality, mirror-images. The "Ehe" and supportive infrastructure.',
  },
  3: {
    name:        'The Overflow',
    description: 'Creative excess, joy, fun, sensory delight. Almost too much, like a "Clown."',
  },
  4: {
    name:        'The Foundation',
    description: 'Stability, structure, rigid framing. The "chair" of the state and physical logic.',
  },
  5: {
    name:        'The Friction',
    description: 'Transition, movement, challenge. The "Human with belly" energy — the weight of change.',
  },
  6: {
    name:        'The Grounding',
    description: 'Lower-body focus, internalization, heavy reflection. The "sitting" energy.',
  },
  7: {
    name:        'The Precursor',
    description: 'Intelligence pushing forward, foresight, strategic probing. The "smart/forschend" energy.',
  },
  8: {
    name:        'The Infinity / State',
    description: 'Complexity, high-level society, systems, recursion. The "Wirtschaft" and "Whale" energy.',
  },
  9: {
    name:        'The Transcendent',
    description: 'Pure intellect, brain-focus, spiritual or high-state abstraction. The "Church/Kunst" energy.',
  },
};

/**
 * Calculates the digital root of a number.
 * Fractional word sums (from umlauts) are rounded to the nearest integer first.
 *
 * @param {number} sum — raw word sum (may include .5 fractions)
 * @returns {number}   — integer in range 1–9 (or 0 if sum ≤ 0)
 */
export function calculateDigitalRoot(sum) {
  const n = Math.round(sum);
  if (n <= 0) return 0;
  // The formula `1 + (n-1) % 9` gives digital root for all positive integers.
  return 1 + (n - 1) % 9;
}

/**
 * Returns the Archetype object for a given digital root.
 *
 * @param {number} root — integer 1–9
 * @returns {{ name: string, description: string }}
 */
export function getArchetype(root) {
  return ARCHETYPES[root] ?? { name: 'Unknown', description: '—' };
}
