/**
 * tts.js — Text-to-Speech via Web Speech API
 *
 * Uses the browser's built-in SpeechSynthesis API — no downloads,
 * no API key, fully offline.  Voice quality depends on the OS;
 * Windows 11 ships Neural TTS voices for EN, DE, FR, ES, IT and JA.
 *
 * Exported API:
 *   speak(text, langCode, onStart, onEnd)  → void
 *   stopSpeaking()                          → void
 *   isSpeaking()                            → boolean
 *   getAvailableVoice(langCode)             → SpeechSynthesisVoice | null
 */

// BCP 47 language tags used to select the right voice.
const LANG_TAGS = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  nl: 'nl-NL',
  ja: 'ja-JP',
};

// Cache of resolved voices keyed by lang code (populated after voices load).
const _voiceCache = new Map();

// Global playback rate — shared across all speak() calls on the page.
// 0.7 = slow, 1.0 = normal, 2.0 = fast.
let _rate = 1.0;

/**
 * Set the global TTS playback rate.
 * The new value takes effect on the next speak() call.
 *
 * @param {number} rate  Playback rate (e.g. 0.7, 1.0, 2.0)
 */
export function setRate(rate) { _rate = rate; }

/** Returns the currently active playback rate. */
export function getRate() { return _rate; }

/**
 * Voices load asynchronously on first access.
 * This promise resolves once the voice list is available.
 *
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
function _getVoices() {
  return new Promise(resolve => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // Voices not ready yet — wait for the voiceschanged event.
    speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(speechSynthesis.getVoices());
    }, { once: true });
  });
}

/**
 * Find the best available voice for a language code.
 *
 * Priority order:
 *   1. Exact BCP 47 match  AND  name contains "Neural" (Windows 11 quality)
 *   2. Exact BCP 47 match  (any voice)
 *   3. Any voice whose lang starts with the same ISO 639-1 prefix (e.g. "de-")
 *   4. null — no matching voice; the browser will pick its default
 *
 * @param {string} langCode  One of: en | de | fr | es | it | ja
 * @returns {Promise<SpeechSynthesisVoice|null>}
 */
export async function getAvailableVoice(langCode) {
  if (_voiceCache.has(langCode)) return _voiceCache.get(langCode);

  const tag    = LANG_TAGS[langCode];
  if (!tag) return null;

  const voices = await _getVoices();
  const prefix = tag.split('-')[0].toLowerCase();

  // 1. Exact tag + Neural
  let voice = voices.find(v => v.lang === tag && /neural/i.test(v.name));
  // 2. Exact tag, any voice
  if (!voice) voice = voices.find(v => v.lang === tag);
  // 3. Same language prefix (handles en-GB, de-AT, etc.)
  if (!voice) voice = voices.find(v => v.lang.toLowerCase().startsWith(prefix + '-'));

  _voiceCache.set(langCode, voice ?? null);
  return voice ?? null;
}

/**
 * Speak text in the specified language using the best available voice.
 *
 * @param {string}   text      The text to speak (native script — not romanized).
 * @param {string}   langCode  Language code: en | de | fr | es | it | ja
 * @param {Function} [onStart] Called when speech begins.
 * @param {Function} [onEnd]   Called when speech ends or is cancelled.
 */
export async function speak(text, langCode, onStart, onEnd) {
  if (!text || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  // Cancel anything currently playing.
  speechSynthesis.cancel();

  const utterance   = new SpeechSynthesisUtterance(text);
  utterance.lang    = LANG_TAGS[langCode] ?? 'en-US';
  // Apply global rate; Japanese gets an extra 10% slowdown at any speed to aid clarity.
  utterance.rate    = langCode === 'ja' ? _rate * 0.9 : _rate;
  utterance.pitch   = 1.0;
  utterance.volume  = 1.0;

  // Apply best matching voice if one is available.
  const voice = await getAvailableVoice(langCode);
  if (voice) utterance.voice = voice;

  utterance.onstart = () => onStart?.();
  utterance.onend   = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  speechSynthesis.speak(utterance);
}

/** Stop any active speech immediately. */
export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/** Returns true if the browser is currently speaking. */
export function isSpeaking() {
  return 'speechSynthesis' in window && speechSynthesis.speaking;
}

/** True if the current browser supports the Web Speech API at all. */
export const ttsSupported = 'speechSynthesis' in window;
