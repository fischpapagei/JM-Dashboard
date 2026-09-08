import { courseCategories, courseTypes } from '../data/catalog';
import type { EducationMeasureRecord } from '../types/domain';
import {
  NRW_SERIES_SUFFIX,
  type CategoryChartGroup,
  type CategoryTrendPoint,
  type GenderTrendPoint,
  type SchulteilnehmendeAltersgruppe,
  type SchulteilnehmendeGeschlecht,
} from './schulteilnehmende';
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

export const AUSLASTUNG_CATEGORY_ORDER = ['SF', 'VM', 'SA', 'ST', 'AB', 'SO'] as const;

type MeasureTotals = { participants: number; targetPlaces: number };

type MeasureIndex = Map<string, MeasureTotals>;

const measureIndexCache = new WeakMap<EducationMeasureRecord[], MeasureIndex>();

function indexKey(
  altersgruppe: string,
  geschlecht: string,
  courseTypeKey: string,
  period: string,
): string {
  return `${altersgruppe}|${geschlecht}|${courseTypeKey}|${period}`;
}

function getMeasureIndex(records: EducationMeasureRecord[]): MeasureIndex {
  const cached = measureIndexCache.get(records);
  if (cached) return cached;

  const index: MeasureIndex = new Map();
  for (const record of records) {
    if (!record.altersgruppe || !record.geschlecht || !record.courseTypeKey) continue;
    const key = indexKey(record.altersgruppe, record.geschlecht, record.courseTypeKey, record.reportingPeriod);
    const current = index.get(key) ?? { participants: 0, targetPlaces: 0 };
    current.participants += record.participants ?? 0;
    current.targetPlaces += record.targetPlaces ?? 0;
    index.set(key, current);
  }
  measureIndexCache.set(records, index);
  return index;
}

function sumMeasures(
  records: EducationMeasureRecord[],
  options: {
    altersgruppe: SchulteilnehmendeAltersgruppe;
    geschlecht?: SchulteilnehmendeGeschlecht;
    categoryKeys?: string[];
    courseTypeKey?: string;
    courseTypeKeys?: string[];
    periods: string[];
  },
): MeasureTotals {
  const index = getMeasureIndex(records);
  const types = options.courseTypeKey
    ? [options.courseTypeKey]
    : courseTypes
        .filter((type) => {
          if (options.courseTypeKeys && !options.courseTypeKeys.includes(type.key)) return false;
          if (options.categoryKeys && !options.categoryKeys.includes(type.categoryKey)) return false;
          return true;
        })
        .map((type) => type.key);
  const genders: SchulteilnehmendeGeschlecht[] = options.geschlecht
    ? [options.geschlecht]
    : ['männlich', 'weiblich'];

  const total: MeasureTotals = { participants: 0, targetPlaces: 0 };
  for (const geschlecht of genders) {
    for (const courseTypeKey of types) {
      for (const period of options.periods) {
        const slice = index.get(indexKey(options.altersgruppe, geschlecht, courseTypeKey, period));
        if (!slice) continue;
        total.participants += slice.participants;
        total.targetPlaces += slice.targetPlaces;
      }
    }
  }
  return total;
}

function occupancyRate(totals: MeasureTotals): number {
  if (totals.targetPlaces <= 0) return 0;
  return Math.round((totals.participants / totals.targetPlaces) * 1000) / 10;
}

function interpolateOccupancy(quarterRate: number, monthKey: string): number {
  const monthInQuarter = (parseInt(monthKey.slice(5, 7), 10) - 1) % 3;
  const factor = MONTH_UTILIZATION_FACTORS[monthInQuarter] ?? 1;
  return Math.round(quarterRate * factor * 10) / 10;
}

function completedEndYear(berichtszeitpunkt: string): number {
  return (
    getCompletedYearAsOf(berichtszeitpunkt) ??
    (/^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? getYearFromPeriod(berichtszeitpunkt)
      : parseInt(berichtszeitpunkt, 10))
  );
}

export interface UtilizationReportOptions {
  courseTypeKeys?: string[];
  nrwRecords?: EducationMeasureRecord[];
}

function occupancyFor(
  records: EducationMeasureRecord[],
  options: Parameters<typeof sumMeasures>[1],
): number {
  return occupancyRate(sumMeasures(records, options));
}

