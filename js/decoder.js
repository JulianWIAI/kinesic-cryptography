/**
 * SOMATIC CIPHER DECODER — Decoder Module
 *
 * Exports:
 *   decodeText(input)  — processes a raw input string and returns
 *                        an array of DecodedCharacter objects
 *   isValidChar(char)  — returns true if a character can be decoded
 *
 * Supported characters:
 *   a–z, 0–9, and German umlauts ä, ö, ü (case-insensitive).
 */

import { SOMATIC_DICTIONARY } from './dictionary.js';

/**
 * @typedef {Object} DecodedCharacter
 * @property {string}      char     — the lowercase character
 * @property {Object|null} data     — the dictionary entry, or null if not found
 * @property {string}      faceImg  — resolved path to the face image
 * @property {string}      bodyImg  — resolved path to the body image
 */

// Accepts a–z, 0–9 and the three German umlauts ä ö ü.
const VALID_CHAR_RE = /^[a-z0-9äöü]$/;

/**
 * Normalises uppercase umlauts that JavaScript's toLowerCase() handles correctly
 * (Ä→ä, Ö→ö, Ü→ü) but makes the intent explicit.
 *
 * @param {string} input
 * @returns {string}
 */
function normalise(input) {
  return input.toLowerCase();
}

/**
 * Returns true if `char` is a single decodable character
 * (lowercase alphanumeric or umlaut).
 *
 * @param {string} char
 * @returns {boolean}
 */
export function isValidChar(char) {
  return VALID_CHAR_RE.test(char);
}

/**
 * Converts an input string into an array of decoded character objects.
 * Non-supported characters (spaces, punctuation, etc.) are silently dropped.
 *
 * @param {string} input — raw user input
 * @returns {DecodedCharacter[]}
 */
export function decodeText(input) {
  if (typeof input !== 'string' || input.trim() === '') return [];

  return [...normalise(input)]          // spread to handle multi-byte chars correctly
    .filter(isValidChar)
    .map(char => buildDecodedCharacter(char));
}

/**
 * Constructs a single DecodedCharacter object for the given character.
 *
 * @param {string} char — a single lowercase supported character
 * @returns {DecodedCharacter}
 */
function buildDecodedCharacter(char) {
  // Umlaut filenames use the actual character; image error handler
  // will show a placeholder if no asset exists.
  return {
    char,
    data:    SOMATIC_DICTIONARY[char] ?? null,
    faceImg: `assets/${char}-face.png`,
    bodyImg: `assets/${char}-body.png`,
  };
}
