#!/usr/bin/env python3
"""
convert_nrc.py
──────────────────────────────────────────────────────────────────────────────
NRC Raw-Data → Frontend JSON Converter
Psycholinguistic Cluster Analyzer — Data Pipeline

Converts raw NRC TSV dumps (8-D Emotion Intensity and VAD) into the compact
JSON format consumed by the client-side analysis engine.

SUPPORTED INPUT FORMATS
─────────────────────────────────────────────────────────────────────────────
8-D mode  (one row per word-emotion pair):
  <English_Word>  <Emotion>  <Score>  <Translated_Word>
  e.g.  abandon  anger  0.208  verlaat

VAD mode  (one row per word, three scores):
  <English_Word>  <Valence>  <Arousal>  <Dominance>  <Translated_Word>
  e.g.  abandon  0.208  0.479  0.394  verlaat

Columns are zero-indexed and configurable via CLI flags so the script can
adapt to minor format variations across NRC releases without code changes.

OUTPUT FORMAT
─────────────────────────────────────────────────────────────────────────────
8-D:  { "word": { "anger": 0.0, "fear": 0.0, ..., "sadness": 0.0 } }
VAD:  { "word": { "v": 0.0, "a": 0.0, "d": 0.0 } }

All emotion keys are always present (missing scores default to 0.0).
Output files are minified (no unnecessary whitespace).

USAGE EXAMPLES
─────────────────────────────────────────────────────────────────────────────
# Parse an 8-D file (translated word is in the last column, col 3):
python convert_nrc.py 8d raw/NRC-AffectIntensity-Lexicon-afrikaans.txt \\
    --out lexicons/nrc_8d_afrikaans.json

# Parse a VAD file (translated word is in col 4):
python convert_nrc.py vad raw/NRC-VAD-Lexicon-afrikaans.txt \\
    --out lexicons/nrc_vad_afrikaans.json

# Override column layout (e.g. translated word is in col 0, English in col 3):
python convert_nrc.py 8d raw/some_other_format.txt \\
    --word-col 0 --emotion-col 1 --score-col 2 \\
    --out lexicons/nrc_8d_custom.json

# Process a file with no header row:
python convert_nrc.py 8d raw/no_header.txt --no-header \\
    --out lexicons/nrc_8d_noheader.json

# Batch-convert every raw/*.txt file that follows the naming convention:
python convert_nrc.py batch --raw-dir raw --out-dir lexicons
──────────────────────────────────────────────────────────────────────────────
"""

import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

# ─── Canonical 8 NRC emotion dimensions ──────────────────────────────────────
EMOTION_KEYS: list[str] = [
    'anger',
    'fear',
    'anticipation',
    'disgust',
    'surprise',
    'trust',
    'joy',
    'sadness',
]

# ─── Aliases the NRC files sometimes use for emotion names ────────────────────
# Maps any variant spelling → canonical key used in our frontend.
EMOTION_ALIASES: dict[str, str] = {
    'angeremotion':        'anger',
    'fearemotion':         'fear',
    'anticipationemotion': 'anticipation',
    'disgustemotion':      'disgust',
    'surpriseemotion':     'surprise',
    'trustemotion':        'trust',
    'joyemotion':          'joy',
    'sadnessemotion':      'sadness',
    # intensity variants
    'anger-intensity':     'anger',
    'fear-intensity':      'fear',
    'anticipation-intensity': 'anticipation',
    'disgust-intensity':   'disgust',
    'surprise-intensity':  'surprise',
    'trust-intensity':     'trust',
    'joy-intensity':       'joy',
    'sadness-intensity':   'sadness',
}


# ══════════════════════════════════════════════════════════════════════════════
# TASK 1 — Parse 8-D Emotion Intensity data
# ══════════════════════════════════════════════════════════════════════════════