export function buildUtilizationGenderTrend(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  range: 'last-5-quarters' | 'last-13-months' | 'last-11-years',
  berichtszeitpunkt: string,
  options: UtilizationReportOptions = {},
): GenderTrendPoint[] {
  const courseTypeKeys = options.courseTypeKeys;
  const attachNrw = (point: GenderTrendPoint, periods: string[], interpolateMonth?: string): GenderTrendPoint => {
    if (!options.nrwRecords) return point;
    const weiblichNrw = occupancyFor(options.nrwRecords, {
      altersgruppe,
      geschlecht: 'weiblich',
      courseTypeKeys,
      periods,
    });
    const maennlichNrw = occupancyFor(options.nrwRecords, {
      altersgruppe,
      geschlecht: 'männlich',
      courseTypeKeys,
      periods,
    });
    const summeNrw = occupancyFor(options.nrwRecords, { altersgruppe, courseTypeKeys, periods });
    return {
      ...point,
      weiblichNrw: interpolateMonth ? interpolateOccupancy(weiblichNrw, interpolateMonth) : weiblichNrw,
      maennlichNrw: interpolateMonth ? interpolateOccupancy(maennlichNrw, interpolateMonth) : maennlichNrw,
      summeNrw: interpolateMonth ? interpolateOccupancy(summeNrw, interpolateMonth) : summeNrw,
    };
  };

  if (range === 'last-5-quarters') {
    return generateQuartersEnding(berichtszeitpunkt, 5).map((quarter) => {
      const periods = [quarter];
      const point: GenderTrendPoint = {
        key: quarter,
        label: formatQuarterShort(quarter),
        weiblich: occupancyFor(records, { altersgruppe, geschlecht: 'weiblich', courseTypeKeys, periods }),
        maennlich: occupancyFor(records, { altersgruppe, geschlecht: 'männlich', courseTypeKeys, periods }),
        summe: occupancyFor(records, { altersgruppe, courseTypeKeys, periods }),
      };
      return attachNrw(point, periods);
    });
  }

  if (range === 'last-13-months') {
    const endMonth = /^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? `${berichtszeitpunkt.slice(0, 4)}-${String(parseInt(berichtszeitpunkt.slice(-1), 10) * 3).padStart(2, '0')}`
      : berichtszeitpunkt;
    return generateMonthsEnding(endMonth, 13).map((monthKey) => {
      const quarter = monthToQuarterKey(monthKey);
      const periods = [quarter];
      const point: GenderTrendPoint = {
        key: monthKey,
        label: formatMonthShort(monthKey),
        weiblich: interpolateOccupancy(
          occupancyFor(records, { altersgruppe, geschlecht: 'weiblich', courseTypeKeys, periods }),
          monthKey,
        ),
        maennlich: interpolateOccupancy(
          occupancyFor(records, { altersgruppe, geschlecht: 'männlich', courseTypeKeys, periods }),
          monthKey,
        ),
        summe: interpolateOccupancy(occupancyFor(records, { altersgruppe, courseTypeKeys, periods }), monthKey),
      };
      return attachNrw(point, periods, monthKey);
    });
  }

  const endYear = completedEndYear(berichtszeitpunkt);
  const startYear = endYear - 10;
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    const periods = getAllQuartersInCalendarYear(year);
    const point: GenderTrendPoint = {
      key: String(year),
      label: String(year),
      weiblich: occupancyFor(records, { altersgruppe, geschlecht: 'weiblich', courseTypeKeys, periods }),
      maennlich: occupancyFor(records, { altersgruppe, geschlecht: 'männlich', courseTypeKeys, periods }),
      summe: occupancyFor(records, { altersgruppe, courseTypeKeys, periods }),
    };
    return attachNrw(point, periods);
  });
}

export function buildUtilizationCategoryGroup(allowedCourseTypeKeys?: string[]): CategoryChartGroup {
  const byKey = new Map(courseCategories.map((category) => [category.key, category.label]));
  const allowed = allowedCourseTypeKeys ? new Set(allowedCourseTypeKeys) : null;
  const categoryKeys = AUSLASTUNG_CATEGORY_ORDER.filter(
    (key) =>
      !allowed || courseTypes.some((type) => type.categoryKey === key && allowed.has(type.key)),
  );
  return {
    id: 'auslastung-kategorien',
    title: 'Auslastung nach Kurskategorie',
    categoryKeys: [...categoryKeys],
    series: categoryKeys.map((key) => ({
      key,
      label: key === 'SF' ? 'Sprachliche Förderung' : (byKey.get(key) ?? key),
      isSumme: false,
    })),
  };
}

