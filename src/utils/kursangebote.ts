import { COMPLETION_TYPES, COURSE_CATEGORIES, COURSE_TYPE_BY_KEY } from '../data/catalog';
import { JVAS } from '../data/jvas';
import type { EducationMeasureRecord, Massnahmenbeginn } from '../types/domain';
import { getAllQuartersInCalendarYear, getCompletedYearAsOf, getYearFromPeriod } from './periods';
import type { SchulteilnehmendeAltersgruppe, SchulteilnehmendeGeschlecht } from './schulteilnehmende';

const CATEGORY_ORDER = new Map(COURSE_CATEGORIES.map((category, index) => [category.key, index]));
const COMPLETION_LABELS = new Map(COMPLETION_TYPES.map((item) => [item.key, item.label]));
const SO_COURSE_NAMES = ['Computerführerschein', 'Bewerbungstraining', 'Lerncoaching'] as const;

const GENDER_ORDER: SchulteilnehmendeGeschlecht[] = ['männlich', 'weiblich'];
const AGE_ORDER: SchulteilnehmendeAltersgruppe[] = ['Erwachsenenvollzug', 'Jugendvollzug'];

export interface KursangebotRow {
  categoryKey: string;
  categoryLabel: string;
  typeKey: string;
  typeLabel: string;
  courseName: string;
  targetPlaces: number | null;
  durationMonths: number | null;
  startLabel: string;
  intendedQualification: string;
  externalStaff: boolean;
  showCategory: boolean;
  categorySpan: number;
  showType: boolean;
  typeSpan: number;
  groupStripe: boolean;
}

export interface KursangebotTable {
  key: string;
  jvaId: string;
  jvaName: string;
  geschlecht: SchulteilnehmendeGeschlecht;
  altersgruppe: SchulteilnehmendeAltersgruppe;
  titlePrefix: string;
  genderPhrase: string;
  agePhrase: string;
  rows: KursangebotRow[];
}

