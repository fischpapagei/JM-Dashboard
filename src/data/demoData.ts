import type { EducationMeasureRecord, Kursleitung, Massnahmenbeginn, SchoolRoom } from '../types/domain';
import {
  courseTypes,
  terminationReasons,
  COMPLETION_TYPES,
  COURSE_TYPE_BY_KEY,
  HAFTARTEN,
} from './catalog';
import { JVAS } from './jvas';
import type { JvaOperationalRecord } from '../utils/aggregations';

const REPORTING_PERIODS = ['2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1'] as const;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashJva(jvaId: string): number {
  let h = 0;
  for (let i = 0; i < jvaId.length; i++) h = (h * 31 + jvaId.charCodeAt(i)) >>> 0;
  return h;
}

/** Soll-Plätze aus BASIS-Katalog (Mindest-Soll Erwachsene), Fallback 8. */
function catalogTargetPlaces(courseTypeKey: string): number {
  const ct = COURSE_TYPE_BY_KEY[courseTypeKey];
  return ct?.minimumPlacesAdults ?? 8;
}

function completionTypeForCourse(courseTypeKey: string, rand: () => number): string | null {
  const ct = COURSE_TYPE_BY_KEY[courseTypeKey];
  if (!ct?.hasFormalCompletion) return null;

  const optionsByCategory: Record<string, string[]> = {
    SA: ['ESA', 'EESA', 'MSA', 'HOCHSCHULREIFE'],
    ST: ['BACHELOR_FH', 'BACHELOR_UNI', 'MASTER_FH', 'MASTER_UNI'],
    AB: ['ESA', 'HS10', 'FOR', 'INDIVIDUELL'],
  };
  const pool = optionsByCategory[ct.categoryKey] ?? COMPLETION_TYPES.map((c) => c.key);
  return pool[Math.floor(rand() * pool.length)] ?? null;
}

function pickTermination(rand: () => number, isFormal: boolean): string {
  const pool = isFormal
    ? terminationReasons.filter((r) => r.level1 === 'reguläre Beendigung' || r.key.startsWith('VB'))
    : terminationReasons;
  return pool[Math.floor(rand() * pool.length)].key;
}

function pickHaftart(rand: () => number): string {
  const weights = [0.18, 0.42, 0.12, 0.15, 0.13];
  const r = rand();
  let acc = 0;
  for (let i = 0; i < HAFTARTEN.length; i++) {
    acc += weights[i] ?? 0.1;
    if (r < acc) return HAFTARTEN[i].key;
  }
  return HAFTARTEN[0].key;
}

