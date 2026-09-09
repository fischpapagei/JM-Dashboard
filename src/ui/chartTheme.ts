/** Gemeinsame Chart-Farben für das Kennzahlensystem (Justiz-Kontrast). */

export const CHART_TICK = '#0F2744';
export const CHART_MUTED = '#1F3B55';
export const CHART_GRID = '#8AA0B3';
export const CHART_LINE = '#003064';
export const CHART_BAR = '#175E54';
export const CHART_TREND = '#C40016';

export type ChartDensity = 'compact' | 'default' | 'modal';

export function chartDensity(height: number, pdfExportMode = false): ChartDensity {
  if (pdfExportMode) return 'default';
  if (height >= 450) return 'modal';
  if (height <= 250) return 'compact';
  return 'default';
}

export const CHART_FONT = {
  compact: { tick: 8, axis: 9, value: 8, valueOffset: 10, yWidth: 48 },
  default: { tick: 11, axis: 12, value: 11, valueOffset: 12, yWidth: 56 },
  modal: { tick: 16, axis: 18, value: 16, valueOffset: 18, yWidth: 84 },
} as const;

/** Unterscheidbare Serien mit Kontrast auf weißem Grund (kein Pastell). */
export const CHART_SERIES = [
  '#003064',
  '#175E54',
  '#007A2E',
  '#C40016',
  '#0E7490',
  '#6D28D9',
  '#B45309',
  '#9F1239',
] as const;
