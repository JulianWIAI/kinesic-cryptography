/**
 * languageDetector.js — Input Language Detector
 *
 * Distinguishes between EN / DE / FR / ES / IT (Latin-script) and JA.
 * Uses Unicode script ranges for Japanese and trigram/accent profiles
 * for Latin-script languages. No external library required.
 *
 * Exported API:
 *   detectInputLanguage(text)  → { lang, label, confidence }
 *   COMPARISON_LANGS           → array of { code, label, flag } descriptors
 */

// ── Japanese Unicode ranges ───────────────────────────────────────────────────
const _JP_RE = /[぀-ゟ゠-ヿ一-鿿]/;

// ── Accent/diacritic fingerprints ────────────────────────────────────────────
// These are the ONLY reliable signal for short inputs.
const _DE_CHARS = /[äöüÄÖÜß]/;
// French: ç and œ are strong unambiguous signals; é/è/à are shared with IT
const _FR_STRONG = /[çœÇŒ]/;
const _FR_CHARS  = /[éèêëàâîïôùûüœæç]/i;
// Spanish: ñ, ¡, ¿ are unambiguous
const _ES_CHARS  = /[ñ¿¡Ñ]/i;
// Italian: àèìòù are the distinctive ones (not shared with French as strongly)
const _IT_STRONG = /[àèìòùÀÈÌÒÙ]/i;
const _IT_CHARS  = /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/i;

// ── Romanized Japanese keywords (no kanji) ───────────────────────────────────
// These look like Latin text but are actually Japanese — catch before trigrams.
const _JA_ROMAJI = new Set([
  'sayonara','saionara','sayōnara','konnichiwa','konnichiha','konbanwa',
  'ohayou','ohayo','ohayogozaimasu','arigatou','arigatoo','arigatō',
  'sumimasen','gomen','gomennasai','kawaii','sugoi','senpai','sensei',
  'otaku','hajimemashite','yoroshiku','itadakimasu','okaeri',
  'nani','moshi','kudasai','desu','masu','suki','kirei','yokatta',
  'samurai','ninja','geisha','shogun','sushi','ramen','tempura','udon',
  'sakura','fuji','katana','manga','anime',
]);

// ── Known single-word foreign signals ────────────────────────────────────────
// Words that are clearly non-English (or German/Italian borrowings the user
// would type as their native-language form).  Only add truly unambiguous words.
const _KNOWN_WORDS = new Map([
  // German
  ['durst','de'],['hunger','de'],['angst','de'],['blitz','de'],['kaputt','de'],
  ['wanderlust','de'],['schadenfreude','de'],['weltanschauung','de'],
  ['zeitgeist','de'],['kindergarten','de'],['rucksack','de'],['nein','de'],
  ['danke','de'],['bitte','de'],['hund','de'],['katze','de'],['haus','de'],
  ['wasser','de'],['brot','de'],['liebe','de'],['leben','de'],['nacht','de'],
  ['morgen','de'],['abend','de'],['schule','de'],['arbeit','de'],
  // Italian
  ['ciao','it'],['bella','it'],['bello','it'],['belle','it'],['belli','it'],
  ['amore','it'],['ragazza','it'],['ragazzo','it'],['buono','it'],['buona','it'],
  ['arrivederci','it'],['prego','it'],['grazie','it'],
  // French
  ['bonjour','fr'],['bonsoir','fr'],['bonne','fr'],['merci','fr'],
  ['pardon','fr'],['voila','fr'],['sacrebleu','fr'],
  // Spanish
  ['hola','es'],['adios','es'],['buenos','es'],['gracias','es'],
  ['amigo','es'],['amiga','es'],['mucho','es'],['nada','es'],
]);

// ── Trigram profiles ──────────────────────────────────────────────────────────
const _PROFILES = {
  de: [
    ['sch',3],['ich',3],['ein',2],['die',2],['und',2],['cht',2],
    ['ung',2],['eit',2],['ist',1],['den',1],['aus',1],['bei',1],
    ['ver',1],['ber',1],['ten',1],['nde',1],
    ['urs',2],['rst',2],['nst',2],['nge',1],['pfe',2],['tze',2],
  ],
  fr: [
    ['les',3],['des',2],['que',2],['est',2],['ais',2],['eau',2],
    ['oir',2],['eux',2],['ant',1],['ent',1],['ion',1],['our',1],
    ['ons',1],['ait',1],['aus',1],['ser',1],
  ],
  es: [
    ['que',3],['del',2],['con',2],['los',2],['nte',2],['ado',2],
    ['est',2],['par',1],['una',1],['ien',1],['ual',1],
    ['omo',1],['ero',1],['cer',1],['ndo',1],
  ],
  it: [
    ['che',3],['gli',3],['una',2],['per',2],['ire',2],['ato',2],
    ['del',2],['chi',2],['ono',2],['nno',2],
    ['lla',2],['llo',2],['nte',1],['ere',1],['cci',2],['ggi',2],
  ],
  en: [
    ['the',4],['ing',3],['and',3],['ion',2],['ent',2],['tion',2],
    ['for',2],['are',2],['his',1],['not',1],['you',1],['was',1],
    ['tha',1],['her',1],['ers',1],['ith',1],['oul',1],
  ],
};

