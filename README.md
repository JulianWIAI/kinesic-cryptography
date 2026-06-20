# Somatic Cipher Decoder — v4.0

A pure client-side research tool that treats language as a **physical frequency signal**. It decodes alphanumeric text into visual dashboards of facial articulation and somatic posture data, runs real-time oscilloscope waveforms, performs full spectral analysis (FFT), and clusters semantic word groups into geometric scatter fields — all with zero backend dependencies.

---

## Screenshots

### Single Word Decoder — Overview
![Single Word Decoder](https://raw.githubusercontent.com/JulianWIAI/kinesic-cryptography/main/screenshots/decode-view.png)

### Cluster Mode — Overview
![Cluster Mode](https://raw.githubusercontent.com/JulianWIAI/kinesic-cryptography/main/screenshots/cluster-mode.png)

### Psycholinguistic Diagnostic Engine
![Diagnostic Engine](https://raw.githubusercontent.com/JulianWIAI/kinesic-cryptography/main/screenshots/diagnostic-engine.png)

### Spectral Analysis Engine
![Spectral Analysis Engine](https://raw.githubusercontent.com/JulianWIAI/kinesic-cryptography/main/screenshots/spectral-engine.png)

---

## Features

### Decoder

| Feature | Description |
|---|---|
| **Grid View** | Each decoded character renders as a card with two columns: Facial Articulation and Somatic Posture |
| **Narrative View** | Horizontal scrollable timeline showing all characters in sequence |
| **Word Stream View** | Two parallel strips — one for all face images, one for all body images |
| **Cluster Mode** | Comma-separated word list decodes all words simultaneously; outputs Center of Gravity metrics, a word table, and a Cluster Scatter |
| **Cluster Image Views** | In Cluster Mode the Grid / Narrative / Word Stream views render per-word character streams so words can be visually compared side-by-side |
| **Disable Images** | Toggle button in the controls bar that instantly hides all character image cards in both single and cluster mode — useful for quick analysis of large clusters without scroll |
| **Contextual Synthesis** | Fixed bottom panel concatenates all descriptions into a single narrative |
| **Category Theming** | Each character is tagged `Physical`, `Emotional`, or `Intellectual` with a distinct card colour |

---

### Global Localization Bridge

Transliterates Japanese and Chinese text into the Latin alphabet before passing it through the physics engine. Accessible via the **SIGNAL LANGUAGE** bar above the input.

| Mode | Library | How it works |
|---|---|---|
| **AUTO-DETECT** | — | Heuristic Unicode scan: Hiragana/Katakana → Japanese, CJK Ideographs → Chinese, otherwise Western |
| **WESTERN (A–Z)** | — | Pass-through; no transliteration (default behaviour) |
| **JAPANESE (ROMAJI)** | [Kuroshiro](https://github.com/hexenq/kuroshiro) + [Kuromoji](https://github.com/takuyaa/kuromoji) | Converts mixed Kanji/Kana to Romaji; dictionary (~8 MB) is downloaded once on first use from the jsDelivr CDN |
| **CHINESE (PINYIN)** | [pinyin-pro](https://github.com/zh-lx/pinyin-pro) | Converts Hanzi to tone-stripped Pinyin (ā → a); loaded as an ES module on first use via esm.sh |

**Intercepted Base Signal box** — visible above the waveform panel after a Japanese or Chinese decode. Shows the exact Romanised string that was fed into the engine so the transliteration is always auditable.

**Status indicator** — the localization bar displays real-time status messages during dictionary loading (`LOADING JP DICTIONARY…`) and confirms readiness (`JP READY`).

---

### Wavelength Telemetry

A real-time oscilloscope that fires on every keystroke. No button press required — the panel appears automatically as you type.

| Signal shape | Interpretation |
|---|---|
| Smooth / flat oscillations | High Somatic Resonance — letters with similar values (e.g. NOMA, EEL) |
| Erratic / jagged spikes | High-Load State / System Text — large value jumps (e.g. WIRTSCHAFT, KOMPLEX) |

- **X-axis** — letter position in the input sequence
- **Y-axis** — canonical letter value (A=1 … Z=26, Ä=1.5, Ö=15.5, Ü=21.5), range 0–27
- In **single mode** one waveform is drawn; in **Cluster Mode** every word gets its own coloured line (up to 14 distinct colours, cycling for larger sets)
- Updates in-place with `animation: false` for a true real-time oscilloscope feel

**14-colour cluster palette** (assigned left-to-right as words are typed):

| # | Colour | | # | Colour |
|---|---|---|---|---|
| 0 | Cyan | | 7 | Sky |
| 1 | Violet | | 8 | Fuchsia |
| 2 | Emerald | | 9 | Yellow |
| 3 | Amber | | 10 | Red |
| 4 | Pink | | 11 | Teal |
| 5 | Green | | 12 | Indigo |
| 6 | Orange | | 13 | Light Green |

The same palette is shared across Wavelength Telemetry, Spectral Oscilloscopes, Diagnostic Radar, and the Cluster Balkendiagramm so colours stay consistent across all panels.

---

### Psycholinguistic Diagnostic Engine

![Diagnostic Engine](https://raw.githubusercontent.com/JulianWIAI/kinesic-cryptography/main/screenshots/diagnostic-engine.png)

Triggered on every decode. Collapsible panel beneath the output. Behaviour differs between single-word and cluster mode.

#### Single-Word Mode

| Metric | Description |
|---|---|
| **Letters** | Count of valid (mapped) characters in the word |
| **Quersumme** | Digital root (1–9) of the word sum, mapped to one of nine Archetypes |
| **Word Sum (Σ)** | Sum of all letter values |
| **σ (Sigma)** | Population standard deviation of the letter values |
| **Complexity Tier** | T1 σ<2.0 · T2 2.0≤σ<5.0 · T3 σ≥5.0 |
| **Category Distribution** | Segmented bar: % of total letter value per archetypal category |
| **Sovereignty / Somatic / Resonant scores** | Proportion of letter values from Sovereign · (Kinetic+Liminal) · (Resonant+Origin) |
| **Archetypal Radar** | 5-axis Chart.js radar — Origin, Kinetic, Sovereign, Liminal, Resonant |
| **Complexity Scatter** | Letter value by position, coloured by category |

#### Cluster Mode (N words)

All metrics are computed per word and displayed in colour-coded rows matching the Wavelength Telemetry palette.

| Section | Description |
|---|---|
| **Per-word metric rows** | One row per word, left-bordered in its cluster colour — shows Letters, Σ, σ, Tier badge, Quersumme + Archetype name |
| **Category distribution bars** | One segmented bar per word, title tinted in the word's cluster colour |
| **Scores table** | Grid table: Sovereignty %, Somatic %, Resonant % for every word in a single view |
| **Archetypal Radar** | Multi-dataset radar — one coloured polygon per word, legend labelled with word names |
| **Cluster Balkendiagramm** | Horizontal bar chart — one bar per word showing Word Sum (Σ); bar colours match the cluster palette; tooltip shows Σ, σ, and Tier; bar height adapts to word count (38 px/word) |

#### Cluster Scatter (in output section)

Located directly below the somatic character output when Cluster Mode is active:

| Element | Description |
|---|---|
| **Center of Gravity** | Average Σ and average σ across all valid cluster words |
| **Word metrics table** | Per-word Σ, σ, Tier badge, Quersumme + Archetype |
| **Cluster Scatter** | X = Word Sum (Σ), Y = σ; one labelled, colour-coded point per word; dashed threshold lines at σ=2.0 (T1/T2) and σ=5.0 (T2/T3); word labels drawn next to each dot; tooltips show full metrics |

---

### Spectral Analysis Engine

![Spectral Analysis Engine](https://raw.githubusercontent.com/JulianWIAI/kinesic-cryptography/main/screenshots/spectral-engine.png)

Always-visible section at the bottom of the main content. Driven entirely by the signal input — no separate text field needed.

**Live oscilloscopes (on every keystroke)**

| Chart | Description |
|---|---|
| **A — Global Envelope** | Divides the full input into 100 uniform buckets; plots the mean letter value per bucket as a smooth bezier curve — reveals macro rhythmic structure |
| **B — Micro Wavelength** | Plots the first 256 raw letter values with zero tension (step-like) — exposes high-frequency jaggedness at character level |

- In **Cluster Mode** all words are concatenated and each word's signal is overlaid with its cluster colour

**On DECODE (deep analysis)**

| Output | Description |
|---|---|
| **Window Aggregation Metrics** | Avg word σ, dominant Quersumme + Archetype name, Sovereignty %, Somatic %, word count |
| **Dominant FFT Harmonics** | Radix-2 Cooley-Tukey FFT on the 256-sample Hann-windowed signal; top 5 non-DC power bins with relative strength bars — detects artificial or mechanical rhythmic patterns |
| **Complexity Scatter (Word Sum × σ)** | One point per word; T1=green, T2=orange, T3=red; dashed boundaries at σ=2.0 and σ=5.0 |

---

## Single Word — Usage

1. Select a **SIGNAL LANGUAGE** if needed (default: AUTO-DETECT)
2. Type or paste a word into the **SIGNAL INPUT** field — the Wavelength Telemetry and Spectral Oscilloscopes update live as you type
3. Press **DECODE** or hit Enter
4. Switch between **Grid**, **Narrative**, and **Word Stream** views using the controls bar
5. Toggle **Disable Images** to hide character cards and focus on the numerical analysis panels
6. For Japanese/Chinese input the **Intercepted Base Signal** box appears above the waveform, showing the exact Romanised string fed to the engine

---

## Cluster Mode — Usage

1. Click **Cluster Mode** in the controls bar (the single input is replaced by a textarea)
2. Select a **SIGNAL LANGUAGE** if needed
3. Type a comma-separated list of words: `ring, marriage, couple, children, family`
4. As you type the **Wavelength Telemetry** and **Spectral Oscilloscopes** update live — each word as its own coloured line
5. Click **Analyze Cluster** to decode all words simultaneously
6. The output section shows the **Center of Gravity** block, a word metrics table, the **Cluster Scatter**, and a **CHARACTER STREAMS** section with one image block per word
7. Switch between **Grid**, **Narrative**, and **Word Stream** views to change how the per-word character images are laid out — all words update at once for direct visual comparison
8. Toggle **Disable Images** to collapse the CHARACTER STREAMS section and show only the analytics table and scatter — useful when comparing 10+ words and scroll space is limited
9. The **Psycholinguistic Diagnostic Engine** shows per-word metric rows, category bars, the multi-word radar, and the **Balkendiagramm**

---

## Archetypal Letter Map

| Letter | Value | Category |
|---|---|---|
| A | 1 | Origin |
| Ä | 1.5 | Liminal |
| B | 2 | Kinetic |
| C | 3 | Resonant |
| D | 4 | Sovereign |
| E | 5 | Kinetic |
| F | 6 | Kinetic |
| G | 7 | Liminal |
| H | 8 | Resonant |
| I | 9 | Sovereign |
| J | 10 | Kinetic |
| K | 11 | Sovereign |
| L | 12 | Resonant |
| M | 13 | Resonant |
| N | 14 | Liminal |
| O | 15 | Resonant |
| Ö | 15.5 | Liminal |
| P | 16 | Kinetic |
| Q | 17 | Sovereign |
| R | 18 | Liminal |
| S | 19 | Kinetic |
| T | 20 | Sovereign |
| U | 21 | Resonant |
| Ü | 21.5 | Liminal |
| V | 22 | Kinetic |
| W | 23 | Sovereign |
| X | 24 | Sovereign |
| Y | 25 | Resonant |
| Z | 26 | Sovereign |

Non-alphabetic characters (digits, spaces, punctuation) contribute a value of 0 and are excluded from all calculations. Japanese and Chinese input is transliterated to Latin before lookup.

---

## Quersumme Archetypes

Digital root of the word sum (1–9), mapped to an archetype:

| Root | Archetype | Resonance |
|---|---|---|
| 1 | Source | Absolute necessity — initialization energy |
| 2 | Bond | Partnership, duality, supportive structure |
| 3 | Overflow | Creative excess, sensory delight |
| 4 | Foundation | Stability, rigid framing, physical logic |
| 5 | Friction | Transition, movement, the weight of change |
| 6 | Grounding | Lower-body focus, heavy internalization |
| 7 | Precursor | Intelligence pushing forward, strategic probing |
| 8 | Infinity/State | Complexity, systems, recursion |
| 9 | Transcendent | Pure intellect, high-state abstraction |

---

## Complexity Tiers

| Tier | σ range | Label | Interpretation |
|---|---|---|---|
| T1 | σ < 2.0 | Somatic/Universal | Letters clustered tightly — natural, embodied words |
| T2 | 2.0 ≤ σ < 5.0 | Archetypal Bridge | Moderate spread — transitional vocabulary |
| T3 | σ ≥ 5.0 | State/System | High spread — institutional or technical language |

---

## How to Run

This project uses **ES6 Modules** (`type="module"`), which require an HTTP server — opening `index.html` directly via `file://` will not work.

**Recommended: VS Code Live Server**

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**
3. The app opens at `http://127.0.0.1:5500`

**Alternative: Python**

```bash
python3 -m http.server 5500
# then open http://localhost:5500
```

> **Japanese mode** requires an internet connection on first use to download the Kuromoji dictionary (~8 MB) from the jsDelivr CDN. It is cached by the browser after the first load.

---

## File Structure

```
kinesic-cryptography/
│
├── index.html                   # App shell — all sections and canvas elements
│
├── css/
│   ├── style.css                # Global tokens, reset, typography, layout,
│   │                            #   localization bar, base signal box
│   ├── components.css           # Cards, timeline, cluster output, category colours
│   └── diagnostic.css           # Diagnostic panel, waveform, spectral engine,
│                                #   cluster metric rows, Balkendiagramm,
│                                #   cluster character stream section
│
├── js/
│   ├── main.js                  # Entry point — event wiring, view switching,
│   │                            #   cluster parse/decode/render, spectral integration,
│   │                            #   language selection, disable-images toggle
│   │
│   │   ── Localization ─────────────────────────────────────
│   ├── pipeline.js              # Global Localization Bridge:
│   │                            #   detectLanguage (Unicode heuristic),
│   │                            #   initKuroshiro (lazy Kuromoji dict load),
│   │                            #   processInput (transliterate → normalise → engineInput)
│   │
│   │   ── Physics & Math ───────────────────────────────────
│   ├── physics.js               # FFT (Radix-2 Cooley-Tukey, N=256, Hann window),
│   │                            #   analyzeWord, aggregateWindow, getMicroOscilloscope,
│   │                            #   runSpectralAnalysis, getGlobalEnvelope
│   ├── classifier.js            # Unified tier + archetype surface; ARCHETYPE_NAMES map
│   ├── letterMap.js             # Canonical A–Z / Ä Ö Ü value + category lookup
│   ├── complexity.js            # Word sum, σ, complexity tier (T1/T2/T3), letter count
│   ├── quersumme.js             # Digital root + nine Archetype objects
│   ├── categoricalAnalysis.js   # Category breakdown, sovereignty/somatic/resonant scores
│   │
│   │   ── Visualisation ─────────────────────────────────────
│   ├── palette.js               # 14-colour CLUSTER_COLORS palette (shared across all
│   │                            #   chart modules for consistent per-word colouring)
│   ├── charts.js                # Chart.js renderers:
│   │                            #   renderRadarChart, renderScatterChart,
│   │                            #   renderGlobalEnvelopeChart, renderMicroWaveChart,
│   │                            #   renderWordScatterChart, renderClusterScatterChart,
│   │                            #   renderClusterBarChart (Balkendiagramm)
│   ├── waveform.js              # Real-time Wavelength Telemetry — N-series oscilloscope
│   │
│   │   ── Decoder ──────────────────────────────────────────
│   ├── diagnosticPanel.js       # Diagnostic Engine UI — single/cluster renders
│   ├── decoder.js               # Input → DecodedCharacter array
│   └── dictionary.js            # Somatic data ledger (face + body per character)
│
└── assets/
    ├── a-face.png               # Facial articulation image for "a"
    ├── a-body.png               # Somatic posture image for "a"
    └── ...                      # One face + one body image per supported character
```

---

## Asset Naming Convention

Images must follow this exact naming pattern for the decoder to locate them:

```
assets/[character]-face.png
assets/[character]-body.png
```

**Examples:** `assets/a-face.png`, `assets/3-body.png`, `assets/z-face.png`

All characters are normalised to **lowercase** before the path is constructed. For Japanese/Chinese input, the Romanised equivalent letter is used after transliteration.

---

## Dictionary Structure

Each entry in `js/dictionary.js` follows this structure:

```js
export const SOMATIC_DICTIONARY = {
  'a': {
    category: 'Physical',   // 'Physical' | 'Emotional' | 'Intellectual'
    face: 'Description of the facial articulation for this character.',
    body: 'Description of the somatic posture for this character.',
  },
  // ...
};
```

### Category Colour Key

| Category | Card Background | Use |
|---|---|---|
| `Physical` | Dark blue | Characters primarily engaging physical articulation |
| `Emotional` | Dark amber | Characters with emotional or relational somatic quality |
| `Intellectual` | Steel grey-blue | Characters associated with cognitive or focused expression |

---

## Supported Characters

The decoder handles all **alphanumeric** input: `a–z`, `0–9`, and German umlauts `ä ö ü` (36+ characters). Spaces, punctuation, and special characters are silently discarded. Input is automatically converted to lowercase before lookup.

Japanese and Chinese text is first transliterated to a Latin equivalent by the **Global Localization Bridge** before character lookup.

---

## Technology

- **Vanilla HTML / CSS / JavaScript** — no frameworks, no build tools, no backend
- **ES6 Modules** — fully modular with `import`/`export`
- **[Chart.js v4](https://www.chartjs.org/)** — loaded via CDN (UMD global); radar, scatter, line, bar, and waveform charts
- **[Kuroshiro v1](https://github.com/hexenq/kuroshiro) + [kuroshiro-analyzer-kuromoji](https://github.com/hexenq/kuroshiro-analyzer-kuromoji)** — loaded via jsDelivr CDN as UMD globals; Japanese → Romaji transliteration with Kuromoji dictionary
- **[pinyin-pro v3](https://github.com/zh-lx/pinyin-pro)** — loaded as an ES module via esm.sh on first use; Chinese → tone-stripped Pinyin
- **Pure-JS FFT** — Radix-2 Cooley-Tukey implemented in `physics.js`; no Web Audio API required
- **14-colour shared palette** — `palette.js` exports `CLUSTER_COLORS`; imported by `waveform.js`, `charts.js`, and `diagnosticPanel.js` to keep per-word colours consistent across all panels
- **CSS Custom Properties** — centralised design tokens for all colours, spacing, and typography
- [Space Mono](https://fonts.google.com/specimen/Space+Mono) + [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts
