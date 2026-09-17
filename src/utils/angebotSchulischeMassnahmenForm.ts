import { COURSE_CATEGORIES, COURSE_TYPE_BY_KEY, COURSE_TYPES } from '../data/catalog';
import { demoRecords } from '../data/demoData';
import { getJvaById, JVAS } from '../data/jvas';
import type { Jva } from '../types/domain';
import { parseAbsoluteInt } from './elisSchulraeumeForm';
import { formatDate } from './format';
import {
  buildKursangeboteSections,
  rebuildKursangebotRowSpans,
  type KursangebotJvaSection,
  type KursangebotRow,
  type KursangebotTable,
} from './kursangebote';
import { getYearFromPeriod } from './periods';
import type { SchulteilnehmendeAltersgruppe, SchulteilnehmendeGeschlecht } from './schulteilnehmende';

export const ANGEBOT_FORM_YEAR = 2026;
export const ANGEBOT_VORJAHR = 2025;
export const ANGEBOT_BROCHURE_YEAR = 2027;
export const ANGEBOT_DEADLINE = '2026-11-15';
export const ANGEBOT_BASIS_DEADLINE_LABEL = '15.11.2026';
export const ANGEBOT_BROCHURE_PERIOD_LABEL = 'Anfang Juni 2026 bis Ende Mai 2027';

const STORAGE_PREFIX = 'weberfassung_angebot_schulisch_v1_';
const RELEASE_KEY = 'weberfassung_bildungsbroschuere_release_v1';

export type JaNein = 'ja' | 'nein';
export type JaNeinValue = JaNein | '';

export type Durchfuehrungskraft =
  | 'interne-kraft'
  | 'berufskolleg'
  | 'sonstige-externe-fachkraft'
  | 'ehrenamtliche-kraefte'
  | '';

export type BeginnArt = 'auf-anfrage' | 'alle-n-monate' | 'monatsanfang' | 'festes-datum' | '';

export interface Zielgruppe {
  jugendvollzug: boolean;
  erwachsenenvollzug: boolean;
  frauen: boolean;
  maenner: boolean;
}

export interface AngebotGreenSnapshot {
  externeSchule: JaNeinValue;
  zielgruppe: Zielgruppe;
  durationMonths: string;
  sollJahr1: string;
  sollJahr2: string;
  sollJahr3: string;
  durchfuehrung: Durchfuehrungskraft;
  inNaechsterBroschuere: JaNeinValue;
  einstiegFortlaufend: JaNeinValue;
  beginnArt: BeginnArt;
  beginnAlleMonate: string;
  beginnDaten: string[];
  geplanterAbschluss: string;
  abschlussFreitext: string;
  anmerkung: string;
}

export interface AngebotFormRow extends AngebotGreenSnapshot {
  id: string;
  sourceKey: string | null;
  isNew: boolean;
  courseName: string;
  categoryKey: string;
  categoryLabel: string;
  typeKey: string;
  typeLabel: string;
  targetPlaces: string;
  teilnehmendeVorjahr: JaNein;
  durationLocked: boolean;
  abschlussLocked: boolean;
  zielgruppeAgeLocked: boolean;
  zielgruppeGenderLocked: boolean;
  datenKorrekt: JaNeinValue;
  original: AngebotGreenSnapshot | null;
}

export const DURCHFUEHRUNG_OPTIONS: { value: Exclude<Durchfuehrungskraft, ''>; label: string }[] = [
  { value: 'interne-kraft', label: 'interne Kraft' },
  { value: 'berufskolleg', label: 'Berufskolleg' },
  { value: 'sonstige-externe-fachkraft', label: 'sonstige externe Fachkraft' },
  { value: 'ehrenamtliche-kraefte', label: 'ehrenamtliche Kräfte' },
];

export const BEGINN_ART_OPTIONS: { value: Exclude<BeginnArt, ''>; label: string }[] = [
  { value: 'auf-anfrage', label: 'auf Anfrage' },
  { value: 'alle-n-monate', label: 'alle … Monate' },
  { value: 'monatsanfang', label: 'jeweils zum Monatsanfang' },
  { value: 'festes-datum', label: 'festes Datum' },
];

const FIXED_DURATION: Record<string, string> = {
  'SF.1': '3',
  'SF.2': '3',
  'SF.3': '6',
  'VM.1': '6',
  'VM.2': '6',
  'VM.3': '6',
};

const LOCKED_ABSCHLUSS: Record<string, string> = {
  'SA.1': 'ESA bzw. EESA',
  'SA.2': 'MSA',
  'SA.3': 'Hochschulreife',
};

export const SF_VM_ABSCHLUSS_OPTIONS = [
  'Kein Abschluss',
  'Zertifikat A1',
  'Zertifikat A2',
  'Zertifikat B1',
  'Zertifikat B2',
] as const;

export const AB_ABSCHLUSS_OPTIONS = [
  'Kein gesonderter Abschluss',
  'ESA',
  'ESA in Verbindung mit bestandener Berufsausbildung',
  'EESA',
  'EESA in Verbindung mit bestandener Berufsausbildung',
  'MSA',
  'MSA in Verbindung mit bestandener Berufsausbildung',
  'Sonstiges',
] as const;

export type AbschlussGruppe = 'sf-vm' | 'sa' | 'ab' | 'so' | 'hidden';

function nextId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `angebot-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function storageKey(jvaId: string): string {
  return `${STORAGE_PREFIX}${jvaId}`;
}

export function formatJaNein(value: JaNeinValue): string {
  if (value === 'ja') return 'Ja';
  if (value === 'nein') return 'Nein';
  return '—';
}

export function isAngebotDeadlinePassed(now = new Date()): boolean {
  return now.toISOString().slice(0, 10) > ANGEBOT_DEADLINE;
}

export function isStudium(categoryKey: string): boolean {
  return categoryKey === 'ST';
}

export function durationIsLocked(typeKey: string): boolean {
  return Boolean(FIXED_DURATION[typeKey]);
}

export function abschlussGruppe(categoryKey: string, typeKey: string): AbschlussGruppe {
  if (categoryKey === 'ST') return 'hidden';
  if (categoryKey === 'SF' || categoryKey === 'VM') return 'sf-vm';
  if (typeKey in LOCKED_ABSCHLUSS) return 'sa';
  if (categoryKey === 'AB') return 'ab';
  return 'so';
}

export function defaultDuration(typeKey: string): string {
  return FIXED_DURATION[typeKey] ?? '';
}

export function defaultAbschluss(categoryKey: string, typeKey: string): string {
  if (LOCKED_ABSCHLUSS[typeKey]) return LOCKED_ABSCHLUSS[typeKey];
  if (categoryKey === 'SF' || categoryKey === 'VM') return 'Kein Abschluss';
  return '';
}

export function showsGreenQuestions(row: Pick<AngebotFormRow, 'categoryKey' | 'externeSchule'>): boolean {
  return !isStudium(row.categoryKey) && row.externeSchule !== 'ja';
}

export function showsMehrjaehrigeVerteilung(durationMonths: string): boolean {
  const months = parseAbsoluteInt(durationMonths);
  return months != null && months > 12;
}

export function canEditGreen(row: AngebotFormRow): boolean {
  if (isAngebotDeadlinePassed()) return false;
  return row.isNew || row.datenKorrekt === 'nein';
}

export function emptyZielgruppe(): Zielgruppe {
  return {
    jugendvollzug: false,
    erwachsenenvollzug: false,
    frauen: false,
    maenner: false,
  };
}

function zielgruppeFromJva(jva: Jva | undefined): Zielgruppe {
  return {
    jugendvollzug: jva?.altersgruppe === 'Jugendvollzug',
    erwachsenenvollzug: jva?.altersgruppe === 'Erwachsenenvollzug',
    frauen: jva?.geschlecht === 'weiblich',
    maenner: jva?.geschlecht === 'männlich',
  };
}

function snapshotFromRow(row: AngebotGreenSnapshot): AngebotGreenSnapshot {
  return {
    externeSchule: row.externeSchule,
    zielgruppe: { ...row.zielgruppe },
    durationMonths: row.durationMonths,
    sollJahr1: row.sollJahr1,
    sollJahr2: row.sollJahr2,
    sollJahr3: row.sollJahr3,
    durchfuehrung: row.durchfuehrung,
    inNaechsterBroschuere: row.inNaechsterBroschuere,
    einstiegFortlaufend: row.einstiegFortlaufend,
    beginnArt: row.beginnArt,
    beginnAlleMonate: row.beginnAlleMonate,
    beginnDaten: [...row.beginnDaten],
    geplanterAbschluss: row.geplanterAbschluss,
    abschlussFreitext: row.abschlussFreitext,
    anmerkung: row.anmerkung,
  };
}

export function applyDatenKorrekt(row: AngebotFormRow, value: JaNein): AngebotFormRow {
  if (value === 'ja' && row.original) {
    return {
      ...row,
      ...row.original,
      datenKorrekt: 'ja',
    };
  }
  return { ...row, datenKorrekt: value };
}

export function applyExterneSchule(row: AngebotFormRow, value: JaNein): AngebotFormRow {
  if (value !== 'ja') return { ...row, externeSchule: value };
  return {
    ...row,
    externeSchule: 'ja',
    durchfuehrung: '',
    inNaechsterBroschuere: row.inNaechsterBroschuere || 'ja',
    einstiegFortlaufend: '',
    beginnArt: '',
    beginnAlleMonate: '',
    beginnDaten: [],
    sollJahr1: '',
    sollJahr2: '',
    sollJahr3: '',
  };
}

function hadParticipantsLastYear(jvaId: string, typeKey: string): JaNein {
  const found = demoRecords.some(
    (record) =>
      record.jvaId === jvaId &&
      record.courseTypeKey === typeKey &&
      getYearFromPeriod(record.reportingPeriod) === ANGEBOT_VORJAHR &&
      (record.participants ?? 0) > 0,
  );
  return found ? 'ja' : 'nein';
}

function parseStartToBeginn(startLabel: string): Pick<
  AngebotGreenSnapshot,
  'einstiegFortlaufend' | 'beginnArt' | 'beginnDaten'
> {
  if (!startLabel || startLabel === 'fortlaufend') {
    return { einstiegFortlaufend: 'ja', beginnArt: '', beginnDaten: [] };
  }
  const dates = startLabel
    .split(',')
    .map((part) => part.trim())
    .map((part) => {
      const match = part.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (!match) return null;
      return `${match[3]}-${match[2]}-${match[1]}`;
    })
    .filter((value): value is string => Boolean(value));
  if (dates.length > 0) {
    return { einstiegFortlaufend: 'nein', beginnArt: 'festes-datum', beginnDaten: dates };
  }
  return { einstiegFortlaufend: 'nein', beginnArt: 'auf-anfrage', beginnDaten: [] };
}

function durchfuehrungFromExternal(external: boolean): Durchfuehrungskraft {
  return external ? 'sonstige-externe-fachkraft' : 'interne-kraft';
}

export function createEmptyAngebotRow(jvaId: string): AngebotFormRow {
  const jva = getJvaById(jvaId);
  const green: AngebotGreenSnapshot = {
    externeSchule: '',
    zielgruppe: zielgruppeFromJva(jva),
    durationMonths: '',
    sollJahr1: '',
    sollJahr2: '',
    sollJahr3: '',
    durchfuehrung: '',
    inNaechsterBroschuere: 'ja',
    einstiegFortlaufend: '',
    beginnArt: '',
    beginnAlleMonate: '',
    beginnDaten: [],
    geplanterAbschluss: '',
    abschlussFreitext: '',
    anmerkung: '',
  };
  return {
    id: nextId(),
    sourceKey: null,
    isNew: true,
    courseName: '',
    categoryKey: '',
    categoryLabel: '',
    typeKey: '',
    typeLabel: '',
    targetPlaces: '',
    teilnehmendeVorjahr: 'nein',
    durationLocked: false,
    abschlussLocked: false,
    zielgruppeAgeLocked: Boolean(jva && jva.altersgruppe !== 'beides'),
    zielgruppeGenderLocked: Boolean(jva && jva.geschlecht !== 'gemischt'),
    datenKorrekt: '',
    original: null,
    ...green,
  };
}

export function applyCourseType(row: AngebotFormRow, typeKey: string): AngebotFormRow {
  if (!typeKey) {
    return {
      ...row,
      typeKey: '',
      typeLabel: '',
      durationMonths: '',
      durationLocked: false,
      geplanterAbschluss: '',
      abschlussLocked: false,
    };
  }
  const catalog = COURSE_TYPE_BY_KEY[typeKey];
  const category = COURSE_CATEGORIES.find((item) => item.key === catalog?.categoryKey);
  const duration = defaultDuration(typeKey);
  const abschluss = defaultAbschluss(category?.key ?? '', typeKey);
  return {
    ...row,
    typeKey,
    typeLabel: catalog?.label ?? typeKey,
    categoryKey: catalog?.categoryKey ?? '',
    categoryLabel: category?.label ?? '',
    durationMonths: duration,
    durationLocked: durationIsLocked(typeKey),
    geplanterAbschluss: abschluss,
    abschlussLocked: abschlussGruppe(catalog?.categoryKey ?? '', typeKey) === 'sa',
    targetPlaces:
      catalog?.minimumPlacesAdults != null ? String(catalog.minimumPlacesAdults) : row.targetPlaces,
  };
}

interface StoredAngebot {
  version: 1;
  jvaId: string;
  submittedAt: string;
  rows: Array<Omit<AngebotFormRow, 'datenKorrekt'>>;
}

export function loadSubmittedAngebot(jvaId: string): AngebotFormRow[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(jvaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAngebot;
    if (parsed.version !== 1 || parsed.jvaId !== jvaId || !Array.isArray(parsed.rows)) return null;
    return parsed.rows.map((row) => ({
      ...row,
      zielgruppe: { ...emptyZielgruppe(), ...row.zielgruppe },
      beginnDaten: Array.isArray(row.beginnDaten) ? row.beginnDaten : [],
      datenKorrekt: '',
      original: row.original,
    }));
  } catch {
    return null;
  }
}

export function saveSubmittedAngebot(jvaId: string, rows: AngebotFormRow[]): void {
  if (typeof window === 'undefined') return;
  const payload: StoredAngebot = {
    version: 1,
    jvaId,
    submittedAt: new Date().toISOString(),
    rows: rows.map((row) => {
      const { datenKorrekt: _datenKorrekt, ...rest } = row;
      return {
        ...rest,
        original: snapshotFromRow(row),
      };
    }),
  };
  window.sessionStorage.setItem(storageKey(jvaId), JSON.stringify(payload));
}

export function listSubmittedAngebotJvaIds(): string[] {
  if (typeof window === 'undefined') return [];
  return JVAS.filter((jva) => Boolean(window.sessionStorage.getItem(storageKey(jva.id)))).map(
    (jva) => jva.id,
  );
}

export interface BildungsbroschuereRelease {
  at: string;
  year: number;
}

export function getBildungsbroschuereRelease(): BildungsbroschuereRelease | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(RELEASE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BildungsbroschuereRelease;
    if (!parsed?.at || parsed.year !== ANGEBOT_BROCHURE_YEAR) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function releaseBildungsbroschuere(): BildungsbroschuereRelease {
  const entry: BildungsbroschuereRelease = {
    at: new Date().toISOString(),
    year: ANGEBOT_BROCHURE_YEAR,
  };
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(RELEASE_KEY, JSON.stringify(entry));
  }
  return entry;
}

function mergeZielgruppe(
  current: Zielgruppe,
  geschlecht: SchulteilnehmendeGeschlecht,
  altersgruppe: SchulteilnehmendeAltersgruppe,
): Zielgruppe {
  return {
    ...current,
    jugendvollzug: current.jugendvollzug || altersgruppe === 'Jugendvollzug',
    erwachsenenvollzug: current.erwachsenenvollzug || altersgruppe === 'Erwachsenenvollzug',
    frauen: current.frauen || geschlecht === 'weiblich',
    maenner: current.maenner || geschlecht === 'männlich',
  };
}

export function buildAngebotFormRows(jvaId: string): AngebotFormRow[] {
  const submitted = loadSubmittedAngebot(jvaId);
  if (submitted && submitted.length > 0) return submitted;

  const jva = getJvaById(jvaId);
  const current = buildKursangeboteSections(demoRecords, String(ANGEBOT_FORM_YEAR)).find(
    (section) => section.jvaId === jvaId,
  );
  const previous = buildKursangeboteSections(demoRecords, String(ANGEBOT_VORJAHR)).find(
    (section) => section.jvaId === jvaId,
  );
  const previousByKey = new Map<string, KursangebotRow>();
  for (const table of previous?.tables ?? []) {
    for (const row of table.rows) {
      previousByKey.set(`${row.typeKey}|${row.courseName}`, row);
    }
  }

  const grouped = new Map<string, AngebotFormRow>();
  for (const table of current?.tables ?? []) {
    for (const row of table.rows) {
      const key = `${row.typeKey}|${row.courseName}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.zielgruppe = mergeZielgruppe(existing.zielgruppe, table.geschlecht, table.altersgruppe);
        continue;
      }
      const previousRow = previousByKey.get(key);
      const start = parseStartToBeginn(previousRow?.startLabel ?? row.startLabel);
      const duration = durationIsLocked(row.typeKey)
        ? defaultDuration(row.typeKey)
        : previousRow?.durationMonths != null
          ? String(previousRow.durationMonths)
          : row.durationMonths != null
            ? String(row.durationMonths)
            : '';
      const gruppe = abschlussGruppe(row.categoryKey, row.typeKey);
      const abschluss = defaultAbschluss(row.categoryKey, row.typeKey) || previousRow?.intendedQualification || row.intendedQualification;
      const green: AngebotGreenSnapshot = {
        externeSchule: 'nein',
        zielgruppe: mergeZielgruppe(emptyZielgruppe(), table.geschlecht, table.altersgruppe),
        durationMonths: duration,
        sollJahr1: '',
        sollJahr2: '',
        sollJahr3: '',
        durchfuehrung: durchfuehrungFromExternal(previousRow?.externalStaff ?? row.externalStaff),
        inNaechsterBroschuere: 'ja',
        einstiegFortlaufend: start.einstiegFortlaufend,
        beginnArt: start.beginnArt,
        beginnAlleMonate: '',
        beginnDaten: start.beginnDaten,
        geplanterAbschluss: gruppe === 'so' ? '' : abschluss,
        abschlussFreitext: gruppe === 'so' ? abschluss : gruppe === 'ab' && !(AB_ABSCHLUSS_OPTIONS as readonly string[]).includes(abschluss) ? abschluss : '',
        anmerkung: '',
      };
      grouped.set(key, {
        id: nextId(),
        sourceKey: key,
        isNew: false,
        courseName: row.courseName,
        categoryKey: row.categoryKey,
        categoryLabel: row.categoryLabel,
        typeKey: row.typeKey,
        typeLabel: row.typeLabel,
        targetPlaces: row.targetPlaces != null ? String(row.targetPlaces) : '',
        teilnehmendeVorjahr: hadParticipantsLastYear(jvaId, row.typeKey),
        durationLocked: durationIsLocked(row.typeKey),
        abschlussLocked: gruppe === 'sa',
        zielgruppeAgeLocked: Boolean(jva && jva.altersgruppe !== 'beides'),
        zielgruppeGenderLocked: Boolean(jva && jva.geschlecht !== 'gemischt'),
        datenKorrekt: '',
        original: snapshotFromRow(green),
        ...green,
      });
    }
  }

  const rows = [...grouped.values()].sort((a, b) => {
    const category = a.categoryKey.localeCompare(b.categoryKey, 'de');
    if (category !== 0) return category;
    return a.courseName.localeCompare(b.courseName, 'de');
  });
  return rows.length > 0 ? rows : [createEmptyAngebotRow(jvaId)];
}

export function courseTypesForCategory(categoryKey: string) {
  return COURSE_TYPES.filter((item) => item.categoryKey === categoryKey);
}

export function validateAngebotForm(rows: AngebotFormRow[]): { ok: boolean; messages: string[] } {
  const messages: string[] = [];
  if (rows.length === 0) {
    return { ok: false, messages: ['Bitte erfassen Sie mindestens ein Angebot.'] };
  }
  rows.forEach((row, index) => {
    const label = row.courseName.trim() || `Zeile ${index + 1}`;
    const errors: string[] = [];
    if (!row.courseName.trim()) errors.push('Name des Schulkurses fehlt');
    if (!row.categoryKey || !row.typeKey) errors.push('Haupt- und Maßnahmenkategorie fehlen');
    if (!row.isNew && row.datenKorrekt !== 'ja' && row.datenKorrekt !== 'nein') {
      errors.push('Bitte angeben, ob die Daten noch korrekt sind');
    }
    if (row.isNew || row.datenKorrekt === 'nein') {
      if (!isStudium(row.categoryKey) && row.externeSchule !== 'ja' && row.externeSchule !== 'nein') {
        errors.push('Bitte angeben, ob die Maßnahme an einer externen Schule stattfindet');
      }
      if (showsGreenQuestions(row)) {
        const zg = row.zielgruppe;
        if (!zg.jugendvollzug && !zg.erwachsenenvollzug && !zg.frauen && !zg.maenner) {
          errors.push('Bitte die Zielgruppe ankreuzen');
        }
        if (!row.durationLocked && parseAbsoluteInt(row.durationMonths) == null) {
          errors.push('Dauer in Monaten muss eine ganze Zahl sein');
        }
        if (!row.durchfuehrung) errors.push('Durchführungskraft fehlt');
        if (row.inNaechsterBroschuere !== 'ja' && row.inNaechsterBroschuere !== 'nein') {
          errors.push('Bitte angeben, ob die Maßnahme in der nächsten Bildungsbroschüre erscheint');
        }
        if (row.einstiegFortlaufend !== 'ja' && row.einstiegFortlaufend !== 'nein') {
          errors.push('Bitte angeben, ob ein fortlaufender Einstieg möglich ist');
        }
        if (row.einstiegFortlaufend === 'nein') {
          if (!row.beginnArt) errors.push('Bitte den möglichen Beginn angeben');
          if (row.beginnArt === 'alle-n-monate' && parseAbsoluteInt(row.beginnAlleMonate) == null) {
            errors.push('Bitte die Monatsspanne für den Beginn angeben');
          }
          if (row.beginnArt === 'festes-datum' && row.beginnDaten.length === 0) {
            errors.push('Bitte mindestens ein festes Beginndatum auswählen');
          }
        }
        if (showsMehrjaehrigeVerteilung(row.durationMonths)) {
          if (
            parseAbsoluteInt(row.sollJahr1) == null &&
            parseAbsoluteInt(row.sollJahr2) == null &&
            parseAbsoluteInt(row.sollJahr3) == null
          ) {
            errors.push('Bitte die Soll-Plätze auf die Ausbildungsjahre verteilen');
          }
        }
        const gruppe = abschlussGruppe(row.categoryKey, row.typeKey);
        if (gruppe === 'so' && !row.abschlussFreitext.trim()) {
          errors.push('Geplanter Abschluss fehlt');
        }
        if (gruppe === 'ab' && row.geplanterAbschluss === 'Sonstiges' && !row.abschlussFreitext.trim()) {
          errors.push('Bitte den sonstigen geplanten Abschluss eintragen');
        }
        if ((gruppe === 'sf-vm' || gruppe === 'ab') && !row.geplanterAbschluss) {
          errors.push('Geplanter Abschluss fehlt');
        }
      }
    }
    if (errors.length > 0) messages.push(`${label}: ${errors.join('; ')}.`);
  });
  return { ok: messages.length === 0, messages };
}

export function normalizeAngebotRow(row: AngebotFormRow): AngebotFormRow {
  const duration = row.durationLocked ? defaultDuration(row.typeKey) : String(parseAbsoluteInt(row.durationMonths) ?? row.durationMonths).trim();
  return {
    ...row,
    courseName: row.courseName.trim(),
    durationMonths: duration,
    sollJahr1: row.sollJahr1.trim(),
    sollJahr2: row.sollJahr2.trim(),
    sollJahr3: row.sollJahr3.trim(),
    beginnAlleMonate: row.beginnAlleMonate.trim(),
    abschlussFreitext: row.abschlussFreitext.trim(),
    anmerkung: row.anmerkung.trim(),
    geplanterAbschluss: row.abschlussLocked ? defaultAbschluss(row.categoryKey, row.typeKey) : row.geplanterAbschluss,
  };
}

function startLabelFromRow(row: AngebotFormRow): string {
  if (!showsGreenQuestions(row) || row.einstiegFortlaufend === 'ja') return 'fortlaufend';
  if (row.beginnArt === 'auf-anfrage') return 'auf Anfrage';
  if (row.beginnArt === 'monatsanfang') return 'jeweils zum Monatsanfang';
  if (row.beginnArt === 'alle-n-monate') {
    return row.beginnAlleMonate ? `alle ${row.beginnAlleMonate} Monate` : 'auf Anfrage';
  }
  if (row.beginnArt === 'festes-datum' && row.beginnDaten.length > 0) {
    return row.beginnDaten.map((date) => formatDate(date)).join(', ');
  }
  return 'fortlaufend';
}

