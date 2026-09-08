import { courseCategories, courseTypes } from '../data/catalog';
import { JVAS } from '../data/jvas';
import type { EducationMeasureRecord } from '../types/domain';
import {
  formatMonthShort,
  formatQuarterShort,
  generateMonthsEnding,
  generateQuartersEnding,
  getAllQuartersInCalendarYear,
  getCompletedYearAsOf,
  getYearFromPeriod,
  monthToQuarterKey,
  MONTH_UTILIZATION_FACTORS,
  shiftQuarter,
} from './periods';

export type SchulteilnehmendeAltersgruppe = 'Erwachsenenvollzug' | 'Jugendvollzug';
export type SchulteilnehmendeGeschlecht = 'männlich' | 'weiblich';

export const SCHULTEILNEHMENDE_ALTERSGRUPPEN: {
  key: SchulteilnehmendeAltersgruppe;
  label: string;
  adjective: string;
}[] = [
  { key: 'Erwachsenenvollzug', label: 'Erwachsene', adjective: 'Erwachsene' },
  { key: 'Jugendvollzug', label: 'Jugendliche', adjective: 'Jugendliche' },
];

export const NRW_SERIES_SUFFIX = '__nrw';
export const NRW_JVA_COUNT = JVAS.length;

export interface GenderTrendPoint {
  key: string;
  label: string;
  weiblich: number;
  maennlich: number;
  summe: number;
  weiblichNrw?: number;
  maennlichNrw?: number;
  summeNrw?: number;
}

export interface CategoryCourseSeriesDef {
  key: string;
  label: string;
  isSumme: boolean;
}

export interface CategoryTrendPoint {
  key: string;
  label: string;
  [seriesKey: string]: string | number;
}

export interface CategoryChartGroup {
  id: string;
  title: string;
  categoryKeys: string[];
  series: CategoryCourseSeriesDef[];
}

export interface QuarterTableColumnLabels {
  current: string;
  previous: string;
  yearAgo: string;
}

export interface YearTableColumnLabels {
  current: string;
  previous: string;
}

export const DETAIL_CATEGORY_GROUPS: { id: string; label: string; categoryKeys: string[] }[] = [
  { id: 'SF', label: 'Sprachliche Förderung', categoryKeys: ['SF', 'SO'] },
  { id: 'VM', label: 'Vorqualifizierende Maßnahmen', categoryKeys: ['VM'] },
  { id: 'SA', label: 'Schulabschlussbezogene Maßnahmen', categoryKeys: ['SA'] },
  { id: 'ST', label: 'Studium', categoryKeys: ['ST'] },
  { id: 'AB', label: 'Ausbildung(svorbereitung)', categoryKeys: ['AB'] },
];

const MONTH_FACTORS = MONTH_UTILIZATION_FACTORS;

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function shareOfTotal(value: number, total: number): number {
  if (total <= 0) return 0;
  return (value / total) * 100;
}

function interpolateQuarterValue(quarterTotal: number, monthKey: string): number {
  const monthInQuarter = (parseInt(monthKey.slice(5, 7), 10) - 1) % 3;
  const factor = MONTH_FACTORS[monthInQuarter] ?? 1;
  return Math.round(quarterTotal * factor);
}

type ParticipantIndex = Map<string, number>;

const participantIndexCache = new WeakMap<EducationMeasureRecord[], ParticipantIndex>();

function indexKey(
  altersgruppe: string,
  geschlecht: string,
  courseTypeKey: string,
  period: string,
): string {
  return `${altersgruppe}|${geschlecht}|${courseTypeKey}|${period}`;
}

function getParticipantIndex(records: EducationMeasureRecord[]): ParticipantIndex {
  const cached = participantIndexCache.get(records);
  if (cached) return cached;

  const index: ParticipantIndex = new Map();
  for (const record of records) {
    if (!record.altersgruppe || !record.geschlecht || !record.courseTypeKey) continue;
    const key = indexKey(record.altersgruppe, record.geschlecht, record.courseTypeKey, record.reportingPeriod);
    index.set(key, (index.get(key) ?? 0) + (record.participants ?? 0));
  }
  participantIndexCache.set(records, index);
  return index;
}