def parse_8d(
    filepath: str | Path,
    *,
    word_col:    int  = 3,   # column index of the target-language word
    emotion_col: int  = 1,   # column index of the emotion name
    score_col:   int  = 2,   # column index of the intensity score (float)
    skip_header: bool = True, # True if the first data row is a header
    delimiter:   str  = '\t',
) -> dict[str, dict[str, float]]:
    """
    Parse a raw NRC 8-D Affect Intensity TSV into a word → emotion-vector dict.

    Default column layout (matches NRC-EIL multilingual releases):
      col 0: English source word
      col 1: emotion name
      col 2: intensity score  (0.0–1.0 float)
      col 3: translated word  ← this becomes the JSON key

    If the target language IS English (no translated column), point
    --word-col at the English column (0) instead.

    Missing emotion dimensions are filled with 0.0 so every entry always
    contains the complete 8-key profile expected by the frontend engine.

    Parameters
    ----------
    filepath    : path to the raw TSV file
    word_col    : column index of the word that becomes the JSON key
    emotion_col : column index of the emotion label string
    score_col   : column index of the numeric intensity score
    skip_header : skip the first non-blank, non-comment line if True
    delimiter   : field separator character (default tab)

    Returns
    -------
    dict  { word: { anger, fear, anticipation, disgust,
                    surprise, trust, joy, sadness } }
    """
    filepath = Path(filepath)

    # Every word starts with a full-zero profile so missing emotions are 0.0
    # by construction — no post-processing step is needed.
    lexicon: dict[str, dict[str, float]] = defaultdict(
        lambda: {key: 0.0 for key in EMOTION_KEYS}
    )

    skipped_emotion = 0   # rows whose emotion label is not in EMOTION_KEYS
    skipped_format  = 0   # rows that could not be parsed at all
    processed       = 0

    with open(filepath, encoding='utf-8', newline='') as fh:
        reader = csv.reader(fh, delimiter=delimiter)

        # Optionally skip the header row
        if skip_header:
            _advance_past_header(reader)

        for lineno, row in enumerate(reader, start=1):
            # ── Skip blank lines and comment lines ────────────────────────────
            if not row or row[0].startswith('#'):
                continue

            # ── Extract and validate the three required columns ───────────────
            try:
                word    = row[word_col].strip().lower()
                emotion = row[emotion_col].strip().lower()
                score   = float(row[score_col].strip())
            except (IndexError, ValueError) as exc:
                skipped_format += 1
                _warn(f"line {lineno}: skipping malformed row — {exc}  ({row!r})")
                continue

            if not word:
                continue  # blank word cell — ignore silently

            # ── Resolve emotion name (handle aliases) ─────────────────────────
            canonical = EMOTION_ALIASES.get(emotion, emotion)
            if canonical not in EMOTION_KEYS:
                skipped_emotion += 1
                continue   # non-standard label — skip without warning (common)

            # ── Clamp score to [0.0, 1.0] as a safety measure ─────────────────
            score = max(0.0, min(1.0, score))

            # ── Write into the defaultdict profile ────────────────────────────
            lexicon[word][canonical] = round(score, 6)
            processed += 1

    # Convert defaultdict → plain dict for clean serialisation
    result = dict(lexicon)

    _report_8d(filepath, processed, result, skipped_format, skipped_emotion)
    return result


# ══════════════════════════════════════════════════════════════════════════════
# TASK 2 — Parse VAD (Valence / Arousal / Dominance) data
# ══════════════════════════════════════════════════════════════════════════════

def parse_vad(
    filepath: str | Path,
    *,
    word_col:    int  = 4,   # column index of the target-language word
    v_col:       int  = 1,   # column index of the Valence score
    a_col:       int  = 2,   # column index of the Arousal score
    d_col:       int  = 3,   # column index of the Dominance score
    skip_header: bool = True,
    delimiter:   str  = '\t',
) -> dict[str, dict[str, float]]:
    """
    Parse a raw NRC VAD Lexicon TSV into a word → {v, a, d} dict.

    Default column layout (matches NRC-VAD multilingual releases):
      col 0: English source word
      col 1: Valence      (0.0–1.0)
      col 2: Arousal      (0.0–1.0)
      col 3: Dominance    (0.0–1.0)
      col 4: translated word  ← becomes the JSON key

    If the target language IS English, set --word-col 0.

    Parameters
    ----------
    filepath    : path to the raw TSV file
    word_col    : column index of the word that becomes the JSON key
    v_col       : column index of Valence
    a_col       : column index of Arousal
    d_col       : column index of Dominance
    skip_header : skip the first non-blank, non-comment line if True
    delimiter   : field separator character (default tab)

    Returns
    -------
    dict  { word: { "v": float, "a": float, "d": float } }
    """
    filepath = Path(filepath)
    lexicon: dict[str, dict[str, float]] = {}

    skipped_format = 0
    processed      = 0

    with open(filepath, encoding='utf-8', newline='') as fh:
        reader = csv.reader(fh, delimiter=delimiter)

        if skip_header:
            _advance_past_header(reader)

        for lineno, row in enumerate(reader, start=1):
            if not row or row[0].startswith('#'):
                continue

            try:
                word = row[word_col].strip().lower()
                v    = float(row[v_col].strip())
                a    = float(row[a_col].strip())
                d    = float(row[d_col].strip())
            except (IndexError, ValueError) as exc:
                skipped_format += 1
                _warn(f"line {lineno}: skipping malformed row — {exc}  ({row!r})")
                continue

            if not word:
                continue

            # Clamp all three scores to [0.0, 1.0]
            lexicon[word] = {
                'v': round(max(0.0, min(1.0, v)), 6),
                'a': round(max(0.0, min(1.0, a)), 6),
                'd': round(max(0.0, min(1.0, d)), 6),
            }
            processed += 1

    _report_vad(filepath, processed, lexicon, skipped_format)
    return lexicon