function qualificationFromRow(row: AngebotFormRow): string {
  if (row.geplanterAbschluss === 'Sonstiges' || abschlussGruppe(row.categoryKey, row.typeKey) === 'so') {
    return row.abschlussFreitext || row.geplanterAbschluss || 'ohne';
  }
  return row.geplanterAbschluss || 'ohne';
}

function matchesTable(row: AngebotFormRow, table: KursangebotTable): boolean {
  const zg = row.zielgruppe;
  if (table.geschlecht === 'männlich' && !zg.maenner) return false;
  if (table.geschlecht === 'weiblich' && !zg.frauen) return false;
  if (table.altersgruppe === 'Jugendvollzug' && !zg.jugendvollzug) return false;
  if (table.altersgruppe === 'Erwachsenenvollzug' && !zg.erwachsenenvollzug) return false;
  return zg.maenner || zg.frauen || zg.jugendvollzug || zg.erwachsenenvollzug;
}

function toKursangebotRow(row: AngebotFormRow, template?: KursangebotRow): KursangebotRow {
  const duration = parseAbsoluteInt(row.durationMonths);
  return {
    categoryKey: row.categoryKey,
    categoryLabel: row.categoryLabel,
    typeKey: row.typeKey,
    typeLabel: row.typeLabel,
    courseName: row.courseName,
    targetPlaces: parseAbsoluteInt(row.targetPlaces) ?? template?.targetPlaces ?? null,
    durationMonths: duration,
    startLabel: startLabelFromRow(row),
    intendedQualification: qualificationFromRow(row),
    externalStaff: Boolean(row.durchfuehrung && row.durchfuehrung !== 'interne-kraft'),
    showCategory: false,
    categorySpan: 1,
    showType: false,
    typeSpan: 1,
    groupStripe: false,
  };
}

