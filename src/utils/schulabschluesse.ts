import { JVAS } from '../data/jvas';
import type { EducationMeasureRecord } from '../types/domain';
import {
  filterRecordsByJva,
  NRW_JVA_COUNT,
  NRW_SERIES_SUFFIX,
  type CategoryChartGroup,
  type CategoryTrendPoint,
  type GenderTrendPoint,
  type SchulteilnehmendeAltersgruppe,
  type SchulteilnehmendeGeschlecht,
} from './schulteilnehmende';
import {
  getAllQuartersInCalendarYear,
  getCompletedYearAsOf,
  getYearFromPeriod,
} from './periods';

export interface SchulabschlussGroup {
  key: string;
  label: string;
  shortLabel: string;
  typeKeys: readonly string[];
}

export const SCHULABSCHLUSS_GROUPS: SchulabschlussGroup[] = [
  {
    key: 'ESA_EESA',
    label: 'ESA und EESA (früher HSA 9 und 10)',
    shortLabel: 'Hauptschulabschluss (ESA/EESA)',
    typeKeys: ['ESA', 'EESA', 'HS10'],
  },
  {
    key: 'MSA',
    label: 'MSA (früher FOR)',
    shortLabel: 'Fachoberschulreife (MSA)',
    typeKeys: ['MSA', 'FOR'],
  },
  {
    key: 'FHR',
    label: 'Fachhochschulreife',
    shortLabel: 'Fachhochschulreife',
    typeKeys: ['FACHHOCHSCHULREIFE'],
  },
  {
    key: 'HR',
    label: 'Hochschulreife',
    shortLabel: 'Hochschulreife',
    typeKeys: ['HOCHSCHULREIFE'],
  },
  {
    key: 'FH',
    label: 'Fachhochschulabschluss',
    shortLabel: 'Fachhochschulabschluss',
    typeKeys: ['BACHELOR_FH', 'MASTER_FH'],
  },
  {
    key: 'UNI',
    label: 'Hochschulabschluss',
    shortLabel: 'Hochschulabschluss',
    typeKeys: ['BACHELOR_UNI', 'MASTER_UNI'],
  },
];

const GROUP_BY_TYPE = new Map(
  SCHULABSCHLUSS_GROUPS.flatMap((group) => group.typeKeys.map((typeKey) => [typeKey, group.key])),
);

type CountIndex = Map<string, number>;
const countIndexCache = new WeakMap<EducationMeasureRecord[], CountIndex>();

function indexKey(
  altersgruppe: string,
  geschlecht: string,
  groupKey: string,
  period: string,
): string {
  return `${altersgruppe}|${geschlecht}|${groupKey}|${period}`;
}

function getCountIndex(records: EducationMeasureRecord[]): CountIndex {
  const cached = countIndexCache.get(records);
  if (cached) return cached;
  const index: CountIndex = new Map();
  for (const record of records) {
    if (!record.altersgruppe || !record.geschlecht || !record.completionType) continue;
    const groupKey = GROUP_BY_TYPE.get(record.completionType);
    const count = record.completions ?? 0;
    if (!groupKey || count <= 0) continue;
    const key = indexKey(record.altersgruppe, record.geschlecht, groupKey, record.reportingPeriod);
    index.set(key, (index.get(key) ?? 0) + count);
  }
  countIndexCache.set(records, index);
  return index;
}

function sumCompletions(
  records: EducationMeasureRecord[],
  options: {
    altersgruppe: SchulteilnehmendeAltersgruppe;
    geschlecht?: SchulteilnehmendeGeschlecht;
    groupKeys?: string[];
    periods: string[];
  },
): number {
  const index = getCountIndex(records);
  const groups = options.groupKeys ?? SCHULABSCHLUSS_GROUPS.map((group) => group.key);
  const genders: SchulteilnehmendeGeschlecht[] = options.geschlecht
    ? [options.geschlecht]
    : ['männlich', 'weiblich'];
  let total = 0;
  for (const geschlecht of genders) {
    for (const groupKey of groups) {
      for (const period of options.periods) {
        total += index.get(indexKey(options.altersgruppe, geschlecht, groupKey, period)) ?? 0;
      }
    }
  }
  return total;
}

function nrwAverageCompletions(
  records: EducationMeasureRecord[],
  options: Parameters<typeof sumCompletions>[1],
): number {
  if (NRW_JVA_COUNT <= 0) return 0;
  return Math.round(sumCompletions(records, options) / NRW_JVA_COUNT);
}

export interface SchulabschlussReportOptions {
  groupKeys?: string[];
  genders?: SchulteilnehmendeGeschlecht[];
  nrwRecords?: EducationMeasureRecord[];
}

