import type { TimeGranularity } from '../types/domain';

export const REPORTING_PERIODS = ['2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1'] as const;
export const LATEST_PERIOD = '2026-Q1';
export const LATEST_COMPLETED_QUARTER = '2026-Q2';
export const DEMO_HISTORY_START_QUARTER = '2015-Q1';

export const REPORTING_YEARS = [2025, 2026] as const;

const MONTH_NAMES = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

export type ReportingPeriodKind = 'quarter' | 'year' | 'month';

export interface ReportingPeriodOption {
  value: string;
  label: string;
}

export function parseReportingPeriodKind(period: string): ReportingPeriodKind | null {
  if (/^\d{4}-Q[1-4]$/.test(period)) return 'quarter';
  if (/^\d{4}-\d{2}$/.test(period)) return 'month';
  if (/^\d{4}$/.test(period)) return 'year';
  return null;
}

export function getYearFromPeriod(period: string): number {
  return parseInt(period.split('-')[0], 10);
}

export function monthToQuarterKey(monthKey: string): string {
  const year = monthKey.slice(0, 4);
  const month = parseInt(monthKey.slice(5, 7), 10);
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
}

export function getQuartersInYear(year: number): string[] {
  return REPORTING_PERIODS.filter((p) => getYearFromPeriod(p) === year);
}

export function resolveToDataPeriods(reportingPeriod: string | null): string[] {
  if (!reportingPeriod) return [LATEST_PERIOD];

  const kind = parseReportingPeriodKind(reportingPeriod);
  if (kind === 'quarter') return [reportingPeriod];
  if (kind === 'year') return getQuartersInYear(parseInt(reportingPeriod, 10));
  if (kind === 'month') {
    const quarter = monthToQuarterKey(reportingPeriod);
    return (REPORTING_PERIODS as readonly string[]).includes(quarter) ? [quarter] : [];
  }

  return [reportingPeriod];
}

export function getEffectiveReportingPeriod(reportingPeriod: string | null): string {
  return reportingPeriod ?? LATEST_PERIOD;
}

export function formatReportingPeriodDisplay(
  value: string | null,
  fallback = 'Nicht ausgewählt',
): string {
  if (!value) return fallback;

  const kind = parseReportingPeriodKind(value);
  if (kind === 'quarter') return value.replace('-', ' ');
  if (kind === 'year') return `Jahr ${value}`;
  if (kind === 'month') {
    const month = parseInt(value.slice(5, 7), 10);
    const year = value.slice(0, 4);
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }

  return value.replace('-', ' ');
}

function buildMonthOptions(year: number): ReportingPeriodOption[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0');
    return {
      value: `${year}-${month}`,
      label: `${MONTH_NAMES[i]} ${year}`,
    };
  });
}

export function getReportingPeriodSelectOptions() {
  return {
    quarters: [
      { value: '2026-Q1', label: '2026 Q1' },
      { value: '2025-Q4', label: '2025 Q4' },
      { value: '2025-Q3', label: '2025 Q3' },
      { value: '2025-Q2', label: '2025 Q2' },
    ] satisfies ReportingPeriodOption[],
    years: REPORTING_YEARS.map((year) => ({
      value: String(year),
      label: String(year),
    })),
    monthsByYear: REPORTING_YEARS.map((year) => ({
      year,
      months: buildMonthOptions(year),
    })),
  };
}

export function isReportingPeriodCompatible(
  period: string | null,
  granularity: TimeGranularity | null,
): boolean {
  if (!granularity) return period == null;
  if (!period) return true;
  return parseReportingPeriodKind(period) === granularity;
}

export function getReportingPeriodOptionsForGranularity(
  granularity: TimeGranularity | null,
): ReportingPeriodOption[] {
  if (!granularity) return [];

  const options = getReportingPeriodSelectOptions();
  if (granularity === 'quarter') return options.quarters;
  if (granularity === 'year') return options.years;
  return options.monthsByYear.flatMap(({ months }) => months);
}

export function getPreviousQuarterPeriod(period: string): string | null {
  const match = period.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return null;
  let year = parseInt(match[1], 10);
  let quarter = parseInt(match[2], 10) - 1;
  if (quarter < 1) {
    quarter = 4;
    year -= 1;
  }
  return `${year}-Q${quarter}`;
}

function getPreviousMonthKey(monthKey: string): string | null {
  const year = parseInt(monthKey.slice(0, 4), 10);
  const month = parseInt(monthKey.slice(5, 7), 10);
  if (month > 1) {
    return `${year}-${String(month - 1).padStart(2, '0')}`;
  }
  return `${year - 1}-12`;
}