export function sumParticipants(
  records: EducationMeasureRecord[],
  options: {
    altersgruppe: SchulteilnehmendeAltersgruppe;
    geschlecht?: SchulteilnehmendeGeschlecht;
    categoryKeys?: string[];
    courseTypeKey?: string;
    periods: string[];
  },
): number {
  const index = getParticipantIndex(records);
  const types = options.courseTypeKey
    ? [options.courseTypeKey]
    : courseTypes
        .filter((type) => !options.categoryKeys || options.categoryKeys.includes(type.categoryKey))
        .map((type) => type.key);
  const genders: SchulteilnehmendeGeschlecht[] = options.geschlecht
    ? [options.geschlecht]
    : ['männlich', 'weiblich'];

  let total = 0;
  for (const geschlecht of genders) {
    for (const courseTypeKey of types) {
      for (const period of options.periods) {
        total += index.get(indexKey(options.altersgruppe, geschlecht, courseTypeKey, period)) ?? 0;
      }
    }
  }
  return total;
}

const jvaRecordCache = new WeakMap<EducationMeasureRecord[], Map<string, EducationMeasureRecord[]>>();

export function filterRecordsByJva(
  records: EducationMeasureRecord[],
  jvaId: string,
): EducationMeasureRecord[] {
  let byJva = jvaRecordCache.get(records);
  if (!byJva) {
    byJva = new Map();
    jvaRecordCache.set(records, byJva);
  }
  const cached = byJva.get(jvaId);
  if (cached) return cached;
  const filtered = records.filter((record) => record.jvaId === jvaId);
  byJva.set(jvaId, filtered);
  return filtered;
}

export function getPresentCourseTypeKeys(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
): string[] {
  const present = new Set<string>();
  for (const record of records) {
    if (record.altersgruppe === altersgruppe && record.courseTypeKey) {
      present.add(record.courseTypeKey);
    }
  }
  return courseTypes.map((type) => type.key).filter((key) => present.has(key));
}

export function nrwAverageParticipants(
  records: EducationMeasureRecord[],
  options: Parameters<typeof sumParticipants>[1],
): number {
  if (NRW_JVA_COUNT <= 0) return 0;
  return Math.round(sumParticipants(records, options) / NRW_JVA_COUNT);
}

function withNrwMetric(
  metric: QuarterMetric,
  nrwCurrent: number | undefined,
): QuarterMetric {
  if (nrwCurrent == null) return metric;
  return {
    ...metric,
    nrwCurrent,
    vsNrw: percentChange(metric.current, nrwCurrent),
  };
}

export function buildGenderTrendSeries(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  range: 'last-5-quarters' | 'last-13-months' | 'last-11-years',
  berichtszeitpunkt: string,
  nrwRecords?: EducationMeasureRecord[],
): GenderTrendPoint[] {
  const attachNrw = (
    point: GenderTrendPoint,
    weiblichNrw: number,
    maennlichNrw: number,
  ): GenderTrendPoint =>
    nrwRecords
      ? { ...point, weiblichNrw, maennlichNrw, summeNrw: weiblichNrw + maennlichNrw }
      : point;

  if (range === 'last-5-quarters') {
    return generateQuartersEnding(berichtszeitpunkt, 5).map((quarter) => {
      const weiblich = sumParticipants(records, { altersgruppe, geschlecht: 'weiblich', periods: [quarter] });
      const maennlich = sumParticipants(records, { altersgruppe, geschlecht: 'männlich', periods: [quarter] });
      const point: GenderTrendPoint = {
        key: quarter,
        label: formatQuarterShort(quarter),
        weiblich,
        maennlich,
        summe: weiblich + maennlich,
      };
      if (!nrwRecords) return point;
      return attachNrw(
        point,
        nrwAverageParticipants(nrwRecords, { altersgruppe, geschlecht: 'weiblich', periods: [quarter] }),
        nrwAverageParticipants(nrwRecords, { altersgruppe, geschlecht: 'männlich', periods: [quarter] }),
      );
    });
  }

  if (range === 'last-13-months') {
    const endMonth = /^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? `${berichtszeitpunkt.slice(0, 4)}-${String(parseInt(berichtszeitpunkt.slice(-1), 10) * 3).padStart(2, '0')}`
      : berichtszeitpunkt;
    return generateMonthsEnding(endMonth, 13).map((monthKey) => {
      const quarter = monthToQuarterKey(monthKey);
      const weiblichQ = sumParticipants(records, { altersgruppe, geschlecht: 'weiblich', periods: [quarter] });
      const maennlichQ = sumParticipants(records, { altersgruppe, geschlecht: 'männlich', periods: [quarter] });
      const weiblich = interpolateQuarterValue(weiblichQ, monthKey);
      const maennlich = interpolateQuarterValue(maennlichQ, monthKey);
      const point: GenderTrendPoint = {
        key: monthKey,
        label: formatMonthShort(monthKey),
        weiblich,
        maennlich,
        summe: weiblich + maennlich,
      };
      if (!nrwRecords) return point;
      const weiblichNrwQ = nrwAverageParticipants(nrwRecords, {
        altersgruppe,
        geschlecht: 'weiblich',
        periods: [quarter],
      });
      const maennlichNrwQ = nrwAverageParticipants(nrwRecords, {
        altersgruppe,
        geschlecht: 'männlich',
        periods: [quarter],
      });
      return attachNrw(
        point,
        interpolateQuarterValue(weiblichNrwQ, monthKey),
        interpolateQuarterValue(maennlichNrwQ, monthKey),
      );
    });
  }

  const completedYear = getCompletedYearAsOf(berichtszeitpunkt);
  const endYear =
    completedYear ??
    (/^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? getYearFromPeriod(berichtszeitpunkt)
      : parseInt(berichtszeitpunkt, 10));
  const startYear = endYear - 10;
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    const periods = getAllQuartersInCalendarYear(year);
    const weiblich = sumParticipants(records, { altersgruppe, geschlecht: 'weiblich', periods });
    const maennlich = sumParticipants(records, { altersgruppe, geschlecht: 'männlich', periods });
    const point: GenderTrendPoint = {
      key: String(year),
      label: String(year),
      weiblich,
      maennlich,
      summe: weiblich + maennlich,
    };
    if (!nrwRecords) return point;
    return attachNrw(
      point,
      nrwAverageParticipants(nrwRecords, { altersgruppe, geschlecht: 'weiblich', periods }),
      nrwAverageParticipants(nrwRecords, { altersgruppe, geschlecht: 'männlich', periods }),
    );
  });
}

