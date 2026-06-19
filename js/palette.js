/**
 * Shared colour palette — 14 perceptually distinct colours for multi-series charts.
 * Covers WAVELENGTH TELEMETRY, SPECTRAL oscilloscopes, DIAGNOSTIC ENGINE.
 *
 * Each entry:
 *   line      — solid line / border colour
 *   fill      — flat background fill (used in scatter, bar, radar)
 *   gradStart — gradient top stop  (used in line/area charts)
 *   gradEnd   — gradient bottom stop (transparent)
 *
 * Cycle with (index % CLUSTER_COLORS.length) for unlimited word counts.
 */
export const CLUSTER_COLORS = [
  { line: '#00c8ff', fill: 'rgba(  0, 200, 255, 0.20)', gradStart: 'rgba(  0, 200, 255, 0.26)', gradEnd: 'rgba(  0, 200, 255, 0)' }, //  0 cyan
  { line: '#a78bfa', fill: 'rgba(167, 139, 250, 0.20)', gradStart: 'rgba(167, 139, 250, 0.22)', gradEnd: 'rgba(167, 139, 250, 0)' }, //  1 violet
  { line: '#34d39f', fill: 'rgba( 52, 211, 159, 0.20)', gradStart: 'rgba( 52, 211, 159, 0.24)', gradEnd: 'rgba( 52, 211, 159, 0)' }, //  2 emerald
  { line: '#f59e0b', fill: 'rgba(245, 158,  11, 0.20)', gradStart: 'rgba(245, 158,  11, 0.24)', gradEnd: 'rgba(245, 158,  11, 0)' }, //  3 amber
  { line: '#f472b6', fill: 'rgba(244, 114, 182, 0.20)', gradStart: 'rgba(244, 114, 182, 0.22)', gradEnd: 'rgba(244, 114, 182, 0)' }, //  4 pink
  { line: '#4ade80', fill: 'rgba( 74, 222, 128, 0.20)', gradStart: 'rgba( 74, 222, 128, 0.22)', gradEnd: 'rgba( 74, 222, 128, 0)' }, //  5 green
  { line: '#fb923c', fill: 'rgba(251, 146,  60, 0.20)', gradStart: 'rgba(251, 146,  60, 0.24)', gradEnd: 'rgba(251, 146,  60, 0)' }, //  6 orange
  { line: '#38bdf8', fill: 'rgba( 56, 189, 248, 0.20)', gradStart: 'rgba( 56, 189, 248, 0.22)', gradEnd: 'rgba( 56, 189, 248, 0)' }, //  7 sky
  { line: '#e879f9', fill: 'rgba(232, 121, 249, 0.20)', gradStart: 'rgba(232, 121, 249, 0.20)', gradEnd: 'rgba(232, 121, 249, 0)' }, //  8 fuchsia
  { line: '#facc15', fill: 'rgba(250, 204,  21, 0.20)', gradStart: 'rgba(250, 204,  21, 0.22)', gradEnd: 'rgba(250, 204,  21, 0)' }, //  9 yellow
  { line: '#f87171', fill: 'rgba(248, 113, 113, 0.20)', gradStart: 'rgba(248, 113, 113, 0.22)', gradEnd: 'rgba(248, 113, 113, 0)' }, // 10 red
  { line: '#2dd4bf', fill: 'rgba( 45, 212, 191, 0.20)', gradStart: 'rgba( 45, 212, 191, 0.22)', gradEnd: 'rgba( 45, 212, 191, 0)' }, // 11 teal
  { line: '#818cf8', fill: 'rgba(129, 140, 248, 0.20)', gradStart: 'rgba(129, 140, 248, 0.20)', gradEnd: 'rgba(129, 140, 248, 0)' }, // 12 indigo
  { line: '#86efac', fill: 'rgba(134, 239, 172, 0.20)', gradStart: 'rgba(134, 239, 172, 0.20)', gradEnd: 'rgba(134, 239, 172, 0)' }, // 13 light green
];