function pickKursleitung(rand: () => number): Kursleitung {
  return rand() < 0.68 ? 'intern' : 'extern';
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pickMassnahmenbeginn(rand: () => number, reportingPeriod: string): Massnahmenbeginn {
  if (rand() < 0.58) return { type: 'fortlaufend' };

  const match = reportingPeriod.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return { type: 'fortlaufend' };

  const year = Number(match[1]);
  const quarter = Number(match[2]);
  const monthStart = (quarter - 1) * 3 + 1;
  const dateCount = rand() < 0.25 ? 1 : 2 + Math.floor(rand() * 3);
  const dates = new Set<string>();

  while (dates.size < dateCount) {
    const month = monthStart + Math.floor(rand() * 3);
    const day = 1 + Math.floor(rand() * daysInMonth(year, month));
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dates.add(iso);
  }

  return { type: 'stichtag', dates: [...dates].sort() };
}

function jvaOffersCourse(jvaIndex: number, courseIndex: number, rand: () => number): boolean {
  const sizeFactor = 0.55 + (jvaIndex % 5) * 0.08;
  const threshold = sizeFactor + (courseIndex % 7) * 0.04;
  return rand() < Math.min(0.95, threshold + 0.25);
}

const ROOM_PREFIXES = [
  'Unterrichtsraum',
  'Gruppenraum',
  'Werkstattraum',
  'Lernbüro',
  'Computerlernraum',
  'Beratungsraum',
  'Multifunktionsraum',
] as const;

const ROOM_SUFFIXES = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4'] as const;

function buildDemoSchoolRooms(): SchoolRoom[] {
  const rooms: SchoolRoom[] = [];
  let roomCounter = 0;

  for (const jva of JVAS) {
    const rand = seededRandom(hashJva(jva.id) + 99);
    const total = 6 + Math.floor(rand() * 18);
    const elisTotal = 1 + Math.floor(rand() * Math.max(1, total - 1));
    const elisIndices = new Set<number>();

    while (elisIndices.size < elisTotal) {
      elisIndices.add(Math.floor(rand() * total));
    }

    for (let i = 0; i < total; i++) {
      const prefix = ROOM_PREFIXES[i % ROOM_PREFIXES.length];
      const suffix = ROOM_SUFFIXES[Math.floor(i / ROOM_PREFIXES.length) % ROOM_SUFFIXES.length];
      roomCounter += 1;
      rooms.push({
        id: `${jva.id}-room-${roomCounter}`,
        jvaId: jva.id,
        designation: `${prefix} ${suffix}`,
        squareMeters: 24 + Math.floor(rand() * 56),
        isElis: elisIndices.has(i),
      });
    }
  }

  return rooms;
}

export const demoSchoolRooms = buildDemoSchoolRooms();

function schoolRoomCountsForJva(jvaId: string): { schulraeume: number; elisSchulraeume: number } {
  const jvaRooms = demoSchoolRooms.filter((room) => room.jvaId === jvaId);
  return {
    schulraeume: jvaRooms.length,
    elisSchulraeume: jvaRooms.filter((room) => room.isElis).length,
  };
}

export const demoOperational: JvaOperationalRecord[] = JVAS.flatMap((jva, ji) => {
  const rand = seededRandom(hashJva(jva.id) + 7);
  const baseInmates = 180 + Math.floor(rand() * 420);

  return REPORTING_PERIODS.map((reportingPeriod, pi) => {
    const growth = 1 + pi * 0.02;
    const inmates = Math.round(baseInmates * growth);
    const employed = Math.round(inmates * (0.48 + rand() * 0.18));
    const paedStellen = 4 + Math.floor(rand() * 8);
    const { schulraeume, elisSchulraeume } = schoolRoomCountsForJva(jva.id);
    return {
      jvaId: jva.id,
      reportingPeriod,
      totalInmates: inmates,
      employedTotal: employed,
      paedStellen,
      paedBesetzt: Math.max(1, paedStellen - Math.floor(rand() * 2)),
      paedExtern: Math.floor(rand() * 3),
      elisLernplaetze: 2 + Math.floor(rand() * 12),
      elisMandantschaften: 5 + Math.floor(rand() * 25),
      elisDigitaleSozialraeume: 1 + Math.floor(rand() * 6),
      elisHaftraeume: 2 + Math.floor(rand() * 10),
      schulraeume,
      elisSchulraeume,
    };
  });
});

const records: EducationMeasureRecord[] = [];

for (const [ji, jva] of JVAS.entries()) {
  const rand = seededRandom(hashJva(jva.id) + 42);

  for (const [pi, reportingPeriod] of REPORTING_PERIODS.entries()) {
    for (const [ci, ct] of courseTypes.entries()) {
      if (!jvaOffersCourse(ji, ci, rand)) continue;

      const target = catalogTargetPlaces(ct.key);
      const periodFactor = 0.92 + pi * 0.03;
      const occupancy = 0.42 + rand() * 0.48;
      const participants = Math.max(0, Math.round(target * occupancy * periodFactor));

      const targetAchievements = !ct.hasFormalCompletion
        ? Math.round(participants * (0.35 + rand() * 0.35))
        : null;
      const terminations = Math.round(participants * (0.04 + rand() * 0.12));
      const vorzeitigeBeendigungen =
        terminations > 0 ? Math.min(terminations, Math.max(0, Math.round(terminations * (0.2 + rand() * 0.55)))) : 0;
      const regulaereBeendigungen = terminations - vorzeitigeBeendigungen;

      records.push({
        id: `${jva.id}-${ct.key}-${reportingPeriod}`,
        reportingPeriod,
        jvaId: jva.id,
        courseCategoryKey: ct.categoryKey,
        courseTypeKey: ct.key,
        geschlecht: rand() > 0.45 ? 'männlich' : 'weiblich',
        haftform: rand() > 0.38 ? 'geschlossen' : 'offen',
        altersgruppe: rand() > 0.22 ? 'Erwachsenenvollzug' : 'Jugendvollzug',
        haftart: pickHaftart(rand),
        participants,
        targetPlaces: target,
        completions: ct.hasFormalCompletion
          ? Math.round(participants * (0.12 + rand() * 0.22))
          : null,
        targetAchievements,
        terminations,
        regulaereBeendigungen,
        vorzeitigeBeendigungen,
        terminationReasonKey: pickTermination(rand, ct.hasFormalCompletion),
        completionType: completionTypeForCourse(ct.key, rand),
        kursleitung: pickKursleitung(rand),
        massnahmenbeginn: pickMassnahmenbeginn(rand, reportingPeriod),
      });
    }
  }
}

export const demoRecords = records;

export function getDemoRecordCount(): number {
  return demoRecords.length;
}

export function getDemoJvaCount(): number {
  return new Set(demoRecords.map((r) => r.jvaId)).size;
}
