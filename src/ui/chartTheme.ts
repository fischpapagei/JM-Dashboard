/** NRW-Landesdesign 09/2025: Charts in Nachtblau 15–50 %, Grün nur als Zusatzserie. */

export const NRW = {
  nachtblau: '#003064',
  nachtblau15: '#D9E0E8',
  nachtblau30: '#B3C1D1',
  nachtblau50: '#8098B2',
  schwarz: '#000000',
  schwarz50: '#808080',
  weiss: '#FFFFFF',
  grasgruen: '#175E54',
  petrolgruen: '#009B74',
  farngruen: '#76B828',
  gruen: '#009036',
  rot: '#E2001A',
} as const;

export const CHART_TICK = NRW.nachtblau;
export const CHART_MUTED = '#4D5F70';
export const CHART_GRID = NRW.nachtblau30;
export const CHART_LINE = NRW.nachtblau;
export const CHART_BAR = NRW.nachtblau;
export const CHART_TREND = NRW.rot;

export const CHART_GENDER = {
  weiblich: NRW.nachtblau,
  maennlich: NRW.nachtblau50,
  summe: NRW.schwarz50,
} as const;

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
  modal: { tick: 13, axis: 16, value: 15, valueOffset: 18, yWidth: 84 },
} as const;

/** Unterscheidbare Serien: zuerst Nachtblau-Töne, dann Gras-/Petrol-/Farngrün. */
export const CHART_SERIES = [
  NRW.nachtblau,
  NRW.nachtblau50,
  NRW.grasgruen,
  NRW.petrolgruen,
  NRW.farngruen,
  NRW.schwarz,
  NRW.nachtblau30,
  NRW.schwarz50,
] as const;