function quarterToLastMonth(quarterKey: string): string {
  const year = quarterKey.slice(0, 4);
  const quarter = parseInt(quarterKey.split('-Q')[1], 10);
  return `${year}-${String(quarter * 3).padStart(2, '0')}`;
}

/** Letzter Monat eines Berichtsquartals (z. B. 2026-Q1 → 2026-03). */
export function getLastMonthKeyOfQuarter(quarterKey: string): string {
  return quarterToLastMonth(quarterKey);
}

export function getMonthVariationIndex(monthKey: string): number {
  return (parseInt(monthKey.slice(5, 7), 10) - 1) % 3;
}

export const MONTH_UTILIZATION_FACTORS = [0.96, 1.0, 1.04] as const;

export function getPreviousComparisonPeriodKey(
  reportingPeriod: string | null,
  granularity: TimeGranularity,
): string | null {
  const current = reportingPeriod ?? LATEST_PERIOD;
  const kind = parseReportingPeriodKind(current);

  if (granularity === 'month') {
    if (kind === 'month') return getPreviousMonthKey(current);
    if (kind === 'quarter') {
      const prevQ = getPreviousQuarterPeriod(current);
      return prevQ ? quarterToLastMonth(prevQ) : null;
    }
    if (kind === 'year') return `${parseInt(current, 10) - 1}-12`;
  }

  if (granularity === 'quarter') {
    if (kind === 'quarter') return getPreviousQuarterPeriod(current);
    if (kind === 'month') {
      const q = monthToQuarterKey(current);
      return getPreviousQuarterPeriod(q);
    }
    if (kind === 'year') {
      const quarters = getQuartersInYear(parseInt(current, 10));
      const last = quarters[quarters.length - 1];
      return last ? getPreviousQuarterPeriod(last) : null;
    }
  }

  if (granularity === 'year') {
    if (kind === 'year') return String(parseInt(current, 10) - 1);
    if (kind === 'quarter') return String(getYearFromPeriod(current) - 1);
    if (kind === 'month') return String(getYearFromPeriod(current) - 1);
  }

  return null;
}

export function getPreviousPeriodsForComparison(
  reportingPeriod: string | null,
  granularity: TimeGranularity | null,
): string[] | null {
  if (!granularity) return null;
  const prevKey = getPreviousComparisonPeriodKey(reportingPeriod, granularity);
  if (!prevKey) return null;
  const periods = resolveToDataPeriods(prevKey);
  return periods.length > 0 ? periods : null;
}

export function getPreviousPeriodLabel(granularity: TimeGranularity): string {
  const labels: Record<TimeGranularity, string> = {
    month: 'Vormonat',
    quarter: 'Vorquartal',
    year: 'Vorjahr',
  };
  return labels[granularity];
}

export type TrendGranularity = 'week' | 'month' | 'quarter' | 'year';

const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Monate mit Demo-Daten (Q2/2025 – Q1/2026). */
export const DEMO_TREND_MONTHS = [
  '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09',
  '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03',
] as const;

export function formatMonthShort(monthKey: string): string {
  const month = parseInt(monthKey.slice(5, 7), 10) - 1;
  const year = monthKey.slice(2, 4);
  return `${MONTH_SHORT[month]} ${year}`;
}

export interface TrendTimelineSlot {
  key: string;
  label: string;
  quarterKeys: string[];
  variationIndex: number;
  variationCount: number;
}

export function getTrendTimeline(granularity: TrendGranularity): TrendTimelineSlot[] {
  if (granularity === 'quarter') {
    return REPORTING_PERIODS.map((quarter) => ({
      key: quarter,
      label: quarter.replace('-Q', ' Q').replace(/^2025/, "'25").replace(/^2026/, "'26"),
      quarterKeys: [quarter],
      variationIndex: 0,
      variationCount: 1,
    }));
  }

  if (granularity === 'month') {
    return DEMO_TREND_MONTHS.map((monthKey) => {
      const quarter = monthToQuarterKey(monthKey);
      const monthInQuarter = (parseInt(monthKey.slice(5, 7), 10) - 1) % 3;
      return {
        key: monthKey,
        label: formatMonthShort(monthKey),
        quarterKeys: [quarter],
        variationIndex: monthInQuarter,
        variationCount: 3,
      };
    });
  }

  if (granularity === 'year') {
    return REPORTING_YEARS.map((year) => ({
      key: String(year),
      label: String(year),
      quarterKeys: getQuartersInYear(year),
      variationIndex: 0,
      variationCount: 1,
    }));
  }

  let weekCounter = 14;
  return DEMO_TREND_MONTHS.flatMap((monthKey) => {
    const quarter = monthToQuarterKey(monthKey);
    return Array.from({ length: 4 }, (_, weekIndex) => {
      const slot: TrendTimelineSlot = {
        key: `${monthKey}-W${weekIndex + 1}`,
        label: `KW ${weekCounter}`,
        quarterKeys: [quarter],
        variationIndex: weekIndex,
        variationCount: 4,
      };
      weekCounter += 1;
      return slot;
    });
  });
}