export function buildCategoryChartGroups(allowedCourseTypeKeys?: string[]): CategoryChartGroup[] {
  const allowed = allowedCourseTypeKeys ? new Set(allowedCourseTypeKeys) : null;
  return DETAIL_CATEGORY_GROUPS.map((group) => {
    const types = courseTypes.filter(
      (type) =>
        group.categoryKeys.includes(type.categoryKey) && (!allowed || allowed.has(type.key)),
    );
    return {
      id: group.id,
      title: group.label,
      categoryKeys: group.categoryKeys,
      series: [
        { key: 'summe', label: `Summe „${group.label}“`, isSumme: true },
        ...types.map((type) => ({
          key: type.key,
          label: type.shortLabel ?? type.label,
          isSumme: false,
        })),
      ],
    };
  }).filter((group) => group.series.some((series) => !series.isSumme));
}

export function buildCategoryCourseTrendSeries(
  records: EducationMeasureRecord[],
  group: CategoryChartGroup,
  geschlecht: SchulteilnehmendeGeschlecht,
  altersgruppe: SchulteilnehmendeAltersgruppe,
  endYear: number,
  nrwRecords?: EducationMeasureRecord[],
): CategoryTrendPoint[] {
  const startYear = endYear - 10;
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    const periods = getAllQuartersInCalendarYear(year);
    const point: CategoryTrendPoint = {
      key: String(year),
      label: String(year),
    };
    let summe = 0;
    let summeNrw = 0;
    for (const series of group.series) {
      if (series.isSumme) continue;
      const value = sumParticipants(records, {
        altersgruppe,
        geschlecht,
        categoryKeys: group.categoryKeys,
        courseTypeKey: series.key,
        periods,
      });
      point[series.key] = value;
      summe += value;
      if (nrwRecords) {
        const nrwValue = nrwAverageParticipants(nrwRecords, {
          altersgruppe,
          geschlecht,
          categoryKeys: group.categoryKeys,
          courseTypeKey: series.key,
          periods,
        });
        point[`${series.key}${NRW_SERIES_SUFFIX}`] = nrwValue;
        summeNrw += nrwValue;
      }
    }
    point.summe = summe;
    if (nrwRecords) {
      point[`summe${NRW_SERIES_SUFFIX}`] = summeNrw;
    }
    return point;
  });
}

export interface QuarterMetric {
  current: number;
  previous: number;
  yearAgo: number;
  changePrev: number | null;
  changeYearAgo: number | null;
  nrwCurrent?: number;
  vsNrw?: number | null;
}

export interface YearMetric {
  current: number;
  previous: number;
  share: number;
  changePrev: number | null;
  nrwCurrent?: number;
  vsNrw?: number | null;
}

export interface SchulteilnehmendeTableOptions {
  courseTypeKeys?: string[];
  nrwRecords?: EducationMeasureRecord[];
}

export interface SchulteilnehmendeQuarterRow {
  categoryKey: string;
  categoryLabel: string;
  courseTypeKey: string | null;
  courseTypeLabel: string;
  isCategorySum: boolean;
  weiblich: QuarterMetric;
  maennlich: QuarterMetric;
}