export function buildUtilizationCategoryTrend(
  records: EducationMeasureRecord[],
  geschlecht: SchulteilnehmendeGeschlecht,
  altersgruppe: SchulteilnehmendeAltersgruppe,
  berichtszeitpunkt: string,
  options: UtilizationReportOptions & { categoryKeys?: readonly string[] } = {},
): CategoryTrendPoint[] {
  const endYear = completedEndYear(berichtszeitpunkt);
  const startYear = endYear - 10;
  const categoryKeys = options.categoryKeys ?? AUSLASTUNG_CATEGORY_ORDER;
  const { courseTypeKeys, nrwRecords } = options;
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    const periods = getAllQuartersInCalendarYear(year);
    const point: CategoryTrendPoint = {
      key: String(year),
      label: String(year),
    };
    for (const categoryKey of categoryKeys) {
      point[categoryKey] = occupancyFor(records, {
        altersgruppe,
        geschlecht,
        categoryKeys: [categoryKey],
        courseTypeKeys,
        periods,
      });
      if (nrwRecords) {
        point[`${categoryKey}${NRW_SERIES_SUFFIX}`] = occupancyFor(nrwRecords, {
          altersgruppe,
          geschlecht,
          categoryKeys: [categoryKey],
          courseTypeKeys,
          periods,
        });
      }
    }
    return point;
  });
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export interface UtilizationQuarterLabels {
  current: string;
  previous: string;
  yearAgo: string;
}

export interface UtilizationYearLabels {
  current: string;
  previous: string;
}

export interface UtilizationGenderQuarter {
  occupancyCurrent: number;
  occupancyPrevious: number;
  occupancyYearAgo: number;
  occupancyChangePrev: number | null;
  occupancyChangeYearAgo: number | null;
  placesCurrent: number;
  placesYearAgo: number;
  placesChangeYearAgo: number;
  occupancyNrw?: number;
  occupancyVsNrw?: number | null;
}

export interface UtilizationGenderYear {
  occupancyCurrent: number;
  occupancyPrevious: number;
  occupancyChangePrev: number | null;
  placesCurrent: number;
  placesPrevious: number;
  placesChangePrev: number;
  occupancyNrw?: number;
  occupancyVsNrw?: number | null;
}

export interface UtilizationQuarterRow {
  categoryKey: string;
  categoryLabel: string;
  courseTypeKey: string | null;
  courseTypeLabel: string;
  isCategorySum: boolean;
  occupancyBoth: number;
  occupancyBothNrw?: number;
  occupancyBothVsNrw?: number | null;
  weiblich: UtilizationGenderQuarter;
  maennlich: UtilizationGenderQuarter;
}

export interface UtilizationYearRow {
  categoryKey: string;
  categoryLabel: string;
  courseTypeKey: string | null;
  courseTypeLabel: string;
  isCategorySum: boolean;
  occupancyBoth: number;
  occupancyBothNrw?: number;
  occupancyBothVsNrw?: number | null;
  weiblich: UtilizationGenderYear;
  maennlich: UtilizationGenderYear;
}

function orderedCourseCategories() {
  const byKey = new Map(courseCategories.map((category) => [category.key, category]));
  return AUSLASTUNG_CATEGORY_ORDER.map((key) => byKey.get(key)).filter(
    (category): category is (typeof courseCategories)[number] => Boolean(category),
  );
}

function allowedTypes(categoryKey: string, courseTypeKeys?: string[]) {
  return courseTypes.filter(
    (type) =>
      type.categoryKey === categoryKey && (!courseTypeKeys || courseTypeKeys.includes(type.key)),
  );
}

function toGenderQuarter(cur: MeasureTotals, prev: MeasureTotals, ago: MeasureTotals): UtilizationGenderQuarter {
  const occupancyCurrent = occupancyRate(cur);
  const occupancyPrevious = occupancyRate(prev);
  const occupancyYearAgo = occupancyRate(ago);
  return {
    occupancyCurrent,
    occupancyPrevious,
    occupancyYearAgo,
    occupancyChangePrev: percentChange(occupancyCurrent, occupancyPrevious),
    occupancyChangeYearAgo: percentChange(occupancyCurrent, occupancyYearAgo),
    placesCurrent: cur.targetPlaces,
    placesYearAgo: ago.targetPlaces,
    placesChangeYearAgo: cur.targetPlaces - ago.targetPlaces,
  };
}