# ══════════════════════════════════════════════════════════════════════════════
# TASK 3 — Export JSON
# ══════════════════════════════════════════════════════════════════════════════

def export_json(data: dict, output_path: str | Path) -> Path:
    """
    Write a parsed lexicon dictionary to a compact, minified JSON file.

    The file is UTF-8 encoded and does not use ASCII escaping, so non-Latin
    scripts (Arabic, Russian, Chinese, Farsi, etc.) are stored as literal
    Unicode characters rather than \\uXXXX sequences.  This keeps file sizes
    down and makes manual inspection of the output straightforward.

    If the parent directory does not exist it is created automatically.

    Parameters
    ----------
    data        : dict returned by parse_8d() or parse_vad()
    output_path : destination file path (e.g. 'lexicons/nrc_8d_afrikaans.json')

    Returns
    -------
    Path — the resolved output path
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as fh:
        json.dump(
            data,
            fh,
            ensure_ascii=False,   # keep non-Latin scripts as literal chars
            separators=(',', ':'), # minify: no spaces after , or :
            sort_keys=True,        # deterministic key order for diff-ability
        )

    size_kb = output_path.stat().st_size / 1024
    print(f"  ✓  {output_path}  ({len(data):,} words, {size_kb:.1f} KB)")
    return output_path


# ══════════════════════════════════════════════════════════════════════════════
# BATCH mode — discover files by naming convention
# ══════════════════════════════════════════════════════════════════════════════

def run_batch(raw_dir: Path, out_dir: Path) -> None:
    """
    Scan raw_dir for files matching the expected naming convention and
    convert each one automatically.

    Expected filename patterns:
      8-D files : *NRC*Affect*{lang}*.txt  or  *nrc_8d_{lang}*.txt
      VAD files : *NRC*VAD*{lang}*.txt     or  *nrc_vad_{lang}*.txt

    The language token is extracted from the filename and used to build the
    output filename:  nrc_8d_{lang}.json / nrc_vad_{lang}.json
    """
    txt_files = sorted(raw_dir.glob('*.txt'))
    if not txt_files:
        _die(f"No .txt files found in {raw_dir}")

    converted = 0
    for path in txt_files:
        name_lower = path.name.lower()

        # ── Detect 8-D vs VAD ─────────────────────────────────────────────
        if 'affect' in name_lower or '8d' in name_lower or 'emotion' in name_lower:
            mode = '8d'
        elif 'vad' in name_lower:
            mode = 'vad'
        else:
            print(f"  ?  {path.name} — cannot determine mode from filename; skipping")
            continue

        # ── Derive a clean language tag from the filename ─────────────────
        # Strip common prefix/suffix tokens to isolate the language name.
        lang_tag = (
            path.stem
            .lower()
            .replace('nrc-affectintensity-lexicon-', '')
            .replace('nrc-vad-lexicon-', '')
            .replace('nrc_affect_', '')
            .replace('nrc_8d_', '')
            .replace('nrc_vad_', '')
            .replace('nrc-', '')
            .replace('-lexicon', '')
            .replace('_lexicon', '')
            .replace(' ', '_')
        ) or 'unknown'

        out_name = f"nrc_{mode}_{lang_tag}.json"
        out_path = out_dir / out_name

        print(f"\n[batch] {path.name}  →  {out_path}")
        try:
            if mode == '8d':
                data = parse_8d(path)
            else:
                data = parse_vad(path)
            export_json(data, out_path)
            converted += 1
        except Exception as exc:          # noqa: BLE001
            _warn(f"Failed to convert {path.name}: {exc}")

    print(f"\n[batch] Done — {converted}/{len(txt_files)} files converted.")


# ══════════════════════════════════════════════════════════════════════════════
# Internal helpers
# ══════════════════════════════════════════════════════════════════════════════

def _advance_past_header(reader: csv.reader) -> None:
    """
    Skip the first non-blank, non-comment line so that column detection
    works correctly regardless of whether the header uses hashes or plain text.
    """
    for row in reader:
        if row and not row[0].startswith('#'):
            return  # consumed the header; subsequent reads start at data row 1


def _warn(msg: str) -> None:
    print(f"  [WARN] {msg}", file=sys.stderr)


def _die(msg: str) -> None:
    print(f"\n[ERROR] {msg}", file=sys.stderr)
    sys.exit(1)


def _report_8d(
    path: Path,
    processed: int,
    result: dict,
    skipped_format: int,
    skipped_emotion: int,
) -> None:
    """Print a compact parse summary for an 8-D file."""
    n_words = len(result)
    # Count words that have at least one non-zero emotion score
    n_partial = sum(
        1 for v in result.values()
        if any(score > 0.0 for score in v.values())
    )
    print(
        f"  Parsed {processed:>7,} data rows  →  {n_words:,} unique words "
        f"({n_partial:,} with ≥1 score)  |  "
        f"skipped: {skipped_format} malformed, {skipped_emotion} unknown emotions"
    )


def _report_vad(
    path: Path,
    processed: int,
    result: dict,
    skipped_format: int,
) -> None:
    """Print a compact parse summary for a VAD file."""
    print(
        f"  Parsed {processed:>7,} data rows  →  {len(result):,} unique words  |  "
        f"skipped: {skipped_format} malformed"
    )


# ══════════════════════════════════════════════════════════════════════════════
# CLI entry point
# ══════════════════════════════════════════════════════════════════════════════

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog='convert_nrc',
        description='Convert raw NRC TSV dumps to frontend-ready JSON lexicons.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    sub = parser.add_subparsers(dest='command', required=True)

    # ── Shared arguments for 8d / vad subcommands ─────────────────────────
    shared = argparse.ArgumentParser(add_help=False)
    shared.add_argument('input', metavar='INPUT_FILE',
                        help='Path to the raw TSV input file.')
    shared.add_argument('--out', metavar='OUTPUT_FILE', required=True,
                        help='Destination JSON file path (created if absent).')
    shared.add_argument('--no-header', action='store_true',
                        help='Input file has no header row; start reading from line 1.')
    shared.add_argument('--delimiter', default='\t', metavar='CHAR',
                        help='Field separator character. Default: tab (\\t).')

    # ── 8d subcommand ─────────────────────────────────────────────────────
    p8d = sub.add_parser('8d', parents=[shared],
                         help='Parse NRC 8-D Emotion Intensity data.')
    p8d.add_argument('--word-col',    type=int, default=3, metavar='N',
                     help='Column index of the target word. Default: 3.')
    p8d.add_argument('--emotion-col', type=int, default=1, metavar='N',
                     help='Column index of the emotion label. Default: 1.')
    p8d.add_argument('--score-col',   type=int, default=2, metavar='N',
                     help='Column index of the intensity score. Default: 2.')

    # ── vad subcommand ────────────────────────────────────────────────────
    pvad = sub.add_parser('vad', parents=[shared],
                          help='Parse NRC VAD (Valence/Arousal/Dominance) data.')
    pvad.add_argument('--word-col', type=int, default=4, metavar='N',
                      help='Column index of the target word. Default: 4.')
    pvad.add_argument('--v-col',    type=int, default=1, metavar='N',
                      help='Column index of Valence. Default: 1.')
    pvad.add_argument('--a-col',    type=int, default=2, metavar='N',
                      help='Column index of Arousal. Default: 2.')
    pvad.add_argument('--d-col',    type=int, default=3, metavar='N',
                      help='Column index of Dominance. Default: 3.')

    # ── batch subcommand ──────────────────────────────────────────────────
    pbatch = sub.add_parser('batch',
                            help='Auto-convert every .txt file in a directory.')
    pbatch.add_argument('--raw-dir', default='raw', metavar='DIR',
                        help='Directory containing raw .txt files. Default: raw/')
    pbatch.add_argument('--out-dir', default='lexicons', metavar='DIR',
                        help='Output directory for JSON files. Default: lexicons/')

    return parser


def main() -> None:
    parser = _build_parser()
    args   = parser.parse_args()

    if args.command == '8d':
        input_path = Path(args.input)
        if not input_path.exists():
            _die(f"Input file not found: {input_path}")

        print(f"\n[8D] Parsing {input_path} …")
        data = parse_8d(
            input_path,
            word_col    = args.word_col,
            emotion_col = args.emotion_col,
            score_col   = args.score_col,
            skip_header = not args.no_header,
            delimiter   = args.delimiter,
        )
        export_json(data, args.out)

    elif args.command == 'vad':
        input_path = Path(args.input)
        if not input_path.exists():
            _die(f"Input file not found: {input_path}")

        print(f"\n[VAD] Parsing {input_path} …")
        data = parse_vad(
            input_path,
            word_col    = args.word_col,
            v_col       = args.v_col,
            a_col       = args.a_col,
            d_col       = args.d_col,
            skip_header = not args.no_header,
            delimiter   = args.delimiter,
        )
        export_json(data, args.out)

    elif args.command == 'batch':
        raw_dir = Path(args.raw_dir)
        out_dir = Path(args.out_dir)
        if not raw_dir.is_dir():
            _die(f"Raw directory not found: {raw_dir}")
        print(f"\n[batch] Scanning {raw_dir} …")
        run_batch(raw_dir, out_dir)


if __name__ == '__main__':
    main()
