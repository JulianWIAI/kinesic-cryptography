# Somatic Cipher Decoder

A research tool that translates alphanumeric text into a visual dashboard of **facial articulation** and **somatic posture** data. Each character in a word maps to a pair of images and descriptions drawn from a structured data ledger, revealing the embodied "signature" of language.

---

## Screenshots

### Decode View
![Decode View](https://raw.githubusercontent.com/JulianWIAI/kinesic-cryptography/main/screenshots/decode-view.png)

### Comparison Mode
![Comparison Mode](https://raw.githubusercontent.com/JulianWIAI/kinesic-cryptography/main/screenshots/comparison-mode.png)

---

## Features

| Feature | Description |
|---|---|
| **Grid View** | Each decoded character renders as a detailed analysis card with two columns: Facial Articulation and Somatic Posture |
| **Narrative View** | A horizontal scrollable timeline showing all characters in sequence with face and body images side by side |
| **Word Stream View** | Two parallel horizontal strips — one for all face images, one for all body images — enabling full-word pattern reading |
| **Comparison Mode** | Two separate input fields decode simultaneously, rendering both words as parallel somatic streams for direct comparison |
| **Contextual Synthesis** | A fixed panel at the bottom of the screen concatenates all face and body descriptions into a single readable narrative |
| **Category Theming** | Each character is tagged `Physical`, `Emotional`, or `Intellectual`, applying a distinct background colour to every card |

---

## How to Run

This project uses **ES6 Modules** (`type="module"`), which require an HTTP server — opening `index.html` directly via `file://` will not work.

**Recommended: VS Code Live Server**

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code
2. Right-click `index.html` in the Explorer panel
3. Select **Open with Live Server**
4. The app opens at `http://127.0.0.1:5500`

---

## File Structure

```
kinesic_cryptography/
│
├── index.html               # App shell and layout
│
├── css/
│   ├── style.css            # Global variables, reset, typography, layout
│   └── components.css       # Cards, timeline, comparison engine, category colours
│
├── js/
│   ├── main.js              # Entry point — event listeners, rendering, view logic
│   ├── decoder.js           # Processes input string, returns decoded character objects
│   └── dictionary.js        # Data ledger — all character entries
│
└── assets/
    ├── a-face.png           # Facial articulation image for character "a"
    ├── a-body.png           # Somatic posture image for character "a"
    └── ...                  # One face + one body image per alphanumeric character
```

---

## Asset Naming Convention

Images must follow this exact naming pattern for the decoder to locate them:

```
assets/[character]-face.png
assets/[character]-body.png
```

**Examples:** `assets/a-face.png`, `assets/3-body.png`, `assets/z-face.png`

All characters are normalised to **lowercase** before the path is constructed.

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

| Category | Background | Use |
|---|---|---|
| `Physical` | Dark blue | Characters primarily engaging physical articulation |
| `Emotional` | Dark amber | Characters with emotional or relational somatic quality |
| `Intellectual` | Steel grey-blue | Characters associated with cognitive or focused expression |

---

## Supported Characters

The decoder handles all **alphanumeric** input: `a–z` and `0–9` (36 characters total). Spaces, punctuation, and special characters are silently discarded. Input is automatically converted to lowercase before lookup.

---

## Technology

- **Vanilla HTML, CSS, JavaScript** — no frameworks or build tools
- **ES6 Modules** — modular architecture with `import`/`export`
- **CSS Custom Properties** — centralised design tokens for colours, spacing, and typography
- [Space Mono](https://fonts.google.com/specimen/Space+Mono) + [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts
