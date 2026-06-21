# Somatic Cipher Decoder — v5.0

A pure client-side research tool that treats language as a **physical frequency signal**. It decodes alphanumeric text into visual dashboards of facial articulation, somatic posture, Egyptian hieroglyphic etymology, and Greek physics variables — then runs real-time oscilloscope waveforms, performs full spectral analysis (FFT), clusters semantic word groups into geometric scatter fields, and exports the entire analysis as a classified SIGINT dossier — all with zero backend dependencies.

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

### Decoder Streams

Each decoded character is rendered across **four parallel visual streams**. Streams can be toggled on/off individually via the **STREAMS** selector bar — visibility changes are instant (CSS body-class technique, no re-render).

| Stream | Accent | Description |
|---|---|---|
| **Facial Articulation** | Teal | Photographic image of the facial gesture for each character |
| **Somatic Posture** | Violet | Photographic image of the body/postural expression |
| **Egyptian Etymology** | Amber `#e8b84b` | Unicode hieroglyph + description of the character's ancient Egyptian root |
| **Greek Physics Variables** | Sky blue `#7dd3fc` | Greek letter (e.g. α, β, Δ) with its classical physics interpretation |

---

### View Modes

| View | Description |
|---|---|
| **Grid** | Each decoded character renders as a card with all four streams |
| **Narrative** | Horizontal scrollable timeline — each character is a node containing all four stream glyphs |
| **Word Stream** | Four parallel strips — one per stream — all characters in sequence |
| **Cluster Mode** | Comma-separated word list; outputs Center of Gravity metrics, a word table, a Cluster Scatter, and per-word character streams |
| **Disable Images** | Toggle in the controls bar that instantly hides all character image cards in single and cluster mode |

---

### Global Localization Bridge

Transliterates non-Latin scripts into the Latin alphabet before passing input through the physics engine. Accessible via the **SIGNAL LANGUAGE** bar above the input. Now supports **seven modes**.

