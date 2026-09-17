import { demoSchoolRooms } from '../data/demoData';
import { formatElisStand, getElisLastChange, recordElisChange } from './elisLastChange';
import { getJvaById, JVAS } from '../data/jvas';
import type { SchoolRoom } from '../types/domain';

export type JaNein = 'ja' | 'nein';
export type JaNeinValue = JaNein | '';
export type ElisFormMode = 'erstfassung' | 'folgepruefung';
export type ElisRowStatus = 'neu' | 'korrigiert' | 'unverändert';

export const ELIS_FORM_ERFASSUNGSJAHR = 2026;
export const ELIS_FORM_VORJAHR = 2025;

const STORAGE_PREFIX = 'weberfassung_elis_schulraeume_v1_';

export interface ElisSchulraumSnapshot {
  designation: string;
  squareMeters: string;
  elisVorhanden: JaNeinValue;
  schulplaetze: string;
  pcPlaetzeElis: string;
  anmerkung: string;
}

export interface ElisSchulraumFormRow extends ElisSchulraumSnapshot {
  id: string;
  sourceId: string | null;
  datenKorrekt: JaNeinValue;
  original: ElisSchulraumSnapshot | null;
}

export interface ElisFormValidation {
  ok: boolean;
  messages: string[];
}

interface StoredElisSubmission {
  version: 1;
  jvaId: string;
  year: number;
  submittedAt: string;
  rows: Array<ElisSchulraumSnapshot & { id: string; sourceId: string | null }>;
}