export interface SchulteilnehmendeYearRow {
  categoryKey: string;
  categoryLabel: string;
  courseTypeKey: string | null;
  courseTypeLabel: string;
  isCategorySum: boolean;
  weiblich: YearMetric;
  maennlich: YearMetric;
}

function metricForType(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  geschlecht: SchulteilnehmendeGeschlecht,
  courseTypeKey: string,
  currentPeriods: string[],
  previousPeriods: string[],
  yearAgoPeriods: string[],
  nrwRecords?: EducationMeasureRecord[],
): QuarterMetric {
  const current = sumParticipants(records, { altersgruppe, geschlecht, courseTypeKey, periods: currentPeriods });
  const previous = sumParticipants(records, { altersgruppe, geschlecht, courseTypeKey, periods: previousPeriods });
  const yearAgo = sumParticipants(records, { altersgruppe, geschlecht, courseTypeKey, periods: yearAgoPeriods });
  const metric: QuarterMetric = {
    current,
    previous,
    yearAgo,
    changePrev: percentChange(current, previous),
    changeYearAgo: percentChange(current, yearAgo),
  };
  if (!nrwRecords) return metric;
  const nrwCurrent = nrwAverageParticipants(nrwRecords, {
    altersgruppe,
    geschlecht,
    courseTypeKey,
    periods: currentPeriods,
  });
  return withNrwMetric(metric, nrwCurrent);
}

function allowedTypes(categoryKey: string, courseTypeKeys?: string[]) {
  return courseTypes.filter(
    (type) =>
      type.categoryKey === categoryKey && (!courseTypeKeys || courseTypeKeys.includes(type.key)),
  );
}

export function buildQuarterComparisonTable(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  currentQuarter: string,
  options: SchulteilnehmendeTableOptions = {},
): { rows: SchulteilnehmendeQuarterRow[]; labels: QuarterTableColumnLabels } {
  const previousQuarter = shiftQuarter(currentQuarter, -1);
  const yearAgoQuarter = shiftQuarter(currentQuarter, -4);
  const rows: SchulteilnehmendeQuarterRow[] = [];

  for (const category of courseCategories) {
    const types = allowedTypes(category.key, options.courseTypeKeys);
    if (types.length === 0) continue;
    const typeRows: SchulteilnehmendeQuarterRow[] = types.map((type) => ({
      categoryKey: category.key,
      categoryLabel: category.label,
      courseTypeKey: type.key,
      courseTypeLabel: type.label,
      isCategorySum: false,
      weiblich: metricForType(
        records,
        altersgruppe,
        'weiblich',
        type.key,
        [currentQuarter],
        [previousQuarter],
        [yearAgoQuarter],
        options.nrwRecords,
      ),
      maennlich: metricForType(
        records,
        altersgruppe,
        'männlich',
        type.key,
        [currentQuarter],
        [previousQuarter],
        [yearAgoQuarter],
        options.nrwRecords,
      ),
    }));

    const sumMetric = (pick: (row: SchulteilnehmendeQuarterRow) => QuarterMetric): QuarterMetric => {
      const current = typeRows.reduce((sum, row) => sum + pick(row).current, 0);
      const previous = typeRows.reduce((sum, row) => sum + pick(row).previous, 0);
      const yearAgo = typeRows.reduce((sum, row) => sum + pick(row).yearAgo, 0);
      const metric: QuarterMetric = {
        current,
        previous,
        yearAgo,
        changePrev: percentChange(current, previous),
        changeYearAgo: percentChange(current, yearAgo),
      };
      if (!options.nrwRecords) return metric;
      const nrwCurrent = typeRows.reduce((sum, row) => sum + (pick(row).nrwCurrent ?? 0), 0);
      return withNrwMetric(metric, nrwCurrent);
    };

    rows.push(...typeRows, {
      categoryKey: category.key,
      categoryLabel: category.label,
      courseTypeKey: null,
      courseTypeLabel: `Summe ${category.label}`,
      isCategorySum: true,
      weiblich: sumMetric((row) => row.weiblich),
      maennlich: sumMetric((row) => row.maennlich),
    });
  }

  return {
    rows,
    labels: {
      current: formatQuarterShort(currentQuarter),
      previous: formatQuarterShort(previousQuarter),
      yearAgo: formatQuarterShort(yearAgoQuarter),
    },
  };
}