export function scopeJvaSchulabschlussRecords(
  records: EducationMeasureRecord[],
  jvaId: string,
): EducationMeasureRecord[] {
  const byJva = filterRecordsByJva(records, jvaId);
  const jva = JVAS.find((item) => item.id === jvaId);
  if (!jva) return byJva;
  return byJva.filter((record) => {
    if (jva.geschlecht !== 'gemischt' && record.geschlecht !== jva.geschlecht) return false;
    if (jva.altersgruppe !== 'beides' && record.altersgruppe !== jva.altersgruppe) return false;
    return true;
  });
}

export function getPresentSchulabschlussAspects(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
): { genders: SchulteilnehmendeGeschlecht[]; groupKeys: string[] } {
  const genderSet = new Set<SchulteilnehmendeGeschlecht>();
  const groupSet = new Set<string>();
  for (const record of records) {
    if (record.altersgruppe !== altersgruppe || !record.completionType) continue;
    const groupKey = GROUP_BY_TYPE.get(record.completionType);
    const count = record.completions ?? 0;
    if (!groupKey || count <= 0) continue;
    if (record.geschlecht === 'männlich' || record.geschlecht === 'weiblich') {
      genderSet.add(record.geschlecht);
    }
    groupSet.add(groupKey);
  }
  return {
    genders: (['weiblich', 'männlich'] as const).filter((gender) => genderSet.has(gender)),
    groupKeys: SCHULABSCHLUSS_GROUPS.map((group) => group.key).filter((key) => groupSet.has(key)),
  };
}

function bothGeschlecht(genders?: SchulteilnehmendeGeschlecht[]): SchulteilnehmendeGeschlecht | undefined {
  if (!genders || genders.length !== 1) return undefined;
  return genders[0];
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function shareOfTotal(value: number, total: number): number {
  if (total <= 0) return 0;
  return (value / total) * 100;
}

function completedEndYear(berichtszeitpunkt: string): number {
  return (
    getCompletedYearAsOf(berichtszeitpunkt) ??
    (/^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? getYearFromPeriod(berichtszeitpunkt)
      : parseInt(berichtszeitpunkt, 10))
  );
}

export function buildSchulabschlussGenderTrend(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  berichtszeitpunkt: string,
  options: SchulabschlussReportOptions = {},
): GenderTrendPoint[] {
  const endYear = completedEndYear(berichtszeitpunkt);
  const startYear = endYear - 10;
  const groupKeys = options.groupKeys;
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    const periods = getAllQuartersInCalendarYear(year);
    const weiblich = sumCompletions(records, {
      altersgruppe,
      geschlecht: 'weiblich',
      groupKeys,
      periods,
    });
    const maennlich = sumCompletions(records, {
      altersgruppe,
      geschlecht: 'männlich',
      groupKeys,
      periods,
    });
    const point: GenderTrendPoint = {
      key: String(year),
      label: String(year),
      weiblich,
      maennlich,
      summe: weiblich + maennlich,
    };
    if (!options.nrwRecords) return point;
    const weiblichNrw = nrwAverageCompletions(options.nrwRecords, {
      altersgruppe,
      geschlecht: 'weiblich',
      groupKeys,
      periods,
    });
    const maennlichNrw = nrwAverageCompletions(options.nrwRecords, {
      altersgruppe,
      geschlecht: 'männlich',
      groupKeys,
      periods,
    });
    return {
      ...point,
      weiblichNrw,
      maennlichNrw,
      summeNrw: weiblichNrw + maennlichNrw,
    };
  });
}

export function buildSchulabschlussDetailGroup(groupKeys?: string[]): CategoryChartGroup {
  const allowed = groupKeys ? new Set(groupKeys) : null;
  const groups = SCHULABSCHLUSS_GROUPS.filter((group) => !allowed || allowed.has(group.key));
  return {
    id: 'schulabschluesse-arten',
    title: 'Erreichte Schulabschlüsse nach Abschlussart',
    categoryKeys: [],
    series: [
      { key: 'summe', label: 'Summe', isSumme: true },
      ...groups.map((group) => ({
        key: group.key,
        label: group.shortLabel,
        isSumme: false,
      })),
    ],
  };
}