function nextRowId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `elis-row-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

export function snapshotFromRow(row: ElisSchulraumSnapshot): ElisSchulraumSnapshot {
  return {
    designation: row.designation,
    squareMeters: row.squareMeters,
    elisVorhanden: row.elisVorhanden,
    schulplaetze: row.schulplaetze,
    pcPlaetzeElis: row.pcPlaetzeElis,
    anmerkung: row.anmerkung,
  };
}

export function isNewElisRow(row: ElisSchulraumFormRow): boolean {
  return row.original == null;
}

export function canEditElisRow(mode: ElisFormMode, row: ElisSchulraumFormRow): boolean {
  if (mode === 'erstfassung') return true;
  if (isNewElisRow(row)) return true;
  return row.datenKorrekt === 'nein';
}

export function createEmptyElisRow(): ElisSchulraumFormRow {
  return {
    id: nextRowId(),
    sourceId: null,
    designation: '',
    squareMeters: '',
    elisVorhanden: '',
    schulplaetze: '',
    pcPlaetzeElis: '',
    anmerkung: '',
    datenKorrekt: '',
    original: null,
  };
}

export function formatDecimal2(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseDecimal2(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, '');
  if (!trimmed) return null;
  const normalized =
    trimmed.includes(',') && trimmed.includes('.')
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function parseAbsoluteInt(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, '');
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function formatJaNein(value: JaNeinValue): string {
  if (value === 'ja') return 'Ja';
  if (value === 'nein') return 'Nein';
  return '—';
}

export function elisRowStatus(row: ElisSchulraumFormRow): ElisRowStatus {
  if (isNewElisRow(row)) return 'neu';
  const current = snapshotFromRow(row);
  const original = row.original;
  if (!original) return 'neu';
  const unchanged =
    current.designation === original.designation &&
    current.squareMeters === original.squareMeters &&
    current.elisVorhanden === original.elisVorhanden &&
    current.schulplaetze === original.schulplaetze &&
    current.pcPlaetzeElis === original.pcPlaetzeElis &&
    current.anmerkung === original.anmerkung;
  return unchanged ? 'unverändert' : 'korrigiert';
}

export function elisRowStatusLabel(status: ElisRowStatus): string {
  if (status === 'neu') return 'Neu';
  if (status === 'korrigiert') return 'Korrigiert';
  return 'Unverändert';
}

function rowFromSchoolRoom(room: SchoolRoom): ElisSchulraumFormRow {
  const snapshot: ElisSchulraumSnapshot = {
    designation: room.designation,
    squareMeters: formatDecimal2(room.squareMeters),
    elisVorhanden: room.isElis ? 'ja' : 'nein',
    schulplaetze: String(room.schoolSeats),
    pcPlaetzeElis: room.isElis ? String(room.schoolSeats + 1) : '0',
    anmerkung: '',
  };
  return {
    id: room.id,
    sourceId: room.id,
    ...snapshot,
    datenKorrekt: '',
    original: snapshot,
  };
}

function rowFromStored(entry: StoredElisSubmission['rows'][number]): ElisSchulraumFormRow {
  const snapshot = snapshotFromRow(entry);
  return {
    id: entry.id,
    sourceId: entry.sourceId ?? entry.id,
    ...snapshot,
    datenKorrekt: '',
    original: snapshot,
  };
}

export function applyElisVorhanden(row: ElisSchulraumFormRow, value: JaNein): ElisSchulraumFormRow {
  return {
    ...row,
    elisVorhanden: value,
    pcPlaetzeElis: value === 'nein' ? '0' : row.pcPlaetzeElis,
  };
}

export function applyDatenKorrekt(row: ElisSchulraumFormRow, value: JaNein): ElisSchulraumFormRow {
  if (value === 'ja' && row.original) {
    return {
      ...row,
      ...row.original,
      datenKorrekt: 'ja',
    };
  }
  return { ...row, datenKorrekt: value };
}

export function normalizeElisRowForSubmit(row: ElisSchulraumFormRow): ElisSchulraumFormRow {
  const qm = parseDecimal2(row.squareMeters);
  const elisVorhanden = row.elisVorhanden === 'ja' ? 'ja' : 'nein';
  const pc =
    elisVorhanden === 'nein' ? '0' : String(parseAbsoluteInt(row.pcPlaetzeElis) ?? 0);
  return {
    ...row,
    designation: row.designation.trim(),
    squareMeters: qm == null ? row.squareMeters : formatDecimal2(qm),
    elisVorhanden,
    schulplaetze: String(parseAbsoluteInt(row.schulplaetze) ?? 0),
    pcPlaetzeElis: pc,
    anmerkung: row.anmerkung.trim(),
  };
}

export function validateElisForm(mode: ElisFormMode, rows: ElisSchulraumFormRow[]): ElisFormValidation {
  const messages: string[] = [];

  if (rows.length === 0) {
    return { ok: false, messages: ['Bitte erfassen Sie mindestens einen Schulraum.'] };
  }

  rows.forEach((row, index) => {
    const label = row.designation.trim() || `Zeile ${index + 1}`;
    const errors: string[] = [];

    if (!row.designation.trim()) {
      errors.push('Raumbezeichnung fehlt');
    }
    if (parseDecimal2(row.squareMeters) == null) {
      errors.push('Größe in qm muss eine Dezimalzahl mit zwei Nachkommastellen sein');
    }
    if (row.elisVorhanden !== 'ja' && row.elisVorhanden !== 'nein') {
      errors.push('eLis vorhanden? bitte mit Ja oder Nein angeben');
    }
    if (parseAbsoluteInt(row.schulplaetze) == null) {
      errors.push('Anzahl Schulplätze muss eine ganze Zahl sein');
    }
    if (row.elisVorhanden === 'ja' && parseAbsoluteInt(row.pcPlaetzeElis) == null) {
      errors.push('Anzahl PC-Plätze eLis muss eine ganze Zahl sein');
    }
    if (mode === 'folgepruefung' && !isNewElisRow(row) && row.datenKorrekt !== 'ja' && row.datenKorrekt !== 'nein') {
      errors.push('Bitte angeben, ob die Daten noch korrekt sind');
    }

    if (errors.length > 0) {
      messages.push(`${label}: ${errors.join('; ')}.`);
    }
  });

  return { ok: messages.length === 0, messages };
}

function storageKey(jvaId: string): string {
  return `${STORAGE_PREFIX}${jvaId}`;
}

export function loadSubmittedElisRooms(jvaId: string): ElisSchulraumFormRow[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(jvaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredElisSubmission;
    if (parsed.version !== 1 || parsed.jvaId !== jvaId || !Array.isArray(parsed.rows)) {
      return null;
    }
    return parsed.rows.map(rowFromStored);
  } catch {
    return null;
  }
}

export function saveSubmittedElisRooms(jvaId: string, rows: ElisSchulraumFormRow[]): void {
  if (typeof window === 'undefined') return;
  const payload: StoredElisSubmission = {
    version: 1,
    jvaId,
    year: ELIS_FORM_ERFASSUNGSJAHR,
    submittedAt: new Date().toISOString(),
    rows: rows.map((row) => ({
      id: row.id,
      sourceId: row.sourceId,
      ...snapshotFromRow(row),
    })),
  };
  window.sessionStorage.setItem(storageKey(jvaId), JSON.stringify(payload));
  recordElisChange('schulraeume', jvaId);
}

export function buildElisFormRows(mode: ElisFormMode, jvaId: string): ElisSchulraumFormRow[] {
  if (mode === 'erstfassung') {
    return [createEmptyElisRow()];
  }

  const submitted = loadSubmittedElisRooms(jvaId);
  if (submitted && submitted.length > 0) {
    return submitted;
  }

  const previous = demoSchoolRooms
    .filter((room) => room.jvaId === jvaId)
    .slice()
    .sort((a, b) => a.designation.localeCompare(b.designation, 'de-DE'))
    .map(rowFromSchoolRoom);

  return previous.length > 0 ? previous : [createEmptyElisRow()];
}

export function elisFormJvaLabel(jvaId: string): string {
  return getJvaById(jvaId)?.name ?? jvaId;
}

export function overlayStoredSchulraeume(rooms: SchoolRoom[]): SchoolRoom[] {
  const byJva = new Map<string, SchoolRoom[]>();
  for (const room of rooms) {
    const list = byJva.get(room.jvaId) ?? [];
    list.push(room);
    byJva.set(room.jvaId, list);
  }

  const result: SchoolRoom[] = [];
  for (const jva of [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de'))) {
    const stored = loadSubmittedElisRooms(jva.id);
    if (stored && stored.length > 0) {
      result.push(
        ...stored.map((row) => ({
          id: row.id,
          jvaId: jva.id,
          designation: row.designation,
          roomCount: 1,
          squareMeters: parseDecimal2(row.squareMeters) ?? 0,
          isElis: row.elisVorhanden === 'ja',
          schoolSeats: parseAbsoluteInt(row.schulplaetze) ?? 0,
        })),
      );
      continue;
    }
    result.push(...(byJva.get(jva.id) ?? []));
  }
  return result;
}

export function schulraeumeStandLabel(): string | null {
  const change = getElisLastChange();
  return change ? formatElisStand(change.at) : null;
}