export const TREND_GRANULARITY_LABELS: Record<TrendGranularity, string> = {
  week: 'Wochen',
  month: 'Monate',
  quarter: 'Quartale',
  year: 'Jahre',
};

export type EntwicklungZeitraum = 'last-5-quarters' | 'last-13-months' | 'last-11-years';

export const ENTWICKLUNG_ZEITRAUM_OPTIONS: { value: EntwicklungZeitraum; label: string }[] = [
  { value: 'last-5-quarters', label: 'Verlauf der letzten 5 Quartale' },
  { value: 'last-13-months', label: 'Verlauf der letzten 13 Monate' },
  { value: 'last-11-years', label: 'Verlauf der letzten 11 Jahre' },
];

export function getEntwicklungZeitraumLabel(value: EntwicklungZeitraum): string {
  return ENTWICKLUNG_ZEITRAUM_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getEntwicklungZeitraumGranularity(range: EntwicklungZeitraum): TrendGranularity {
  if (range === 'last-5-quarters') return 'quarter';
  if (range === 'last-13-months') return 'month';
  return 'year';
}

export function generateMonthsEnding(endMonthKey: string, count: number): string[] {
  const endYear = parseInt(endMonthKey.slice(0, 4), 10);
  let endMonth = parseInt(endMonthKey.slice(5, 7), 10);
  let year = endYear;
  let month = endMonth;
  const result: string[] = [];

  for (let index = 0; index < count; index += 1) {
    result.unshift(`${year}-${String(month).padStart(2, '0')}`);
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }

  return result;
}

export function generateQuartersEnding(endQuarter: string, count: number): string[] {
  const match = endQuarter.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return [endQuarter];

  let year = parseInt(match[1], 10);
  let quarter = parseInt(match[2], 10);
  const result: string[] = [];

  for (let index = 0; index < count; index += 1) {
    result.unshift(`${year}-Q${quarter}`);
    quarter -= 1;
    if (quarter < 1) {
      quarter = 4;
      year -= 1;
    }
  }

  return result;
}

function quartersForTrendYear(year: number): string[] {
  const quarters = getQuartersInYear(year);
  if (quarters.length > 0) return quarters;
  return [LATEST_PERIOD];
}

function resolveQuarterKeysForTrend(quarterKey: string): string[] {
  return (REPORTING_PERIODS as readonly string[]).includes(quarterKey) ? [quarterKey] : [LATEST_PERIOD];
}

export function getDefaultBerichtszeitpunkt(zeitraum: EntwicklungZeitraum): string {
  if (zeitraum === 'last-5-quarters') return LATEST_PERIOD;
  if (zeitraum === 'last-13-months') return '2026-03';
  return String(getYearFromPeriod(LATEST_PERIOD));
}

export function getBerichtszeitpunktOptions(
  zeitraum: EntwicklungZeitraum,
): ReportingPeriodOption[] {
  if (zeitraum === 'last-5-quarters') {
    return generateQuartersEnding(LATEST_PERIOD, 8)
      .reverse()
      .map((quarter) => ({
        value: quarter,
        label: formatReportingPeriodDisplay(quarter),
      }));
  }

  if (zeitraum === 'last-13-months') {
    return generateMonthsEnding('2026-03', 24)
      .reverse()
      .map((monthKey) => ({
        value: monthKey,
        label: formatReportingPeriodDisplay(monthKey),
      }));
  }

  const endYear = getYearFromPeriod(LATEST_PERIOD);
  return Array.from({ length: 11 }, (_, index) => endYear - index).map((year) => ({
    value: String(year),
    label: String(year),
  }));
}

export function formatBerichtszeitpunktLabel(
  zeitraum: EntwicklungZeitraum,
  value: string,
): string {
  if (zeitraum === 'last-11-years') return value;
  return formatReportingPeriodDisplay(value);
}

export function berichtszeitpunktToReportingPeriod(
  berichtszeitpunkt: string,
  zeitraum: EntwicklungZeitraum,
): string {
  if (zeitraum === 'last-5-quarters') return berichtszeitpunkt;
  if (zeitraum === 'last-13-months') return monthToQuarterKey(berichtszeitpunkt);

  const year = parseInt(berichtszeitpunkt, 10);
  const quarters = getQuartersInYear(year);
  return quarters[quarters.length - 1] ?? LATEST_PERIOD;
}

export function getTrendTimelineForEntwicklungZeitraum(
  range: EntwicklungZeitraum,
  berichtszeitpunkt?: string,
): TrendTimelineSlot[] {
  const anchor = berichtszeitpunkt ?? getDefaultBerichtszeitpunkt(range);

  if (range === 'last-5-quarters') {
    const quarters = generateQuartersEnding(anchor, 5);
    return quarters.map((quarter) => ({
      key: quarter,
      label: quarter.replace('-Q', ' Q').replace(/^2025/, "'25").replace(/^2026/, "'26"),
      quarterKeys: resolveQuarterKeysForTrend(quarter),
      variationIndex: 0,
      variationCount: 1,
    }));
  }

  if (range === 'last-13-months') {
    const monthKeys = generateMonthsEnding(anchor, 13);
    return monthKeys.map((monthKey) => {
      const quarter = monthToQuarterKey(monthKey);
      const monthInQuarter = (parseInt(monthKey.slice(5, 7), 10) - 1) % 3;
      return {
        key: monthKey,
        label: formatMonthShort(monthKey),
        quarterKeys: resolveQuarterKeysForTrend(quarter),
        variationIndex: monthInQuarter,
        variationCount: 3,
      };
    });
  }

  const endYear = parseInt(anchor, 10);
  const startYear = endYear - 10;
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    return {
      key: String(year),
      label: String(year),
      quarterKeys: quartersForTrendYear(year),
      variationIndex: 0,
      variationCount: 1,
    };
  });
}

