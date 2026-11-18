/**
 * translator.js — Offline In-Browser Translation via Transformers.js
 *
 * Uses Xenova/Transformers.js (Hugging Face) with Opus-MT quantized models.
 * Models are downloaded once and cached permanently by the browser.
 * No API key, no server, no internet connection after first model download.
 *
 * Translation routing:
 *   EN input → translate directly to each target language
 *   Non-EN input → pivot through EN first (input→EN, then EN→target)
 *
 * Exported API:
 *   translate(text, fromLang, toLang)              → Promise<string>
 *   getRequiredModels(inputLang, targetLangs)      → ModelDescriptor[]
 *   MODEL_REGISTRY                                 → Map of all available models
 */

import { requestModelConsent, isModelConsented, emitProgress } from './modelManager.js';

// ── Transformers.js CDN URL ───────────────────────────────────────────────────
// Loaded lazily on first translate() call.
const _TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

let _transformers = null;
let _loadPromise  = null;

async function _ensureTransformers() {
  if (_transformers) return _transformers;
  if (_loadPromise)  return _loadPromise;

  _loadPromise = new Promise((resolve, reject) => {
    // Use dynamic import — works as an ES module
    import(_TRANSFORMERS_CDN)
      .then(m => {
        _transformers = m;
        // Disable remote model fetching to enforce cache-first behaviour
        // (models only load after user consented and they were cached)
        resolve(m);
      })
      .catch(err => {
        _loadPromise = null;
        reject(new Error(`Failed to load Transformers.js: ${err.message}`));
      });
  });

  return _loadPromise;
}

// ── Model registry ────────────────────────────────────────────────────────────
// modelId: Hugging Face model ID under the Xenova namespace
// sizeMB: approximate quantized (int8) model size shown in consent dialog
export const MODEL_REGISTRY = new Map([
  ['en-de', { modelId: 'Xenova/opus-mt-en-de', from: 'en', to: 'de', sizeMB: 90, label: 'English → German'  }],
  ['en-fr', { modelId: 'Xenova/opus-mt-en-fr', from: 'en', to: 'fr', sizeMB: 90, label: 'English → French'  }],
  ['en-es', { modelId: 'Xenova/opus-mt-en-es', from: 'en', to: 'es', sizeMB: 90, label: 'English → Spanish' }],
  ['en-it', { modelId: 'Xenova/opus-mt-en-it', from: 'en', to: 'it', sizeMB: 90, label: 'English → Italian' }],
  ['en-nl', { modelId: 'Xenova/opus-mt-en-nl', from: 'en', to: 'nl', sizeMB: 90, label: 'English → Dutch'   }],
  ['de-en', { modelId: 'Xenova/opus-mt-de-en', from: 'de', to: 'en', sizeMB: 90, label: 'German → English'  }],
  ['fr-en', { modelId: 'Xenova/opus-mt-fr-en', from: 'fr', to: 'en', sizeMB: 90, label: 'French → English'  }],
  ['es-en', { modelId: 'Xenova/opus-mt-es-en', from: 'es', to: 'en', sizeMB: 90, label: 'Spanish → English' }],
  ['it-en', { modelId: 'Xenova/opus-mt-it-en', from: 'it', to: 'en', sizeMB: 90, label: 'Italian → English' }],
  ['nl-en', { modelId: 'Xenova/opus-mt-nl-en', from: 'nl', to: 'en', sizeMB: 90, label: 'Dutch → English'   }],
]);

// ── M2M-100 multilingual model (used for all Japanese paths) ─────────────────
// Meta's M2M-100 (418 M params, int8) covers 100 languages with general-purpose
// quality far superior to the OPUS-corpus-based opus-mt-en-jap model.
// It uses src_lang / tgt_lang parameters rather than a per-pair pipeline.
const _M2M100 = {
  modelId: 'Xenova/m2m100_418M',
  sizeMB:  420,
  label:   'Multilingual M2M-100 (Japanese)',
};
let _m2m100Pipeline = null;

async function _getM2M100Pipeline() {
  if (_m2m100Pipeline) return _m2m100Pipeline;

  const consented = await requestModelConsent(_M2M100.modelId, _M2M100.label, _M2M100.sizeMB);
  if (!consented) throw new Error(`Model download cancelled by user (${_M2M100.label})`);

  const { pipeline, env } = await _ensureTransformers();
  env.allowRemoteModels = true;
  env.useBrowserCache   = true;

  _m2m100Pipeline = await pipeline('translation', _M2M100.modelId, {
    progress_callback: (p) => {
      if (p.status === 'progress') emitProgress(_M2M100.modelId, p.progress / 100);
    },
  });
  return _m2m100Pipeline;
}

// ── Active pipeline cache ─────────────────────────────────────────────────────
// key: 'en-de' etc.  value: Transformers.js TranslationPipeline instance
const _pipelines = new Map();

