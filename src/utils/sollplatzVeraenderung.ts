import { COURSE_CATEGORIES, COURSE_TYPE_BY_KEY, COURSE_TYPES } from '../data/catalog';
import { JVAS } from '../data/jvas';
import type { EducationMeasureRecord } from '../types/domain';
import {
  formatReportingPeriodDisplay,
  getLastMonthKeyOfQuarter,
  getYearFromPeriod,
  monthToQuarterKey,
} from './periods';

const CATEGORY_ORDER = new Map(COURSE_CATEGORIES.map((category, index) => [category.key, index]));
const TYPE_ORDER = COURSE_TYPES.map((type) => type.key);
const SO_COURSE_NAMES = ['Computerführerschein', 'Bewerbungstraining', 'Lerncoaching'] as const;

export type SollplatzChangeKind = 'unchanged' | 'changed' | 'new';

export interface SollplatzVeraenderungRow {
  key: string;
  jvaId: string;
  jvaName: string;
  showJva: boolean;
  jvaSpan: number;
  categoryKey: string;
  categoryLabel: string;
  typeKey: string;
  typeLabel: string;
  courseName: string;
  previousPlaces: number;
  currentPlaces: number;
  change: number;
  kind: SollplatzChangeKind;
}

export interface SollplatzVeraenderungTable {
  rows: SollplatzVeraenderungRow[];
  totals: {
    previousPlaces: number;
    currentPlaces: number;
    change: number;
  };
  currentMonthKey: string;
  previousMonthKey: string;
  currentMonthLabel: string;
  previousMonthLabel: string;
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function previousMonthKey(monthKey: string): string {
  const year = parseInt(monthKey.slice(0, 4), 10);
  const month = parseInt(monthKey.slice(5, 7), 10);
  if (month > 1) return `${year}-${String(month - 1).padStart(2, '0')}`;
  return `${year - 1}-12`;
}

export function currentMonthFromBerichtszeitpunkt(berichtszeitpunkt: string): string {
  if (/^\d{4}-\d{2}$/.test(berichtszeitpunkt)) return berichtszeitpunkt;
  if (/^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)) return getLastMonthKeyOfQuarter(berichtszeitpunkt);
  const year = getYearFromPeriod(berichtszeitpunkt);
  return `${year}-12`;
}

function instanceCount(typeKey: string, jvaId: string): number {
  if (typeKey === 'SF.1' || typeKey === 'SF.2') {
    return 1 + (hashSeed(`${jvaId}-inst-${typeKey}`) % 3);
  }
  return 1;
}

function instanceName(typeKey: string, jvaId: string, index: number, count: number): string {
  const catalog = COURSE_TYPE_BY_KEY[typeKey];
  if (typeKey === 'SO.1') {
    return SO_COURSE_NAMES[hashSeed(`${jvaId}-so`) % SO_COURSE_NAMES.length] ?? 'Sonstige';
  }
  const base = catalog?.shortLabel ?? catalog?.label ?? typeKey;
  return count > 1 ? `${base} ${index + 1}` : base;
}

function catalogPlaces(typeKey: string, fallback: number): number {
  const catalog = COURSE_TYPE_BY_KEY[typeKey]?.minimumPlacesAdults;
  if (catalog != null && catalog > 0) return catalog;
  return fallback > 0 ? fallback : 8;
}

function offeredTypes(
  records: EducationMeasureRecord[],
  jvaId: string,
  quarterKey: string,
): Map<string, { categoryKey: string; targetPlaces: number }> {
  const result = new Map<string, { categoryKey: string; targetPlaces: number }>();
  for (const record of records) {
    if (record.jvaId !== jvaId || record.reportingPeriod !== quarterKey) continue;
    if ((record.participants ?? 0) <= 0 && (record.targetPlaces ?? 0) <= 0) continue;
    const current = result.get(record.courseTypeKey);
    result.set(record.courseTypeKey, {
      categoryKey: record.courseCategoryKey,
      targetPlaces: (current?.targetPlaces ?? 0) + (record.targetPlaces ?? 0),
    });
  }
  return result;
}

function placesInMonth(
  jvaId: string,
  typeKey: string,
  instanceIndex: number,
  instanceCountValue: number,
  monthKey: string,
  offered: boolean,
  basePlaces: number,
): number {
  if (!offered) return 0;
  const seed = hashSeed(`${jvaId}|${typeKey}|${instanceIndex}|${monthKey}`);
  const month = parseInt(monthKey.slice(5, 7), 10);

  if (instanceCountValue > 1 && instanceIndex === instanceCountValue - 1 && seed % 6 === 0 && month % 2 === 1) {
    return 0;
  }
  if (seed % 17 === 0) return 0;

  let places = basePlaces;
  if (seed % 9 === 0) places = Math.max(1, places - 4);
  if (seed % 11 === 1) places += 4;
  if (seed % 13 === 2) places = Math.max(1, places - 2);
  return places;
}