function emptyTable(
  jvaId: string,
  jvaName: string,
  geschlecht: SchulteilnehmendeGeschlecht,
  altersgruppe: SchulteilnehmendeAltersgruppe,
): KursangebotTable {
  return {
    key: `${jvaId}-${altersgruppe}-${geschlecht}`,
    jvaId,
    jvaName,
    geschlecht,
    altersgruppe,
    titlePrefix: `Schulisches Bildungsangebot der ${jvaName} für `,
    genderPhrase: geschlecht === 'männlich' ? 'männliche Gefangene' : 'weibliche Gefangene',
    agePhrase: altersgruppe === 'Jugendvollzug' ? 'Jugendvollzug' : 'Erwachsenenvollzug',
    rows: [],
  };
}

function withSpans(rows: KursangebotRow[]): KursangebotRow[] {
  return rebuildKursangebotRowSpans(rows);
}

export function overlayStoredKursangebote(
  sections: KursangebotJvaSection[],
  options?: { requireRelease?: boolean; jvaId?: string },
): KursangebotJvaSection[] {
  if (options?.requireRelease && !getBildungsbroschuereRelease()) return sections;

  return sections
    .filter((section) => !options?.jvaId || section.jvaId === options.jvaId)
    .map((section) => {
      const stored = loadSubmittedAngebot(section.jvaId);
      if (!stored || stored.length === 0) return section;

      const included = stored.filter(
        (row) => row.inNaechsterBroschuere !== 'nein' && row.courseName.trim() && row.typeKey,
      );
      const excluded = new Set(
        stored
          .filter((row) => row.inNaechsterBroschuere === 'nein')
          .map((row) => `${row.typeKey}|${row.courseName}`),
      );
      const byKey = new Map(included.map((row) => [`${row.typeKey}|${row.courseName}`, row]));

      const tables = section.tables.map((table) => {
        const rows = table.rows
          .map((row) => {
            const key = `${row.typeKey}|${row.courseName}`;
            if (excluded.has(key)) return null;
            const formRow = byKey.get(key);
            if (!formRow) return row;
            if (!matchesTable(formRow, table)) return null;
            return toKursangebotRow(formRow, row);
          })
          .filter((row): row is KursangebotRow => row != null);

        for (const formRow of included) {
          if (!formRow.isNew || !matchesTable(formRow, table)) continue;
          const key = `${formRow.typeKey}|${formRow.courseName}`;
          if (rows.some((row) => `${row.typeKey}|${row.courseName}` === key)) continue;
          rows.push(toKursangebotRow(formRow));
        }
        return { ...table, rows: withSpans(rows) };
      });

      const existingKeys = new Set(tables.map((table) => table.key));
      for (const formRow of included.filter((row) => row.isNew)) {
        const genders: SchulteilnehmendeGeschlecht[] = [];
        if (formRow.zielgruppe.maenner) genders.push('männlich');
        if (formRow.zielgruppe.frauen) genders.push('weiblich');
        const ages: SchulteilnehmendeAltersgruppe[] = [];
        if (formRow.zielgruppe.erwachsenenvollzug) ages.push('Erwachsenenvollzug');
        if (formRow.zielgruppe.jugendvollzug) ages.push('Jugendvollzug');
        for (const altersgruppe of ages) {
          for (const geschlecht of genders) {
            const key = `${section.jvaId}-${altersgruppe}-${geschlecht}`;
            if (existingKeys.has(key)) continue;
            tables.push({
              ...emptyTable(section.jvaId, section.jvaName, geschlecht, altersgruppe),
              rows: withSpans([toKursangebotRow(formRow)]),
            });
            existingKeys.add(key);
          }
        }
      }

      return { ...section, tables: tables.filter((table) => table.rows.length > 0) };
    })
    .filter((section) => section.tables.length > 0);
}

