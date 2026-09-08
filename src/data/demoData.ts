import type { EducationMeasureRecord, Kursleitung, Massnahmenbeginn, SchoolRoom } from '../types/domain';
import {
  courseTypes,
  terminationReasons,
  COMPLETION_TYPES,
  COURSE_TYPE_BY_KEY,
  HAFTARTEN,
  TERMINATION_REASON_BY_KEY,
} from './catalog';
import { JVAS } from './jvas';
import type { JvaOperationalRecord } from '../utils/aggregations';
import { DEMO_HISTORY_QUARTERS, getYearFromPeriod, REPORTING_PERIODS } from '../utils/periods';

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

const DISCIPLINE_FREE_TEXTS = [
  'Beleidigung des Lehrpersonals',
  'Tätlicher Angriff',
  'Wiederholte Unterrichtsstörung',
  'Sachbeschädigung im Unterrichtsraum',
];
const OTHER_FREE_TEXTS = [
  'Vollzugsplanänderung',
  'Sicherheitslage der Anstalt',
  'Anordnung der Anstaltsleitung',
];

function pickTerminationFreeText(reasonKey: string, rand: () => number): string | null {
  const reason = TERMINATION_REASON_BY_KEY[reasonKey];
  if (reasonKey === 'VB-01' && rand() < 0.8) {
    return DISCIPLINE_FREE_TEXTS[Math.floor(rand() * DISCIPLINE_FREE_TEXTS.length)] ?? null;
  }
  if ((reason?.requiresFreeTextInBasis || reasonKey === 'VB-08') && rand() < 0.55) {
    return OTHER_FREE_TEXTS[Math.floor(rand() * OTHER_FREE_TEXTS.length)] ?? null;
  }
  return null;
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

const GENDER_KEYS = ['männlich', 'weiblich'] as const;
const AGE_GROUP_KEYS = ['Erwachsenenvollzug', 'Jugendvollzug'] as const;
const GENDER_SHARE: Record<(typeof GENDER_KEYS)[number], number> = {
  männlich: 0.72,
  weiblich: 0.28,
};
const AGE_SHARE: Record<(typeof AGE_GROUP_KEYS)[number], number> = {
  Erwachsenenvollzug: 0.84,
  Jugendvollzug: 0.16,
};

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
      const roomCount = rand() > 0.82 ? 2 : 1;
      roomCounter += 1;
      rooms.push({
        id: `${jva.id}-room-${roomCounter}`,
        jvaId: jva.id,
        designation: `${prefix} ${suffix}`,
        roomCount,
        squareMeters: 24 + Math.floor(rand() * 56),
        isElis: elisIndices.has(i),
        schoolSeats: roomCount * (6 + Math.floor(rand() * 10)),
      });
    }
  }

  return rooms;
}

export const demoSchoolRooms = buildDemoSchoolRooms();

function schoolRoomCountsForJva(jvaId: string): { schulraeume: number; elisSchulraeume: number } {
  const jvaRooms = demoSchoolRooms.filter((room) => room.jvaId === jvaId);
  return {
    schulraeume: jvaRooms.reduce((sum, room) => sum + room.roomCount, 0),
    elisSchulraeume: jvaRooms
      .filter((room) => room.isElis)
      .reduce((sum, room) => sum + room.roomCount, 0),
  };
}

export const demoOperational: JvaOperationalRecord[] = JVAS.flatMap((jva, ji) => {
  const rand = seededRandom(hashJva(jva.id) + 7);
  const baseInmates = 180 + Math.floor(rand() * 420);

  return REPORTING_PERIODS.map((reportingPeriod, pi) => {
    const growth = 1 + pi * 0.02;
    const inmates = Math.round(baseInmates * growth);
    const employed = Math.round(inmates * (0.48 + rand() * 0.18));
    const belegbareHaftplaetze = Math.round(inmates / (0.78 + rand() * 0.17));
    const paedStellen = 4 + Math.floor(rand() * 8);
    const { schulraeume, elisSchulraeume } = schoolRoomCountsForJva(jva.id);
    return {
      jvaId: jva.id,
      reportingPeriod,
      totalInmates: inmates,
      employedTotal: employed,
      belegbareHaftplaetze,
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
  const offeredCourseIndexes = courseTypes
    .map((ct, ci) => (jvaOffersCourse(ji, ci, rand) ? ci : -1))
    .filter((ci) => ci >= 0);

  for (const [pi, reportingPeriod] of DEMO_HISTORY_QUARTERS.entries()) {
    const year = getYearFromPeriod(reportingPeriod);
    const historyFactor = 0.52 + ((year - 2015) / 11) * 0.48;
    const quarterWave = 0.94 + (pi % 4) * 0.02;

    for (const ci of offeredCourseIndexes) {
      const ct = courseTypes[ci];
      const target = catalogTargetPlaces(ct.key);
      const occupancy = 0.42 + rand() * 0.48;
      const baseParticipants = Math.max(0, Math.round(target * occupancy * historyFactor * quarterWave));
      const haftform = rand() > 0.38 ? 'geschlossen' : 'offen';
      const haftart = pickHaftart(rand);
      const kursleitung = pickKursleitung(rand);
      const massnahmenbeginn = pickMassnahmenbeginn(rand, reportingPeriod);
      const terminationReasonKey = pickTermination(rand, ct.hasFormalCompletion);
      const completionType = completionTypeForCourse(ct.key, rand);

      for (const altersgruppe of AGE_GROUP_KEYS) {
        for (const geschlecht of GENDER_KEYS) {
          const share = AGE_SHARE[altersgruppe] * GENDER_SHARE[geschlecht];
          const participants = Math.max(0, Math.round(baseParticipants * share));
          const sliceTarget = Math.max(1, Math.round(target * share));
          const targetAchievements = !ct.hasFormalCompletion
            ? Math.round(participants * (0.35 + rand() * 0.35))
            : null;
          const terminations = Math.round(participants * (0.04 + rand() * 0.12));
          const vorzeitigeBeendigungen =
            terminations > 0
              ? Math.min(terminations, Math.max(0, Math.round(terminations * (0.2 + rand() * 0.55))))
              : 0;
          const regulaereBeendigungen = terminations - vorzeitigeBeendigungen;

          records.push({
            id: `${jva.id}-${ct.key}-${reportingPeriod}-${geschlecht}-${altersgruppe}`,
            reportingPeriod,
            jvaId: jva.id,
            courseCategoryKey: ct.categoryKey,
            courseTypeKey: ct.key,
            geschlecht,
            haftform,
            altersgruppe,
            haftart,
            participants,
            targetPlaces: sliceTarget,
            completions: ct.hasFormalCompletion
              ? Math.round(participants * (0.12 + rand() * 0.22))
              : null,
            targetAchievements,
            terminations,
            regulaereBeendigungen,
            vorzeitigeBeendigungen,
            terminationReasonKey,
            terminationFreeText: pickTerminationFreeText(terminationReasonKey, rand),
            completionType,
            kursleitung,
            massnahmenbeginn,
          });
        }
      }
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