function changeKind(previousPlaces: number, currentPlaces: number): SollplatzChangeKind {
  if (previousPlaces === 0 && currentPlaces > 0) return 'new';
  if (previousPlaces !== currentPlaces) return 'changed';
  return 'unchanged';
}

function withJvaSpans(rows: SollplatzVeraenderungRow[]): SollplatzVeraenderungRow[] {
  const result = rows.map((row) => ({ ...row, showJva: false, jvaSpan: 1 }));
  let start = 0;
  while (start < result.length) {
    let end = start + 1;
    while (end < result.length && result[end]?.jvaId === result[start]?.jvaId) {
      end += 1;
    }
    const first = result[start];
    if (first) {
      first.showJva = true;
      first.jvaSpan = end - start;
    }
    start = end;
  }
  return result;
}

export function buildSollplatzVeraenderungTable(
  records: EducationMeasureRecord[],
  berichtszeitpunkt: string,
): SollplatzVeraenderungTable {
  const currentMonthKey = currentMonthFromBerichtszeitpunkt(berichtszeitpunkt);
  const prevMonthKey = previousMonthKey(currentMonthKey);
  const currentQuarter = monthToQuarterKey(currentMonthKey);
  const previousQuarter = monthToQuarterKey(prevMonthKey);

  const rows: SollplatzVeraenderungRow[] = [];

  for (const jva of JVAS) {
    const currentOffered = offeredTypes(records, jva.id, currentQuarter);
    const previousOffered = offeredTypes(records, jva.id, previousQuarter);
    const typeKeys = TYPE_ORDER.filter(
      (typeKey) => currentOffered.has(typeKey) || previousOffered.has(typeKey),
    );

    for (const typeKey of typeKeys) {
      const catalog = COURSE_TYPE_BY_KEY[typeKey];
      const categoryKey =
        currentOffered.get(typeKey)?.categoryKey ??
        previousOffered.get(typeKey)?.categoryKey ??
        catalog?.categoryKey ??
        typeKey;
      const category = COURSE_CATEGORIES.find((item) => item.key === categoryKey);
      const count = instanceCount(typeKey, jva.id);
      const base = catalogPlaces(
        typeKey,
        currentOffered.get(typeKey)?.targetPlaces ?? previousOffered.get(typeKey)?.targetPlaces ?? 8,
      );

      for (let index = 0; index < count; index += 1) {
        const previousPlaces = placesInMonth(
          jva.id,
          typeKey,
          index,
          count,
          prevMonthKey,
          previousOffered.has(typeKey),
          base,
        );
        const currentPlaces = placesInMonth(
          jva.id,
          typeKey,
          index,
          count,
          currentMonthKey,
          currentOffered.has(typeKey),
          base,
        );
        if (previousPlaces === 0 && currentPlaces === 0) continue;
        rows.push({
          key: `${jva.id}-${typeKey}-${index}`,
          jvaId: jva.id,
          jvaName: jva.name,
          showJva: false,
          jvaSpan: 1,
          categoryKey,
          categoryLabel: category?.label ?? categoryKey,
          typeKey,
          typeLabel: catalog?.label ?? typeKey,
          courseName: instanceName(typeKey, jva.id, index, count),
          previousPlaces,
          currentPlaces,
          change: currentPlaces - previousPlaces,
          kind: changeKind(previousPlaces, currentPlaces),
        });
      }
    }
  }

  rows.sort((a, b) => {
    const jvaDiff = a.jvaName.localeCompare(b.jvaName, 'de');
    if (jvaDiff !== 0) return jvaDiff;
    const categoryDiff = (CATEGORY_ORDER.get(a.categoryKey) ?? 99) - (CATEGORY_ORDER.get(b.categoryKey) ?? 99);
    if (categoryDiff !== 0) return categoryDiff;
    const typeDiff = a.typeKey.localeCompare(b.typeKey, 'de');
    if (typeDiff !== 0) return typeDiff;
    return a.courseName.localeCompare(b.courseName, 'de');
  });

  const spanned = withJvaSpans(rows);
  const totals = spanned.reduce(
    (acc, row) => ({
      previousPlaces: acc.previousPlaces + row.previousPlaces,
      currentPlaces: acc.currentPlaces + row.currentPlaces,
      change: acc.change + row.change,
    }),
    { previousPlaces: 0, currentPlaces: 0, change: 0 },
  );

  return {
    rows: spanned,
    totals,
    currentMonthKey,
    previousMonthKey: prevMonthKey,
    currentMonthLabel: formatReportingPeriodDisplay(currentMonthKey),
    previousMonthLabel: formatReportingPeriodDisplay(prevMonthKey),
  };
}