export function buildYearComparisonTable(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  asOfQuarter: string,
  options: SchulteilnehmendeTableOptions = {},
): { rows: SchulteilnehmendeYearRow[]; labels: YearTableColumnLabels } | null {
  const currentYear = getCompletedYearAsOf(asOfQuarter);
  if (currentYear == null) return null;
  const previousYear = currentYear - 1;
  const currentPeriods = getAllQuartersInCalendarYear(currentYear);
  const previousPeriods = getAllQuartersInCalendarYear(previousYear);
  const rows: SchulteilnehmendeYearRow[] = [];

  const totals = {
    weiblich: sumParticipants(records, { altersgruppe, geschlecht: 'weiblich', periods: currentPeriods }),
    maennlich: sumParticipants(records, { altersgruppe, geschlecht: 'männlich', periods: currentPeriods }),
  };

  for (const category of courseCategories) {
    const types = allowedTypes(category.key, options.courseTypeKeys);
    if (types.length === 0) continue;
    const typeRows: SchulteilnehmendeYearRow[] = types.map((type) => {
      const wCur = sumParticipants(records, {
        altersgruppe,
        geschlecht: 'weiblich',
        courseTypeKey: type.key,
        periods: currentPeriods,
      });
      const wPrev = sumParticipants(records, {
        altersgruppe,
        geschlecht: 'weiblich',
        courseTypeKey: type.key,
        periods: previousPeriods,
      });
      const mCur = sumParticipants(records, {
        altersgruppe,
        geschlecht: 'männlich',
        courseTypeKey: type.key,
        periods: currentPeriods,
      });
      const mPrev = sumParticipants(records, {
        altersgruppe,
        geschlecht: 'männlich',
        courseTypeKey: type.key,
        periods: previousPeriods,
      });
      const wNrw = options.nrwRecords
        ? nrwAverageParticipants(options.nrwRecords, {
            altersgruppe,
            geschlecht: 'weiblich',
            courseTypeKey: type.key,
            periods: currentPeriods,
          })
        : undefined;
      const mNrw = options.nrwRecords
        ? nrwAverageParticipants(options.nrwRecords, {
            altersgruppe,
            geschlecht: 'männlich',
            courseTypeKey: type.key,
            periods: currentPeriods,
          })
        : undefined;
      return {
        categoryKey: category.key,
        categoryLabel: category.label,
        courseTypeKey: type.key,
        courseTypeLabel: type.label,
        isCategorySum: false,
        weiblich: {
          current: wCur,
          previous: wPrev,
          share: shareOfTotal(wCur, totals.weiblich),
          changePrev: percentChange(wCur, wPrev),
          nrwCurrent: wNrw,
          vsNrw: wNrw == null ? undefined : percentChange(wCur, wNrw),
        },
        maennlich: {
          current: mCur,
          previous: mPrev,
          share: shareOfTotal(mCur, totals.maennlich),
          changePrev: percentChange(mCur, mPrev),
          nrwCurrent: mNrw,
          vsNrw: mNrw == null ? undefined : percentChange(mCur, mNrw),
        },
      };
    });

    const wCur = typeRows.reduce((sum, row) => sum + row.weiblich.current, 0);
    const wPrev = typeRows.reduce((sum, row) => sum + row.weiblich.previous, 0);
    const mCur = typeRows.reduce((sum, row) => sum + row.maennlich.current, 0);
    const mPrev = typeRows.reduce((sum, row) => sum + row.maennlich.previous, 0);
    const wNrw = options.nrwRecords
      ? typeRows.reduce((sum, row) => sum + (row.weiblich.nrwCurrent ?? 0), 0)
      : undefined;
    const mNrw = options.nrwRecords
      ? typeRows.reduce((sum, row) => sum + (row.maennlich.nrwCurrent ?? 0), 0)
      : undefined;

    rows.push(...typeRows, {
      categoryKey: category.key,
      categoryLabel: category.label,
      courseTypeKey: null,
      courseTypeLabel: `Summe ${category.label}`,
      isCategorySum: true,
      weiblich: {
        current: wCur,
        previous: wPrev,
        share: shareOfTotal(wCur, totals.weiblich),
        changePrev: percentChange(wCur, wPrev),
        nrwCurrent: wNrw,
        vsNrw: wNrw == null ? undefined : percentChange(wCur, wNrw),
      },
      maennlich: {
        current: mCur,
        previous: mPrev,
        share: shareOfTotal(mCur, totals.maennlich),
        changePrev: percentChange(mCur, mPrev),
        nrwCurrent: mNrw,
        vsNrw: mNrw == null ? undefined : percentChange(mCur, mNrw),
      },
    });
  }

  return {
    rows,
    labels: {
      current: String(currentYear),
      previous: String(previousYear),
    },
  };
}
