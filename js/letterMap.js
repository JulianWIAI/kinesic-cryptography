/**
 * Psycholinguistic Letter Map
 *
 * Defines the numeric value and archetypal category for every letter
 * in the cipher system, including German umlauts.
 *
 * Values: A=1 … Z=26, Ä=1.5, Ö=15.5, Ü=21.5
 *
 * Categories:
 *   Origin    — Fundamental ignition
 *   Kinetic   — Motion / Energy
 *   Sovereign — Power / State
 *   Liminal   — Thresholds / Transitions
 *   Resonant  — Empathy / Social
 */

/** @type {Object<string, { value: number, category: string }>} */
export const LETTER_MAP = {
  'a':  { value: 1,    category: 'Origin'    },
  'ä':  { value: 1.5,  category: 'Liminal'   },
  'b':  { value: 2,    category: 'Kinetic'   },
  'c':  { value: 3,    category: 'Resonant'  },
  'd':  { value: 4,    category: 'Sovereign' },
  'e':  { value: 5,    category: 'Kinetic'   },
  'f':  { value: 6,    category: 'Kinetic'   },
  'g':  { value: 7,    category: 'Liminal'   },
  'h':  { value: 8,    category: 'Resonant'  },
  'i':  { value: 9,    category: 'Sovereign' },
  'j':  { value: 10,   category: 'Kinetic'   },
  'k':  { value: 11,   category: 'Sovereign' },
  'l':  { value: 12,   category: 'Resonant'  },
  'm':  { value: 13,   category: 'Resonant'  },
  'n':  { value: 14,   category: 'Liminal'   },
  'o':  { value: 15,   category: 'Resonant'  },
  'ö':  { value: 15.5, category: 'Liminal'   },
  'p':  { value: 16,   category: 'Kinetic'   },
  'q':  { value: 17,   category: 'Sovereign' },
  'r':  { value: 18,   category: 'Liminal'   },
  's':  { value: 19,   category: 'Kinetic'   },
  't':  { value: 20,   category: 'Sovereign' },
  'u':  { value: 21,   category: 'Resonant'  },
  'ü':  { value: 21.5, category: 'Liminal'   },
  'v':  { value: 22,   category: 'Kinetic'   },
  'w':  { value: 23,   category: 'Sovereign' },
  'x':  { value: 24,   category: 'Sovereign' },
  'y':  { value: 25,   category: 'Resonant'  },
  'z':  { value: 26,   category: 'Sovereign' },
};

/** Canonical display order for all five archetypal categories. */
export const CATEGORIES = ['Origin', 'Kinetic', 'Sovereign', 'Liminal', 'Resonant'];