| Mode | Engine | How it works |
|---|---|---|
| **AUTO-DETECT** | — | Unicode heuristic: Hiragana/Katakana → Japanese; CJK Ideographs → Chinese; Cyrillic → Cyrillic; Arabic block → Arabic; Hangul → Korean; otherwise Western |
| **WESTERN (A–Z)** | — | Pass-through; no transliteration |
| **JAPANESE (ROMAJI)** | [Kuroshiro](https://github.com/hexenq/kuroshiro) + [Kuromoji](https://github.com/takuyaa/kuromoji) | Converts mixed Kanji/Kana to Romaji; Kuromoji dictionary (~8 MB) downloaded once via jsDelivr CDN |
| **CHINESE (PINYIN)** | [pinyin-pro](https://github.com/zh-lx/pinyin-pro) | Converts Hanzi to tone-stripped Pinyin (ā → a); loaded as an ES module via esm.sh on first use |
| **CYRILLIC (LATINIZED)** | Built-in map | 66-entry map covering lowercase, uppercase, and Ukrainian/Bulgarian variants (щ→shch, ш→sh, ж→zh, я→ya, etc.) |
| **ARABIC-FARSI (LATINIZED)** | Built-in map | `NFKC` normalization collapses FB50–FEFF presentation forms to canonical 0600–06FF block first; then consonant + diacritic strip map; Farsi extras (پ→p, چ→ch, ژ→zh, گ→g); Arabic-Indic digits (٠–٩ → 0–9) |
| **KOREAN (ROMAJA)** | Built-in decomposer | Zero-dependency Unicode decomposition: `idx = cp − 0xAC00`; choseong / jungseong / jongseong extracted by formula; mapped to 19 initials, 21 vowels, 28 finals |

**Intercepted Base Signal box** — visible after a Japanese, Chinese, Cyrillic, Arabic/Farsi, or Korean decode. Shows the exact Latinized string fed to the engine.

---

### Intercepted Wave Equation

Appears beneath the output section after every decode. Expresses each decoded word as a Greek physics equation:

```
WAVE_FUNC(WORD) = β + α + Δ + ...
```

Each term is the Greek physics variable assigned to the corresponding letter. Ionian numerals are used for numeric characters (e.g. `MI6` → `WAVE_FUNC(MI6) = μ + ι + ϛ'`).

---

### SIGINT Dossier Export

An **EXPORT SIGINT DOSSIER** button appears beneath the diagnostic panel after each decode. Clicking it calls `window.print()` with a purpose-built `@media print` stylesheet that:

- Applies a classification banner: `TOP SECRET // SIGINT // SOMATIC CIPHER ANALYSIS`
- Stamps a unique document ID (`SCD-` + base-36 timestamp) and ISO timestamp
- Lays cards in a 3-column B&W grid
- Converts stream images to greyscale
- Renders the wave equation in bold monospaced type
- Hides all UI chrome (header, controls, legend, guide, tooltips)

---

### Wavelength Telemetry

A real-time oscilloscope that fires on every keystroke. No button press required.

| Signal shape | Interpretation |
|---|---|
| Smooth / flat oscillations | High Somatic Resonance — letters with similar values |
| Erratic / jagged spikes | High-Load State / System Text — large value jumps |

- **X-axis** — letter position in the input sequence
- **Y-axis** — canonical letter value (A=1 … Z=26, Ä=1.5, Ö=15.5, Ü=21.5), range 0–27
- One waveform in single mode; one coloured line per word in Cluster Mode (14-colour shared palette)

---

### Psycholinguistic Diagnostic Engine

Triggered on every decode. Collapsible panel beneath the output.

#### Single-Word Mode

| Metric | Description |
|---|---|
| **Letters** | Count of valid (mapped) characters |
| **Quersumme** | Digital root (1–9) of the word sum, mapped to one of nine Archetypes |
| **Word Sum (Σ)** | Sum of all letter values |
| **σ (Sigma)** | Population standard deviation of the letter values |
| **Complexity Tier** | T1 σ<2.0 · T2 2.0≤σ<5.0 · T3 σ≥5.0 |
| **Category Distribution** | Segmented bar: % of total letter value per archetypal category |
| **Sovereignty / Somatic / Resonant scores** | Proportion of letter values from Sovereign · (Kinetic+Liminal) · (Resonant+Origin) |
| **Archetypal Radar** | 5-axis radar — Origin, Kinetic, Sovereign, Liminal, Resonant |
| **Complexity Scatter** | Letter value by position, coloured by category |

The **Quersumme**, **Word Sum**, and **σ Sigma** tiles each carry a `[?]` tooltip badge with a plain-language explanation (see [Contextual Tooltips](#contextual-tooltips)).

#### Cluster Mode (N words)

| Section | Description |
|---|---|
| **Per-word metric rows** | One row per word — Letters, Σ, σ, Tier badge, Quersumme + Archetype name |
| **Category distribution bars** | One segmented bar per word |
| **Scores table** | Sovereignty %, Somatic %, Resonant % for every word |
| **Archetypal Radar** | Multi-dataset radar — one polygon per word |
| **Cluster Balkendiagramm** | Horizontal bar chart — Word Sum per word; bar height adapts to word count (38 px/word) |

#### Cluster Scatter (in output section)

| Element | Description |
|---|---|
| **Center of Gravity** | Average Σ and average σ across all valid cluster words |
| **Word metrics table** | Per-word Σ, σ, Tier, Quersumme + Archetype |
| **Cluster Scatter** | X = Σ, Y = σ; dashed threshold lines at σ=2.0 and σ=5.0 |

---

### Spectral Analysis Engine

Always-visible section at the bottom. Driven entirely by the signal input.

**Live oscilloscopes (every keystroke)**

| Chart | Description |
|---|---|
| **A — Global Envelope** | 100-bucket mean value per bucket, smooth bezier — macro rhythmic structure |
| **B — Micro Wavelength** | First 256 raw letter values, zero tension — high-frequency character-level jaggedness |

Both charts carry `[?]` tooltip badges.

**On DECODE (deep analysis)**

| Output | Description |
|---|---|
| **Window Aggregation Metrics** | Avg word σ, dominant Quersumme + Archetype, Sovereignty %, Somatic %, word count |
| **Dominant FFT Harmonics** | Radix-2 Cooley-Tukey FFT on 256-sample Hann-windowed signal; top 5 non-DC power bins — detects artificial rhythmic patterns |
| **Complexity Scatter (Word Sum × σ)** | One point per word; T1=green, T2=orange, T3=red |

The **Dominant FFT Harmonics** section title carries a `[?]` tooltip badge.

---

### Contextual Tooltips

Small `[?]` badge buttons appear next to the labels of all key metrics and charts. Hovering reveals a single-floating dark popup (`position: fixed`, edge-clamped) with a 1–2 sentence plain-language explanation. No CSS duplication — one global `#tip-popup` element is repositioned via `getBoundingClientRect()` on each trigger.

Tooltips are attached to:

| Location | Element type |
|---|---|
| Quersumme tile | Dynamic (injected by `diagnosticPanel.js`) |
| Word Sum tile | Dynamic |
| σ Sigma tile | Dynamic |
| Archetypal Radar chart title | Static HTML |
| Complexity Scatter chart title | Static HTML |
| Wavelength Telemetry panel title | Static HTML |
| Global Envelope oscilloscope label | Static HTML |
| Micro Wavelength oscilloscope label | Static HTML |
| Dominant FFT Harmonics section title | Static HTML |

---

### Analyst Guide (Slide-Out Drawer)

An **ANALYST GUIDE** button in the top-right of the header opens a full-width slide-in panel from the right edge (`transform: translateX(100%)` → `translateX(0)`, 280 ms cubic-bezier transition). The main dashboard remains visible to the left.

The drawer contains five sections matching the Analyst's Guide:

1. **The Core Metrics** — Word Sum, σ Sigma thresholds, Quersumme with all nine archetypes listed
2. **The Archetypal Radar** — colour-coded explanation of all five radar axes
3. **The Complexity Scatter Plot** — X/Y axis definitions and how to read clustering
4. **The Oscilloscope** — Wavelength Telemetry, Micro Wavelength, Global Envelope with wave-shape interpretation guide
5. **Spectral Analysis / FFT** — explanation of artificial rhythm detection

Close via the `×` button, clicking the backdrop, or pressing `Escape`.

---

### Linguistic Architecture Legend

A persistent floating overlay (bottom-right, `position: fixed`) styled with a sandy papyrus theme (`#D4B886` background, dark `#1a0f00` text) to visually differentiate it from the dark analytical dashboard. Compact by default; minimize/maximize toggle collapses it to just the header bar.

Three tabs:

| Tab | Content |
|---|---|
| **Geometrical Shape** | 26 letter entries (A–Z) with their psychological/geometric archetype descriptions |
| **Count of Lines** | Four groups by stroke count (1–4 lines) with their conceptual significance |
| **Proportion & Space** | Six groups by horizontal footprint (Massive → Narrow) |

---

## Single Word — Usage

1. Select a **SIGNAL LANGUAGE** if needed (default: AUTO-DETECT)
2. Type or paste text into **SIGNAL INPUT** — Wavelength Telemetry and Spectral Oscilloscopes update live
3. Press **DECODE** or hit Enter
4. Switch between **Grid**, **Narrative**, and **Word Stream** views
5. Toggle individual **STREAMS** checkboxes to show/hide Facial, Somatic, Egyptian, or Greek layers
6. Read the **INTERCEPTED WAVE EQUATION** below the output
7. Click **EXPORT SIGINT DOSSIER** to print a classified PDF

---

## Cluster Mode — Usage

1. Click **Cluster Mode** in the controls bar
2. Type a comma-separated list: `ring, marriage, couple, children, family`
3. Live waveforms appear per word as you type
4. Click **Analyze Cluster** to decode all words simultaneously
5. The output shows Center of Gravity, word metrics table, Cluster Scatter, and per-word CHARACTER STREAMS
6. Switch view modes to change how per-word character images are laid out
7. Toggle **Disable Images** to collapse the image streams and focus on the analytics panels

---

## Archetypal Letter Map

| Letter | Value | Category | | Letter | Value | Category |
|---|---|---|---|---|---|---|
| A | 1 | Origin | | N | 14 | Liminal |
| Ä | 1.5 | Liminal | | O | 15 | Resonant |
| B | 2 | Kinetic | | Ö | 15.5 | Liminal |
| C | 3 | Resonant | | P | 16 | Kinetic |
| D | 4 | Sovereign | | Q | 17 | Sovereign |
| E | 5 | Kinetic | | R | 18 | Liminal |
| F | 6 | Kinetic | | S | 19 | Kinetic |
| G | 7 | Liminal | | T | 20 | Sovereign |
| H | 8 | Resonant | | U | 21 | Resonant |
| I | 9 | Sovereign | | Ü | 21.5 | Liminal |
| J | 10 | Kinetic | | V | 22 | Kinetic |
| K | 11 | Sovereign | | W | 23 | Sovereign |
| L | 12 | Resonant | | X | 24 | Sovereign |
| M | 13 | Resonant | | Y | 25 | Resonant |
| | | | | Z | 26 | Sovereign |

Non-alphabetic characters (digits, spaces, punctuation) contribute a value of 0 and are excluded from all calculations.

---

## Greek Physics Layer

Each letter (A–Z) and digit (0–9) is mapped to a Greek physics symbol from the Ionian numeral system.

| Input | Greek Symbol | Physics Meaning |
|---|---|---|
| A | α | Angular acceleration / fine-structure constant |
| B | β | Velocity ratio (v/c) / beta decay |
| C | χ | Magnetic susceptibility / chi-squared |
| D | Δ | Change operator / Laplacian |
| E | ε | Permittivity / strain tensor |
| F | φ | Magnetic flux / golden ratio |
| G | γ | Lorentz factor / photon |
| H | η | Efficiency / viscosity |
| I | ι | Unit imaginary vector |
| J | ξ | Correlation length / displacement |
| K | κ | Thermal conductivity / curvature |
| L | λ | Wavelength / decay constant |
| M | μ | Permeability / coefficient of friction |
| N | ν | Frequency / kinematic viscosity |
| O | ω | Angular velocity |
| P | π | Pi / momentum |
| Q | θ | Angle / temperature |
| R | ρ | Density / resistivity |
| S | σ | Stefan-Boltzmann / standard deviation |
| T | τ | Torque / proper time |
| U | υ | Speed in optics |
| V | ψ | Wavefunction |
| W | Ω | Ohms / solid angle |
| X | ξ | Displacement field |
| Y | Υ | Upsilon / mass-energy coupling |
| Z | ζ | Impedance / Riemann zeta |
| 0 | ∅ | Empty set — null state |
| 1–9 | α' – θ' | Ionian numerals (prime-stroked Greek letters); ϛ' for 6 |

---

## Quersumme Archetypes

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

> **Japanese mode** requires an internet connection on first use to download the Kuromoji dictionary (~8 MB) from jsDelivr CDN. It is cached by the browser after the first load. All other localization modes (Cyrillic, Arabic/Farsi, Korean) are built-in with no network requirement.

---

## File Structure

```
kinesic-cryptography/
│
├── index.html                   # App shell — all sections, canvas elements, drawers
│
├── css/
│   ├── style.css                # Global tokens, reset, typography, layout, header
│   ├── components.css           # Cards, timeline, cluster output, category colours,
│   │                            #   Egyptian/Greek stream styles, stream visibility
│   │                            #   body-class toggles, wave equation box, export button
│   ├── diagnostic.css           # Diagnostic panel, waveform, spectral engine,
│   │                            #   cluster metric rows, Balkendiagramm
│   ├── legend.css               # Floating Linguistic Architecture Legend (papyrus theme)
│   ├── guide.css                # Tooltip system (#tip-popup, .tip-btn) and
│   │                            #   Analyst Guide slide-out drawer
│   └── print.css                # SIGINT dossier @media print layout —
│                                #   classification banner, B&W card grid, UI chrome hidden
│
├── js/
│   ├── main.js                  # Entry point — event wiring, view switching,
│   │                            #   4-stream render, wave equation, dossier export,
│   │                            #   cluster parse/decode/render, spectral integration,
│   │                            #   language selection, stream checkbox toggles
│   │
│   │   ── Localization ─────────────────────────────────────
│   ├── pipeline.js              # Global Localization Bridge (7 modes):
│   │                            #   detectLanguage (Unicode heuristic for 6 scripts),
│   │                            #   _cyrillicToLatin, _arabicToLatin (NFKC + map),
│   │                            #   _hangulToRomaja (Unicode decomposition formula),
│   │                            #   initKuroshiro (lazy Kuromoji load),
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
│   │   ── UI Overlays ──────────────────────────────────────
│   ├── legend.js                # Linguistic Architecture Legend —
│   │                            #   tab switching, minimize/maximize toggle
│   ├── helpDrawer.js            # Analyst Guide drawer (open/close/Escape/overlay-click)
│   │                            #   + global tooltip system (event-delegated,
│   │                            #   getBoundingClientRect edge-clamping)
│   │
│   │   ── Decoder ──────────────────────────────────────────
│   ├── diagnosticPanel.js       # Diagnostic Engine UI — single/cluster renders;
│   │                            #   injects [?] tooltip badges on metric tiles
│   ├── decoder.js               # Input → DecodedCharacter array
│   └── dictionary.js            # Somatic data ledger — face, body, egyptian, greek
│                                #   fields per character; Ionian numeral digits 0–9
│
├── screenshots/
│   ├── decode-view.png
│   ├── cluster-mode.png
│   ├── diagnostic-engine.png
│   └── spectral-engine.png
│
└── assets/
    ├── a-face.png               # Facial articulation image for "a"
    ├── a-body.png               # Somatic posture image for "a"
    └── ...                      # One face + one body image per supported character
```

---

## Dictionary Structure

Each entry in `js/dictionary.js` follows this structure:

```js
export const SOMATIC_DICTIONARY = {
  'a': {
    category:        'Physical',   // 'Physical' | 'Emotional' | 'Intellectual'
    face:            'Description of the facial articulation for this character.',
    body:            'Description of the somatic posture for this character.',
    value:           1,            // numeric letter value (null for digits)
    archetypeCategory: 'Origin',   // archetypal category (null for digits)
    egyptian: {
      unicode:      '𓀀',          // Unicode hieroglyph character
      description:  'Egyptian etymology description.',
    },
    greek: {
      unicode:      'α',           // Greek physics symbol (Ionian numeral for digits)
      description:  'Physics variable description.',
    },
  },
  // Digits use double-quoted strings for Ionian numerals with apostrophe strokes:
  '6': {
    egyptian: { unicode: '𓏿', description: 'Six Strokes. Grounding.' },
    greek:    { unicode: "ϛ'", description: 'Stigma: 6 degrees of kinematic freedom.' },
  },
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

The decoder handles all **alphanumeric** input: `a–z`, `0–9`, and German umlauts `ä ö ü`. Spaces, punctuation, and special characters are silently discarded. Input is automatically converted to lowercase before lookup.

All non-Latin scripts are first transliterated to Latin by the **Global Localization Bridge** before character lookup: Japanese → Romaji, Chinese → Pinyin, Cyrillic → Latinized, Arabic/Farsi → Latinized, Korean → Romaja.

---

## Technology

- **Vanilla HTML / CSS / JavaScript** — no frameworks, no build tools, no backend
- **ES6 Modules** — fully modular with `import`/`export`
- **[Chart.js v4](https://www.chartjs.org/)** — UMD global via CDN; radar, scatter, line, bar, and waveform charts
- **[Kuroshiro v1](https://github.com/hexenq/kuroshiro) + [kuroshiro-analyzer-kuromoji](https://github.com/hexenq/kuroshiro-analyzer-kuromoji)** — UMD globals via jsDelivr; Japanese → Romaji with Kuromoji dictionary
- **[pinyin-pro v3](https://github.com/zh-lx/pinyin-pro)** — ES module via esm.sh; Chinese → tone-stripped Pinyin
- **Pure-JS FFT** — Radix-2 Cooley-Tukey in `physics.js`; no Web Audio API required
- **Built-in Cyrillic / Arabic / Korean transliteration** — zero CDN dependencies; Cyrillic via 66-entry character map; Arabic/Farsi via NFKC normalization + consonant map; Korean via Unicode Hangul block decomposition formula
- **14-colour shared palette** — `palette.js` exports `CLUSTER_COLORS`; imported by `waveform.js`, `charts.js`, and `diagnosticPanel.js` for consistent per-word colours across all panels
- **CSS body-class stream toggling** — `body.hide-face` / `body.hide-body` / `body.hide-egyptian` / `body.hide-greek` applied instantly on checkbox change; no DOM re-render
- **CSS Custom Properties** — centralised design tokens for all colours, spacing, and typography
- **`window.print()` + `@media print`** — SIGINT dossier export with classification banner and B&W card grid; no third-party PDF library
- [Space Mono](https://fonts.google.com/specimen/Space+Mono) + [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts
