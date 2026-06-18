/**
 * SOMATIC CIPHER DECODER — Decoder Module
 *
 * Exports:
 *   decodeText(input)  — processes a raw input string and returns
 *                        an array of DecodedCharacter objects
 *   isValidChar(char)  — returns true if a character can be decoded
 */

import { SOMATIC_DICTIONARY } from './dictionary.js';

/**
 * @typedef {Object} DecodedCharacter
 * @property {string}      char     — the lowercase character
 * @property {Object|null} data     — the dictionary entry, or null if not found
 * @property {string}      faceImg  — resolved path to the face image
 * @property {string}      bodyImg  — resolved path to the body image
 */

const ALPHANUMERIC_RE = /^[a-z0-9]$/;

/**
 * Returns true if `char` is a single lowercase alphanumeric character.
 * @param {string} char
 * @returns {boolean}
 */
export function isValidChar(char) {
  return ALPHANUMERIC_RE.test(char);
}

/**
 * Converts an input string into an array of decoded character objects.
 * Non-alphanumeric characters (spaces, punctuation, etc.) are silently dropped.
 *
 * @param {string} input — raw user input
 * @returns {DecodedCharacter[]}
 */
export function decodeText(input) {
  if (typeof input !== 'string' || input.trim() === '') return [];

  return input
    .toLowerCase()
    .split('')
    .filter(isValidChar)
    .map(char => buildDecodedCharacter(char));
}

/**
 * Constructs a single DecodedCharacter object for the given character.
 * @param {string} char — a single lowercase alphanumeric character
 * @returns {DecodedCharacter}
 */
function buildDecodedCharacter(char) {
  return {
    char,
    data: SOMATIC_DICTIONARY[char] ?? null,
    faceImg: `assets/${char}-face.png`,
    bodyImg: `assets/${char}-body.png`,
  };
}