function toGenderYear(cur: MeasureTotals, prev: MeasureTotals): UtilizationGenderYear {
  const occupancyCurrent = occupancyRate(cur);
  const occupancyPrevious = occupancyRate(prev);
  return {
    occupancyCurrent,
    occupancyPrevious,
    occupancyChangePrev: percentChange(occupancyCurrent, occupancyPrevious),
    placesCurrent: cur.targetPlaces,
    placesPrevious: prev.targetPlaces,
    placesChangePrev: cur.targetPlaces - prev.targetPlaces,
  };
}

function withNrwOccupancy<T extends { occupancyCurrent: number }>(
  metric: T,
  nrwOccupancy?: number,
): T {
  if (nrwOccupancy == null) return metric;
  return {
    ...metric,
    occupancyNrw: nrwOccupancy,
    occupancyVsNrw: percentChange(metric.occupancyCurrent, nrwOccupancy),
  };
}

function withNrwBoth<T extends { occupancyBoth: number }>(row: T, nrwOccupancy?: number): T {
  if (nrwOccupancy == null) return row;
  return {
    ...row,
    occupancyBothNrw: nrwOccupancy,
    occupancyBothVsNrw: percentChange(row.occupancyBoth, nrwOccupancy),
  };
}

export function buildUtilizationQuarterTable(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  currentQuarter: string,
  options: UtilizationReportOptions = {},
): { rows: UtilizationQuarterRow[]; labels: UtilizationQuarterLabels } {
  const previousQuarter = shiftQuarter(currentQuarter, -1);
  const yearAgoQuarter = shiftQuarter(currentQuarter, -4);
  const current = [currentQuarter];
  const previous = [previousQuarter];
  const yearAgo = [yearAgoQuarter];
  const { courseTypeKeys, nrwRecords } = options;
  const rows: UtilizationQuarterRow[] = [];

  const genderQuarter = (
    geschlecht: SchulteilnehmendeGeschlecht,
    slice: { courseTypeKey?: string; categoryKeys?: string[]; courseTypeKeys?: string[] },
  ): UtilizationGenderQuarter => {
    const metric = toGenderQuarter(
      sumMeasures(records, { altersgruppe, geschlecht, ...slice, periods: current }),
      sumMeasures(records, { altersgruppe, geschlecht, ...slice, periods: previous }),
      sumMeasures(records, { altersgruppe, geschlecht, ...slice, periods: yearAgo }),
    );
    return withNrwOccupancy(
      metric,
      nrwRecords
        ? occupancyFor(nrwRecords, { altersgruppe, geschlecht, ...slice, periods: current })
        : undefined,
    );
  };

  const bothOccupancy = (slice: {
    courseTypeKey?: string;
    categoryKeys?: string[];
    courseTypeKeys?: string[];
  }) => occupancyFor(records, { altersgruppe, ...slice, periods: current });

  const bothNrw = (slice: {
    courseTypeKey?: string;
    categoryKeys?: string[];
    courseTypeKeys?: string[];
  }) =>
    nrwRecords ? occupancyFor(nrwRecords, { altersgruppe, ...slice, periods: current }) : undefined;

  for (const category of orderedCourseCategories()) {
    const types = allowedTypes(category.key, courseTypeKeys);
    if (types.length === 0) continue;
    const categorySlice = { categoryKeys: [category.key], courseTypeKeys };
    const typeRows: UtilizationQuarterRow[] = types.map((type) =>
      withNrwBoth(
        {
          categoryKey: category.key,
          categoryLabel: category.label,
          courseTypeKey: type.key,
          courseTypeLabel: type.label,
          isCategorySum: false,
          occupancyBoth: bothOccupancy({ courseTypeKey: type.key }),
          weiblich: genderQuarter('weiblich', { courseTypeKey: type.key }),
          maennlich: genderQuarter('männlich', { courseTypeKey: type.key }),
        },
        bothNrw({ courseTypeKey: type.key }),
      ),
    );

    rows.push(
      ...typeRows,
      withNrwBoth(
        {
          categoryKey: category.key,
          categoryLabel: category.label,
          courseTypeKey: null,
          courseTypeLabel: `Summe ${category.label}`,
          isCategorySum: true,
          occupancyBoth: bothOccupancy(categorySlice),
          weiblich: genderQuarter('weiblich', categorySlice),
          maennlich: genderQuarter('männlich', categorySlice),
        },
        bothNrw(categorySlice),
      ),
    );
  }

  const totalSlice = { courseTypeKeys };
  rows.push(
    withNrwBoth(
      {
        categoryKey: '__summe__',
        categoryLabel: 'Summe',
        courseTypeKey: null,
        courseTypeLabel: 'alle Maßnahmen',
        isCategorySum: true,
        occupancyBoth: bothOccupancy(totalSlice),
        weiblich: genderQuarter('weiblich', totalSlice),
        maennlich: genderQuarter('männlich', totalSlice),
      },
      bothNrw(totalSlice),
    ),
  );

  return {
    rows,
    labels: {
      current: formatQuarterShort(currentQuarter),
      previous: formatQuarterShort(previousQuarter),
      yearAgo: formatQuarterShort(yearAgoQuarter),
    },
  };
}

