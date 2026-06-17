import type { TimeGranularity } from '../types/domain';
import { formatReportingPeriodDisplay } from './periods';

const DE_NUMBER = new Intl.NumberFormat('de-DE');
const DE_PERCENT = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export const EMPTY_VALUE_LABEL = '—';

export function formatNumber(value?: number | null, fallback = EMPTY_VALUE_LABEL): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return DE_NUMBER.format(value);
}

export function formatPercent(value?: number | null, fallback = EMPTY_VALUE_LABEL): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return `${DE_PERCENT.format(value)} %`;
}

export function formatRatio(
  numerator?: number | null,
  denominator?: number | null,
  fallback = EMPTY_VALUE_LABEL,
): string {
  if (
    numerator === null ||
    numerator === undefined ||
    denominator === null ||
    denominator === undefined
  ) {
    return fallback;
  }
  return `${formatNumber(numerator)} / ${formatNumber(denominator)}`;
}

export function formatValue(value?: number | null, suffix = '', fallback = EMPTY_VALUE_LABEL): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${DE_NUMBER.format(value)}${suffix}`;
}

export function formatAverageNumber(value?: number | null, fallback = EMPTY_VALUE_LABEL): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `Ø ${DE_NUMBER.format(value)}`;
}

const TIME_GRANULARITY_LABELS: Record<TimeGranularity, string> = {
  month: 'Monat',
  quarter: 'Quartal',
  year: 'Jahr',
};

export function formatTimeGranularityLabel(
  value: TimeGranularity | null,
  fallback = 'Nicht ausgewählt',
): string {
  if (!value) return fallback;
  return TIME_GRANULARITY_LABELS[value];
}

export function formatReportingPeriodLabel(
  value: string | null,
  fallback = 'Nicht ausgewählt',
): string {
  return formatReportingPeriodDisplay(value, fallback);
}

const DE_DATE = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDate(value?: string | null, fallback = EMPTY_VALUE_LABEL): string {
  if (!value) return fallback;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return DE_DATE.format(parsed);
}

export function formatKursleitung(value?: 'intern' | 'extern' | null, fallback = EMPTY_VALUE_LABEL): string {
  if (value === 'intern') return 'Intern';
  if (value === 'extern') return 'Extern';
  return fallback;
}

export function formatMassnahmenbeginn(
  value?: { type: 'fortlaufend' } | { type: 'stichtag'; dates: string[] } | null,
  fallback = EMPTY_VALUE_LABEL,
): string {
  if (!value) return fallback;
  if (value.type === 'fortlaufend') return 'Fortlaufend';
  const dates = value.dates.map((d) => formatDate(d)).filter((d) => d !== EMPTY_VALUE_LABEL);
  if (dates.length === 0) return fallback;
  return dates.join(', ');
}