function _trigramScore(text, profile) {
  const t = text.toLowerCase();
  let score = 0;
  for (const [gram, weight] of profile) {
    let pos = t.indexOf(gram);
    while (pos !== -1) {
      score += weight;
      pos = t.indexOf(gram, pos + 1);
    }
  }
  return score;
}

const _LABELS = { en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian' };

/**
 * Detect the most likely input language from text content.
 *
 * Rules (in priority order):
 *   1. Japanese Unicode ranges → ja  (always reliable)
 *   2. German umlauts/ß        → de  (always reliable)
 *   3. Spanish ñ/¡/¿           → es  (always reliable)
 *   4. French ç/œ              → fr  (always reliable)
 *   5. Italian àèìòù (without French ç/œ) → it  (reliable for accented text)
 *   6. If text is long enough (≥ 15 chars, ≥ 2 words): trigram scoring
 *   7. Default → en  (when in doubt, English is the safe assumption)
 *
 * @param {string} text
 * @returns {{ lang: string, label: string, confidence: number }}
 */
export function detectInputLanguage(text) {
  if (!text || text.trim().length === 0) {
    return { lang: 'en', label: 'English', confidence: 0 };
  }

  const t = text.trim();

  // ── 1. Japanese ───────────────────────────────────────────────────────────
  if (_JP_RE.test(t)) return { lang: 'ja', label: 'Japanese', confidence: 0.98 };

  // ── 2. Unambiguous diacritic shortcuts ────────────────────────────────────
  if (_DE_CHARS.test(t)) return { lang: 'de', label: 'German',  confidence: 0.9 };
  if (_ES_CHARS.test(t)) return { lang: 'es', label: 'Spanish', confidence: 0.9 };
  if (_FR_STRONG.test(t)) return { lang: 'fr', label: 'French', confidence: 0.88 };

  // Italian-specific accents (only if French strong chars absent)
  if (_IT_STRONG.test(t) && !_FR_CHARS.test(t)) {
    return { lang: 'it', label: 'Italian', confidence: 0.78 };
  }
  // French if its weaker accents appear (é/è/à/etc.)
  if (_FR_CHARS.test(t)) return { lang: 'fr', label: 'French', confidence: 0.72 };

  const wordCount = t.split(/\s+/).filter(Boolean).length;
  const tLower = t.toLowerCase();

  // ── 3. Known-word + romanized-Japanese lookup ─────────────────────────────
  if (wordCount === 1) {
    if (_JA_ROMAJI.has(tLower)) return { lang: 'ja', label: 'Japanese', confidence: 0.82 };
    const knownLang = _KNOWN_WORDS.get(tLower);
    if (knownLang) return { lang: knownLang, label: _LABELS[knownLang], confidence: 0.85 };
  }

  // ── 4. Trigram scoring ────────────────────────────────────────────────────
  const scores = {};
  let total = 0;
  for (const [lang, profile] of Object.entries(_PROFILES)) {
    const s = _trigramScore(t, profile);
    scores[lang] = s;
    total += s;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0];

  if (!winner || winner[1] === 0 || total === 0) {
    return { lang: 'en', label: 'English', confidence: 0.3 };
  }

  const secondScore = sorted[1]?.[1] ?? 0;
  const gap = winner[1] - secondScore;

  // For single words require a stronger signal to avoid false positives.
  const minGap = wordCount === 1 ? 3 : 2;
  if (gap < minGap && winner[0] !== 'en') {
    return { lang: 'en', label: 'English', confidence: 0.4 };
  }

  const confidence = Math.min(winner[1] / total, 1);
  return { lang: winner[0], label: _LABELS[winner[0]] || winner[0], confidence };
}

/**
 * All languages the comparison tool supports.
 * code matches the NRC lexicon file suffix and the Opus-MT model suffix.
 */
export const COMPARISON_LANGS = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'de', label: 'German',   flag: '🇩🇪' },
  { code: 'fr', label: 'French',   flag: '🇫🇷' },
  { code: 'es', label: 'Spanish',  flag: '🇪🇸' },
  { code: 'it', label: 'Italian',  flag: '🇮🇹' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
];