export function buildSchulabschlussDetailTrend(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  geschlecht: SchulteilnehmendeGeschlecht | 'beide',
  berichtszeitpunkt: string,
  options: SchulabschlussReportOptions = {},
): CategoryTrendPoint[] {
  const endYear = completedEndYear(berichtszeitpunkt);
  const startYear = endYear - 10;
  const genderFilter = geschlecht === 'beide' ? bothGeschlecht(options.genders) : geschlecht;
  const groups = SCHULABSCHLUSS_GROUPS.filter(
    (group) => !options.groupKeys || options.groupKeys.includes(group.key),
  );
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    const periods = getAllQuartersInCalendarYear(year);
    const point: CategoryTrendPoint = {
      key: String(year),
      label: String(year),
    };
    let summe = 0;
    let summeNrw = 0;
    for (const group of groups) {
      const value = sumCompletions(records, {
        altersgruppe,
        geschlecht: genderFilter,
        groupKeys: [group.key],
        periods,
      });
      point[group.key] = value;
      summe += value;
      if (options.nrwRecords) {
        const nrwValue = nrwAverageCompletions(options.nrwRecords, {
          altersgruppe,
          geschlecht: genderFilter,
          groupKeys: [group.key],
          periods,
        });
        point[`${group.key}${NRW_SERIES_SUFFIX}`] = nrwValue;
        summeNrw += nrwValue;
      }
    }
    point.summe = summe;
    if (options.nrwRecords) {
      point[`summe${NRW_SERIES_SUFFIX}`] = summeNrw;
    }
    return point;
  });
}

export interface SchulabschlussYearLabels {
  current: string;
  previous: string;
}

export interface SchulabschlussGenderYear {
  current: number;
  previous: number;
  share: number;
  changePrev: number | null;
  nrwCurrent?: number;
  vsNrw?: number | null;
}

export interface SchulabschlussYearRow {
  groupKey: string;
  groupLabel: string;
  isSum: boolean;
  both: number;
  bothNrw?: number;
  bothVsNrw?: number | null;
  weiblich: SchulabschlussGenderYear;
  maennlich: SchulabschlussGenderYear;
}

export function buildSchulabschlussYearTable(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  asOfQuarter: string,
  options: SchulabschlussReportOptions = {},
): { rows: SchulabschlussYearRow[]; labels: SchulabschlussYearLabels } | null {
  const currentYear = getCompletedYearAsOf(asOfQuarter);
  if (currentYear == null) return null;
  const previousYear = currentYear - 1;
  const current = getAllQuartersInCalendarYear(currentYear);
  const previous = getAllQuartersInCalendarYear(previousYear);
  const groups = SCHULABSCHLUSS_GROUPS.filter(
    (group) => !options.groupKeys || options.groupKeys.includes(group.key),
  );
  const bothGender = bothGeschlecht(options.genders);
  const allKeys = groups.map((group) => group.key);

  const wTotal = sumCompletions(records, {
    altersgruppe,
    geschlecht: 'weiblich',
    groupKeys: allKeys,
    periods: current,
  });
  const mTotal = sumCompletions(records, {
    altersgruppe,
    geschlecht: 'männlich',
    groupKeys: allKeys,
    periods: current,
  });

  const genderMetric = (
    geschlecht: SchulteilnehmendeGeschlecht,
    groupKeys: string[] | undefined,
    total: number,
  ): SchulabschlussGenderYear => {
    const cur = sumCompletions(records, { altersgruppe, geschlecht, groupKeys, periods: current });
    const prev = sumCompletions(records, { altersgruppe, geschlecht, groupKeys, periods: previous });
    const nrwCurrent = options.nrwRecords
      ? nrwAverageCompletions(options.nrwRecords, { altersgruppe, geschlecht, groupKeys, periods: current })
      : undefined;
    return {
      current: cur,
      previous: prev,
      share: shareOfTotal(cur, total),
      changePrev: percentChange(cur, prev),
      nrwCurrent,
      vsNrw: nrwCurrent == null ? undefined : percentChange(cur, nrwCurrent),
    };
  };

  const bothRow = (groupKeys: string[] | undefined) => {
    const both = sumCompletions(records, {
      altersgruppe,
      geschlecht: bothGender,
      groupKeys,
      periods: current,
    });
    const bothNrw = options.nrwRecords
      ? nrwAverageCompletions(options.nrwRecords, {
          altersgruppe,
          geschlecht: bothGender,
          groupKeys,
          periods: current,
        })
      : undefined;
    return {
      both,
      bothNrw,
      bothVsNrw: bothNrw == null ? undefined : percentChange(both, bothNrw),
    };
  };

  const rows: SchulabschlussYearRow[] = groups.map((group) => ({
    groupKey: group.key,
    groupLabel: group.label,
    isSum: false,
    ...bothRow([group.key]),
    weiblich: genderMetric('weiblich', [group.key], wTotal),
    maennlich: genderMetric('männlich', [group.key], mTotal),
  }));

  rows.push({
    groupKey: '__summe__',
    groupLabel: 'Summe',
    isSum: true,
    ...bothRow(allKeys),
    weiblich: genderMetric('weiblich', allKeys, wTotal),
    maennlich: genderMetric('männlich', allKeys, mTotal),
  });

  return {
    rows,
    labels: {
      current: String(currentYear),
      previous: String(previousYear),
    },
  };
}