export function buildUtilizationYearTable(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  asOfQuarter: string,
  options: UtilizationReportOptions = {},
): { rows: UtilizationYearRow[]; labels: UtilizationYearLabels } | null {
  const currentYear = getCompletedYearAsOf(asOfQuarter);
  if (currentYear == null) return null;
  const previousYear = currentYear - 1;
  const currentPeriods = getAllQuartersInCalendarYear(currentYear);
  const previousPeriods = getAllQuartersInCalendarYear(previousYear);
  const { courseTypeKeys, nrwRecords } = options;
  const rows: UtilizationYearRow[] = [];

  const genderYear = (
    geschlecht: SchulteilnehmendeGeschlecht,
    slice: { courseTypeKey?: string; categoryKeys?: string[]; courseTypeKeys?: string[] },
  ): UtilizationGenderYear => {
    const metric = toGenderYear(
      sumMeasures(records, { altersgruppe, geschlecht, ...slice, periods: currentPeriods }),
      sumMeasures(records, { altersgruppe, geschlecht, ...slice, periods: previousPeriods }),
    );
    return withNrwOccupancy(
      metric,
      nrwRecords
        ? occupancyFor(nrwRecords, { altersgruppe, geschlecht, ...slice, periods: currentPeriods })
        : undefined,
    );
  };

  const bothOccupancy = (slice: {
    courseTypeKey?: string;
    categoryKeys?: string[];
    courseTypeKeys?: string[];
  }) => occupancyFor(records, { altersgruppe, ...slice, periods: currentPeriods });

  const bothNrw = (slice: {
    courseTypeKey?: string;
    categoryKeys?: string[];
    courseTypeKeys?: string[];
  }) =>
    nrwRecords
      ? occupancyFor(nrwRecords, { altersgruppe, ...slice, periods: currentPeriods })
      : undefined;

  for (const category of orderedCourseCategories()) {
    const types = allowedTypes(category.key, courseTypeKeys);
    if (types.length === 0) continue;
    const categorySlice = { categoryKeys: [category.key], courseTypeKeys };
    const typeRows: UtilizationYearRow[] = types.map((type) =>
      withNrwBoth(
        {
          categoryKey: category.key,
          categoryLabel: category.label,
          courseTypeKey: type.key,
          courseTypeLabel: type.label,
          isCategorySum: false,
          occupancyBoth: bothOccupancy({ courseTypeKey: type.key }),
          weiblich: genderYear('weiblich', { courseTypeKey: type.key }),
          maennlich: genderYear('männlich', { courseTypeKey: type.key }),
        },
        bothNrw({ courseTypeKey: type.key }),
      ),
    );

    rows.push(
      ...typeRows,
      withNrwBoth(
        {
          categoryKey: category.key,
          categoryLabel: category.label,
          courseTypeKey: null,
          courseTypeLabel: `Summe ${category.label}`,
          isCategorySum: true,
          occupancyBoth: bothOccupancy(categorySlice),
          weiblich: genderYear('weiblich', categorySlice),
          maennlich: genderYear('männlich', categorySlice),
        },
        bothNrw(categorySlice),
      ),
    );
  }

  const totalSlice = { courseTypeKeys };
  rows.push(
    withNrwBoth(
      {
        categoryKey: '__summe__',
        categoryLabel: 'Summe',
        courseTypeKey: null,
        courseTypeLabel: 'alle Maßnahmen',
        isCategorySum: true,
        occupancyBoth: bothOccupancy(totalSlice),
        weiblich: genderYear('weiblich', totalSlice),
        maennlich: genderYear('männlich', totalSlice),
      },
      bothNrw(totalSlice),
    ),
  );

  return {
    rows,
    labels: {
      current: String(currentYear),
      previous: String(previousYear),
    },
  };
}