export function formatDurchfuehrung(value: Durchfuehrungskraft): string {
  return DURCHFUEHRUNG_OPTIONS.find((item) => item.value === value)?.label ?? '—';
}

export function formatZielgruppe(value: Zielgruppe): string {
  const parts: string[] = [];
  if (value.jugendvollzug) parts.push('Jugendvollzug');
  if (value.erwachsenenvollzug) parts.push('Erwachsenenvollzug');
  if (value.frauen) parts.push('Frauen');
  if (value.maenner) parts.push('Männer');
  return parts.length > 0 ? parts.join(', ') : '—';
}

export function formatBeginn(row: AngebotFormRow): string {
  return startLabelFromRow(row);
}

export const ANGEBOT_HINWEISE = [
  `Die voreingestellten Daten stammen aus BASIS. Sofern die Schulkurse zukünftig nicht mehr in der Tabelle/in der Bildungsbroschüre auftauchen sollen oder die Angaben nicht mehr stimmen, sind sie in BASIS abzuändern bzw. zu löschen. Sofern ein Schulkurs noch nicht stattgefunden hat, jedoch für den kommenden Zeitraum der Bildungsbroschüre stattfinden soll, ist auch hier ein Eintrag erforderlich. Damit dies in der kommenden Bildungsbroschüre berücksichtigt werden kann, sind die Änderungen bis zum ${ANGEBOT_BASIS_DEADLINE_LABEL} in BASIS einzupflegen.`,
  'Die ergänzenden Fragen sind nicht zu beantworten, sofern es sich um schulische Maßnahmen handelt, die der Hauptkategorie Studium zuzuordnen sind.',
  `Die Daten können nur bis zum ${ANGEBOT_BASIS_DEADLINE_LABEL} hier abgeändert werden. Alle Änderungen danach werden nicht mehr in der kommenden Bildungsbroschüre berücksichtigt. Änderungen in BASIS (z. B. Soll-Plätze) fließen weiterhin in den jährlichen Bericht und EVALiS ein.`,
];