function parseQuarterParts(quarterKey: string): { year: number; quarter: number } | null {
  const match = quarterKey.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
}

export function shiftQuarter(quarterKey: string, delta: number): string {
  const parts = parseQuarterParts(quarterKey);
  if (!parts) return quarterKey;
  const total = parts.year * 4 + (parts.quarter - 1) + delta;
  const year = Math.floor(total / 4);
  const quarter = (total % 4) + 1;
  return `${year}-Q${quarter}`;
}

export function generateQuarterRange(from: string, to: string): string[] {
  const result: string[] = [];
  let current = from;
  let guard = 0;
  while (guard < 200) {
    result.push(current);
    if (current === to) break;
    const next = shiftQuarter(current, 1);
    if (next === current) break;
    current = next;
    guard += 1;
  }
  return result;
}

export const DEMO_HISTORY_QUARTERS = generateQuarterRange(
  DEMO_HISTORY_START_QUARTER,
  LATEST_COMPLETED_QUARTER,
);

export function getAllQuartersInCalendarYear(year: number): string[] {
  return [`${year}-Q1`, `${year}-Q2`, `${year}-Q3`, `${year}-Q4`];
}

export function isYearCompleteAsOf(year: number, asOfQuarter: string): boolean {
  const parts = parseQuarterParts(asOfQuarter);
  if (!parts) return false;
  if (year < parts.year) return true;
  if (year > parts.year) return false;
  return parts.quarter === 4;
}

export function getCompletedYearAsOf(asOfQuarter: string): number | null {
  const parts = parseQuarterParts(asOfQuarter);
  if (!parts) return null;
  return parts.quarter === 4 ? parts.year : parts.year - 1;
}

export function formatQuarterShort(quarterKey: string): string {
  const parts = parseQuarterParts(quarterKey);
  if (!parts) return quarterKey;
  return `${parts.quarter}. Q. ${parts.year}`;
}

export function getCompletedQuarterOptions(): ReportingPeriodOption[] {
  return generateQuarterRange('2016-Q1', LATEST_COMPLETED_QUARTER)
    .reverse()
    .map((quarter) => ({
      value: quarter,
      label: formatReportingPeriodDisplay(quarter),
    }));
}

export function quarterToLastMonthKey(quarterKey: string): string {
  return quarterToLastMonth(quarterKey);
}
