/**
 * modelManager.js — Translation Model Download Consent & Progress
 *
 * Shows a one-time consent dialog per model before first download.
 * Tracks consent state in localStorage so the dialog is never shown twice.
 * Fires 'model-progress' CustomEvents on document for UI progress bars.
 *
 * Exported API:
 *   requestModelConsent(modelId, langPair, sizeMB) → Promise<boolean>
 *   markModelConsented(modelId)                    → void
 *   isModelConsented(modelId)                      → boolean
 *   emitProgress(modelId, ratio)                   → void
 */

const _STORAGE_KEY = 'kc_model_consent';

function _getConsentMap() {
  try {
    return JSON.parse(localStorage.getItem(_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function _saveConsentMap(map) {
  try {
    localStorage.setItem(_STORAGE_KEY, JSON.stringify(map));
  } catch { /* storage full — ignore */ }
}

export function isModelConsented(modelId) {
  return !!_getConsentMap()[modelId];
}

export function markModelConsented(modelId) {
  const map = _getConsentMap();
  map[modelId] = true;
  _saveConsentMap(map);
}

export function emitProgress(modelId, ratio) {
  document.dispatchEvent(new CustomEvent('model-progress', {
    detail: { modelId, ratio: Math.min(1, Math.max(0, ratio)) },
  }));
}

/**
 * Shows a consent dialog if the user hasn't agreed to this model's download yet.
 * Resolves true if the user clicks "Download & cache", false if they cancel.
 *
 * @param {string} modelId   e.g. "opus-mt-en-de"
 * @param {string} langPair  e.g. "English → German"
 * @param {number} sizeMB    approximate download size in megabytes
 * @returns {Promise<boolean>}
 */
export function requestModelConsent(modelId, langPair, sizeMB) {
  if (isModelConsented(modelId)) return Promise.resolve(true);

  return new Promise(resolve => {
    // ── Build dialog ───────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'mc-overlay';

    overlay.innerHTML = `
      <div class="mc-dialog" role="dialog" aria-modal="true"
           aria-labelledby="mc-title-${modelId}">
        <div class="mc-header">
          <span class="mc-icon">&#8595;</span>
          <span class="mc-title" id="mc-title-${modelId}">Download Translation Model</span>
        </div>
        <div class="mc-body">
          <p class="mc-pair">${langPair}</p>
          <p class="mc-detail">
            This will download approximately <strong>${sizeMB} MB</strong> and store
            it offline in your browser. You will never need to download it again.
          </p>
          <p class="mc-note">Models are stored in your browser's cache and work without internet after first download.</p>
        </div>
        <div class="mc-actions">
          <button class="mc-btn-cancel" type="button">Cancel</button>
          <button class="mc-btn-confirm" type="button">Download &amp; cache</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // trap focus inside dialog
    const confirmBtn = overlay.querySelector('.mc-btn-confirm');
    const cancelBtn  = overlay.querySelector('.mc-btn-cancel');
    confirmBtn.focus();

    function cleanup(result) {
      overlay.remove();
      if (result) markModelConsented(modelId);
      resolve(result);
    }

    confirmBtn.addEventListener('click', () => cleanup(true));
    cancelBtn.addEventListener('click',  () => cleanup(false));
    overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(false); });
    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') cleanup(false);
    });
  });
}
