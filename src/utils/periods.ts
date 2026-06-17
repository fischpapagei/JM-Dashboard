import type { TimeGranularity } from '../types/domain';

export const REPORTING_PERIODS = ['2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1'] as const;
export const LATEST_PERIOD = '2026-Q1';

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