export interface KursangebotJvaSection {
  jvaId: string;
  jvaName: string;
  tables: KursangebotTable[];
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function parseDurationMonths(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const matches = duration.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  return Number(matches[matches.length - 1]);
}

function brochureDurationMonths(typeKey: string, jvaId: string): number | null {
  const catalog = COURSE_TYPE_BY_KEY[typeKey];
  const parsed = parseDurationMonths(catalog?.duration);
  if (typeKey === 'SF.1' && hashSeed(`${jvaId}-${typeKey}`) % 2 === 0) return 12;
  if (parsed != null) return parsed;
  return hashSeed(`${jvaId}-dauer-${typeKey}`) % 5 === 0 ? 12 : null;
}

function formatStart(value: Massnahmenbeginn | null | undefined): string {
  if (!value || value.type === 'fortlaufend') return 'fortlaufend';
  if (value.dates.length === 0) return 'fortlaufend';
  return value.dates
    .map((date) => {
      const [year, month, day] = date.split('-');
      if (!year || !month || !day) return date;
      return `${day}.${month}.${year}`;
    })
    .join(', ');
}

function intendedQualification(typeKey: string, completionType: string | null | undefined): string {
  const catalog = COURSE_TYPE_BY_KEY[typeKey];
  if (!catalog?.hasFormalCompletion) return 'ohne';
  if (completionType) return COMPLETION_LABELS.get(completionType) ?? completionType;
  if (typeKey.startsWith('SA.1')) return 'ESA / EESA';
  if (typeKey.startsWith('SA.2')) return 'MSA';
  if (typeKey.startsWith('SA.3')) return 'Hochschulreife';
  return 'ohne';
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

function targetPlacesForOffering(
  typeKey: string,
  recordPlaces: number | null | undefined,
): number | null {
  const catalogPlaces = COURSE_TYPE_BY_KEY[typeKey]?.minimumPlacesAdults;
  if (catalogPlaces != null && catalogPlaces > 0) return catalogPlaces;
  if (recordPlaces != null && recordPlaces > 0) return recordPlaces;
  return null;
}

function withRowSpans(rows: KursangebotRow[]): KursangebotRow[] {
  const result = rows.map((row) => ({
    ...row,
    showCategory: false,
    categorySpan: 1,
    showType: false,
    typeSpan: 1,
    groupStripe: false,
  }));
  let categoryStart = 0;
  let typeGroupIndex = 0;
  while (categoryStart < result.length) {
    let categoryEnd = categoryStart + 1;
    while (
      categoryEnd < result.length &&
      result[categoryEnd]?.categoryKey === result[categoryStart]?.categoryKey
    ) {
      categoryEnd += 1;
    }
    const firstCategory = result[categoryStart];
    if (firstCategory) {
      firstCategory.showCategory = true;
      firstCategory.categorySpan = categoryEnd - categoryStart;
    }

    let typeStart = categoryStart;
    while (typeStart < categoryEnd) {
      let typeEnd = typeStart + 1;
      while (typeEnd < categoryEnd && result[typeEnd]?.typeKey === result[typeStart]?.typeKey) {
        typeEnd += 1;
      }
      const firstType = result[typeStart];
      if (firstType) {
        firstType.showType = true;
        firstType.typeSpan = typeEnd - typeStart;
      }
      const stripe = typeGroupIndex % 2 === 1;
      for (let index = typeStart; index < typeEnd; index += 1) {
        const row = result[index];
        if (row) row.groupStripe = stripe;
      }
      typeGroupIndex += 1;
      typeStart = typeEnd;
    }
    categoryStart = categoryEnd;
  }
  return result;
}

interface OfferingSnapshot {
  jvaId: string;
  geschlecht: SchulteilnehmendeGeschlecht;
  altersgruppe: SchulteilnehmendeAltersgruppe;
  courseCategoryKey: string;
  courseTypeKey: string;
  reportingPeriod: string;
  targetPlaces: number | null;
  completionType: string | null;
  kursleitung: EducationMeasureRecord['kursleitung'];
  massnahmenbeginn: Massnahmenbeginn | null;
}

function isActiveOffering(record: EducationMeasureRecord): boolean {
  return (record.participants ?? 0) > 0 || (record.targetPlaces ?? 0) > 0;
}

function collectSnapshots(
  records: EducationMeasureRecord[],
  year: number,
): OfferingSnapshot[] {
  const yearPeriods = new Set(getAllQuartersInCalendarYear(year));
  const latest = new Map<string, OfferingSnapshot>();

  for (const record of records) {
    if (!yearPeriods.has(record.reportingPeriod) || !isActiveOffering(record)) continue;
    if (record.geschlecht !== 'männlich' && record.geschlecht !== 'weiblich') continue;
    if (record.altersgruppe !== 'Erwachsenenvollzug' && record.altersgruppe !== 'Jugendvollzug') {
      continue;
    }
    const key = `${record.jvaId}|${record.geschlecht}|${record.altersgruppe}|${record.courseTypeKey}`;
    const existing = latest.get(key);
    if (existing && existing.reportingPeriod >= record.reportingPeriod) continue;
    latest.set(key, {
      jvaId: record.jvaId,
      geschlecht: record.geschlecht,
      altersgruppe: record.altersgruppe,
      courseCategoryKey: record.courseCategoryKey,
      courseTypeKey: record.courseTypeKey,
      reportingPeriod: record.reportingPeriod,
      targetPlaces: record.targetPlaces ?? null,
      completionType: record.completionType ?? null,
      kursleitung: record.kursleitung ?? null,
      massnahmenbeginn: record.massnahmenbeginn ?? null,
    });
  }

  return [...latest.values()];
}

function rowsFromSnapshots(snapshots: OfferingSnapshot[]): KursangebotRow[] {
  const unsorted = snapshots.flatMap((snapshot) => {
    const catalog = COURSE_TYPE_BY_KEY[snapshot.courseTypeKey];
    const category = COURSE_CATEGORIES.find((item) => item.key === snapshot.courseCategoryKey);
    const count = instanceCount(snapshot.courseTypeKey, snapshot.jvaId);
    const places = targetPlacesForOffering(snapshot.courseTypeKey, snapshot.targetPlaces);
    const durationMonths = brochureDurationMonths(snapshot.courseTypeKey, snapshot.jvaId);
    const startLabel = formatStart(snapshot.massnahmenbeginn);
    const qualification = intendedQualification(snapshot.courseTypeKey, snapshot.completionType);
    const externalStaff = snapshot.kursleitung === 'extern';

    return Array.from({ length: count }, (_, index) => ({
      categoryKey: snapshot.courseCategoryKey,
      categoryLabel: category?.label ?? snapshot.courseCategoryKey,
      typeKey: snapshot.courseTypeKey,
      typeLabel: catalog?.label ?? snapshot.courseTypeKey,
      courseName: instanceName(snapshot.courseTypeKey, snapshot.jvaId, index, count),
      targetPlaces: places,
      durationMonths,
      startLabel,
      intendedQualification: qualification,
      externalStaff,
      showCategory: false,
      categorySpan: 1,
      showType: false,
      typeSpan: 1,
      groupStripe: false,
    }));
  });

  unsorted.sort((a, b) => {
    const categoryDiff = (CATEGORY_ORDER.get(a.categoryKey) ?? 99) - (CATEGORY_ORDER.get(b.categoryKey) ?? 99);
    if (categoryDiff !== 0) return categoryDiff;
    const typeDiff = a.typeKey.localeCompare(b.typeKey, 'de');
    if (typeDiff !== 0) return typeDiff;
    return a.courseName.localeCompare(b.courseName, 'de');
  });

  return withRowSpans(unsorted);
}

function genderPhrase(geschlecht: SchulteilnehmendeGeschlecht): string {
  return geschlecht === 'männlich' ? 'männliche Gefangene' : 'weibliche Gefangene';
}

function agePhrase(altersgruppe: SchulteilnehmendeAltersgruppe): string {
  return altersgruppe === 'Jugendvollzug' ? 'Jugendvollzug' : 'Erwachsenenvollzug';
}

export function brochureYearFromBerichtszeitpunkt(berichtszeitpunkt: string): number {
  return (
    getCompletedYearAsOf(berichtszeitpunkt) ??
    (/^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? getYearFromPeriod(berichtszeitpunkt)
      : parseInt(berichtszeitpunkt, 10))
  );
}

export function buildKursangeboteSections(
  records: EducationMeasureRecord[],
  berichtszeitpunkt: string,
): KursangebotJvaSection[] {
  const year = brochureYearFromBerichtszeitpunkt(berichtszeitpunkt);
  const snapshots = collectSnapshots(records, year);
  const byJva = new Map<string, OfferingSnapshot[]>();
  for (const snapshot of snapshots) {
    const list = byJva.get(snapshot.jvaId) ?? [];
    list.push(snapshot);
    byJva.set(snapshot.jvaId, list);
  }

  return JVAS.flatMap((jva) => {
    const jvaSnapshots = byJva.get(jva.id) ?? [];
    const tables = AGE_ORDER.flatMap((altersgruppe) => {
      if (jva.altersgruppe !== 'beides' && jva.altersgruppe !== altersgruppe) return [];
      return GENDER_ORDER.flatMap((geschlecht) => {
        if (jva.geschlecht !== 'gemischt' && jva.geschlecht !== geschlecht) return [];
        const rows = rowsFromSnapshots(
          jvaSnapshots.filter(
            (item) => item.geschlecht === geschlecht && item.altersgruppe === altersgruppe,
          ),
        );
        if (rows.length === 0) return [];
        return [
          {
            key: `${jva.id}-${altersgruppe}-${geschlecht}`,
            jvaId: jva.id,
            jvaName: jva.name,
            geschlecht,
            altersgruppe,
            titlePrefix: `Schulisches Bildungsangebot der ${jva.name} für `,
            genderPhrase: genderPhrase(geschlecht),
            agePhrase: agePhrase(altersgruppe),
            rows,
          },
        ];
      });
    });
    if (tables.length === 0) return [];
    return [{ jvaId: jva.id, jvaName: jva.name, tables }];
  });
}