function _pairKey(from, to) { return `${from}-${to}`; }

/**
 * Get (or lazily initialise) a translation pipeline for a language pair.
 * Shows consent dialog on first use if not already consented.
 *
 * @param {string} from  Source language code
 * @param {string} to    Target language code
 * @returns {Promise<any>}  Resolved Transformers.js pipeline
 */
async function _getPipeline(from, to) {
  const key   = _pairKey(from, to);
  const entry = MODEL_REGISTRY.get(key);
  if (!entry) throw new Error(`No translation model registered for ${from}→${to}`);

  if (_pipelines.has(key)) return _pipelines.get(key);

  // ── Consent check ─────────────────────────────────────────────────────────
  const consented = await requestModelConsent(entry.modelId, entry.label, entry.sizeMB);
  if (!consented) {
    throw new Error(`Model download cancelled by user (${entry.label})`);
  }

  // ── Load Transformers.js ──────────────────────────────────────────────────
  const { pipeline, env } = await _ensureTransformers();

  // Allow remote fetching (for first-time download); browser Cache API stores it
  env.allowRemoteModels  = true;
  env.useBrowserCache    = true;

  // ── Create pipeline with progress callback ────────────────────────────────
  const pipelineInst = await pipeline('translation', entry.modelId, {
    progress_callback: (p) => {
      if (p.status === 'progress') {
        emitProgress(entry.modelId, p.progress / 100);
      }
    },
  });

  _pipelines.set(key, pipelineInst);
  return pipelineInst;
}

/**
 * Translate text from one language to another.
 * Handles the pivot through English for non-English source languages.
 *
 * @param {string} text      Text to translate
 * @param {string} fromLang  Source language code (e.g. 'en', 'de', 'ja')
 * @param {string} toLang    Target language code
 * @returns {Promise<string>}
 */
export async function translate(text, fromLang, toLang) {
  if (fromLang === toLang) return text;

  // ── Japanese paths → M2M-100 (much better quality than opus-mt-en-jap) ────
  if (fromLang === 'ja' || toLang === 'ja') {
    // If source is not English and not Japanese, pivot to English first via opus-mt
    let srcText = text;
    let srcLang  = fromLang;
    if (fromLang !== 'en' && fromLang !== 'ja') {
      const pivotPipe   = await _getPipeline(fromLang, 'en');
      const pivotResult = await pivotPipe(text, { max_new_tokens: 256 });
      srcText = pivotResult[0]?.translation_text ?? text;
      srcLang = 'en';
    }
    const m2m    = await _getM2M100Pipeline();
    const result = await m2m(srcText, { src_lang: srcLang, tgt_lang: toLang, max_new_tokens: 256 });
    return result[0]?.translation_text ?? srcText;
  }

  // ── Direct path: en → target ─────────────────────────────────────────────
  if (fromLang === 'en') {
    const pipe   = await _getPipeline('en', toLang);
    const result = await pipe(text, { max_new_tokens: 256 });
    return result[0]?.translation_text ?? text;
  }

  // ── Pivot path: source → en → target ─────────────────────────────────────
  const pivotPipe   = await _getPipeline(fromLang, 'en');
  const pivotResult = await pivotPipe(text, { max_new_tokens: 256 });
  const inEnglish   = pivotResult[0]?.translation_text ?? text;

  if (toLang === 'en') return inEnglish;

  const finalPipe   = await _getPipeline('en', toLang);
  const finalResult = await finalPipe(inEnglish, { max_new_tokens: 256 });
  return finalResult[0]?.translation_text ?? inEnglish;
}

/**
 * Returns the list of model descriptors that would be needed for a given
 * input language and set of target languages. Used to show pre-download info.
 *
 * @param {string}   inputLang    Detected input language code
 * @param {string[]} targetLangs  Array of target language codes
 * @returns {Array<{modelId, label, sizeMB}>}
 */
export function getRequiredModels(inputLang, targetLangs) {
  const needed = new Set();

  // If input isn't English (and not Japanese — handled by M2M-100), add reverse pivot
  if (inputLang !== 'en' && inputLang !== 'ja') {
    needed.add(_pairKey(inputLang, 'en'));
  }

  // Forward opus-mt models for non-Japanese, non-source targets
  for (const tgt of targetLangs) {
    if (tgt !== inputLang && tgt !== 'en' && tgt !== 'ja') {
      needed.add(_pairKey('en', tgt));
    }
  }

  const models = [...needed].map(key => MODEL_REGISTRY.get(key)).filter(Boolean);

  // M2M-100 is needed whenever Japanese is in the mix
  const needsJapanese = targetLangs.includes('ja') || inputLang === 'ja';
  if (needsJapanese) models.push(_M2M100);

  return models;
}
