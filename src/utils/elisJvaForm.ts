import { demoOperational } from '../data/demoData';
import { getJvaById, JVAS } from '../data/jvas';
import {
  buildElisAnsprechpersonenTable,
  type ElisAnsprechpersonenRow,
  type ElisAnsprechpersonenTable,
  type ElisSicherheitsrahmenKey,
  type ElisSicherheitspartnerKey,
} from './elisAnsprechpersonen';
import { formatElisStand, getElisLastChange, recordElisChange, type ElisChangeSource } from './elisLastChange';
import {
  ELIS_FORM_ERFASSUNGSJAHR,
  type ElisFormMode,
  type JaNein,
  type JaNeinValue,
} from './elisSchulraeumeForm';

const STORAGE_PREFIX = 'weberfassung_elis_jva_v1_';
const DEMO_PERIOD = '2026-Q1';

export interface ElisJvaSnapshot {
  jvaLabel: string;
  rektor: string;
  sicherheitsrahmen: Record<ElisSicherheitsrahmenKey, string>;
  ansprechpartner: Record<ElisSicherheitspartnerKey, string>;
  anmerkung: string;
}

export interface ElisJvaFormRow extends ElisJvaSnapshot {
  id: string;
  sourceId: string | null;
  datenKorrekt: JaNeinValue;
  original: ElisJvaSnapshot | null;
}

export type ElisJvaRowStatus = 'neu' | 'korrigiert' | 'unverändert';

interface StoredElisJvaSubmission {
  version: 1;
  jvaId: string;
  year: number;
  submittedAt: string;
  rows: Array<ElisJvaSnapshot & { id: string; sourceId: string | null }>;
}

export function emptySicherheitsrahmen(): Record<ElisSicherheitsrahmenKey, string> {
  return { alVl: '', paedD: '', technisch: '', sonstige: '' };
}

export function emptyAnsprechpartner(): Record<ElisSicherheitspartnerKey, string> {
  return { alVl: '', paedD: '', paedVertreter: '', technisch: '', sonstige: '' };
}

export function snapshotFromJvaRow(row: ElisJvaSnapshot): ElisJvaSnapshot {
  return {
    jvaLabel: row.jvaLabel,
    rektor: row.rektor,
    sicherheitsrahmen: { ...row.sicherheitsrahmen },
    ansprechpartner: { ...row.ansprechpartner },
    anmerkung: row.anmerkung,
  };
}

export function isNewElisJvaRow(row: ElisJvaFormRow): boolean {
  return row.original == null;
}

export function canEditElisJvaRow(mode: ElisFormMode, row: ElisJvaFormRow): boolean {
  if (mode === 'erstfassung') return true;
  if (isNewElisJvaRow(row)) return true;
  return row.datenKorrekt === 'nein';
}

export function applyElisJvaDatenKorrekt(row: ElisJvaFormRow, value: JaNein): ElisJvaFormRow {
  if (value === 'ja' && row.original) {
    return {
      ...row,
      ...snapshotFromJvaRow(row.original),
      datenKorrekt: 'ja',
    };
  }
  return { ...row, datenKorrekt: value };
}

function snapshotsEqual(a: ElisJvaSnapshot, b: ElisJvaSnapshot): boolean {
  return (
    a.jvaLabel === b.jvaLabel &&
    a.rektor === b.rektor &&
    a.anmerkung === b.anmerkung &&
    a.sicherheitsrahmen.alVl === b.sicherheitsrahmen.alVl &&
    a.sicherheitsrahmen.paedD === b.sicherheitsrahmen.paedD &&
    a.sicherheitsrahmen.technisch === b.sicherheitsrahmen.technisch &&
    a.sicherheitsrahmen.sonstige === b.sicherheitsrahmen.sonstige &&
    a.ansprechpartner.alVl === b.ansprechpartner.alVl &&
    a.ansprechpartner.paedD === b.ansprechpartner.paedD &&
    a.ansprechpartner.paedVertreter === b.ansprechpartner.paedVertreter &&
    a.ansprechpartner.technisch === b.ansprechpartner.technisch &&
    a.ansprechpartner.sonstige === b.ansprechpartner.sonstige
  );
}

export function elisJvaRowStatus(row: ElisJvaFormRow): ElisJvaRowStatus {
  if (isNewElisJvaRow(row) || !row.original) return 'neu';
  return snapshotsEqual(snapshotFromJvaRow(row), row.original) ? 'unverändert' : 'korrigiert';
}

export function elisJvaRowStatusLabel(status: ElisJvaRowStatus): string {
  if (status === 'neu') return 'Neu';
  if (status === 'korrigiert') return 'Korrigiert';
  return 'Unverändert';
}

export function normalizeElisJvaRow(row: ElisJvaFormRow): ElisJvaFormRow {
  return {
    ...row,
    rektor: row.rektor.trim(),
    anmerkung: row.anmerkung.trim(),
    sicherheitsrahmen: {
      alVl: row.sicherheitsrahmen.alVl.trim(),
      paedD: row.sicherheitsrahmen.paedD.trim(),
      technisch: row.sicherheitsrahmen.technisch.trim(),
      sonstige: row.sicherheitsrahmen.sonstige.trim(),
    },
    ansprechpartner: {
      alVl: row.ansprechpartner.alVl.trim(),
      paedD: row.ansprechpartner.paedD.trim(),
      paedVertreter: row.ansprechpartner.paedVertreter.trim(),
      technisch: row.ansprechpartner.technisch.trim(),
      sonstige: row.ansprechpartner.sonstige.trim(),
    },
  };
}

export function validateElisJvaForm(mode: ElisFormMode, rows: ElisJvaFormRow[]): {
  ok: boolean;
  messages: string[];
} {
  const messages: string[] = [];
  if (rows.length === 0) {
    return { ok: false, messages: ['Es liegt keine Zeile für die Anstalt vor.'] };
  }

  rows.forEach((row, index) => {
    const label = row.jvaLabel || `Zeile ${index + 1}`;
    const errors: string[] = [];
    if (!row.rektor.trim()) {
      errors.push('Name der Rektorin/des Rektors fehlt');
    }
    if (mode === 'folgepruefung' && !isNewElisJvaRow(row) && row.datenKorrekt !== 'ja' && row.datenKorrekt !== 'nein') {
      errors.push('Bitte angeben, ob die Daten noch korrekt sind');
    }
    if (errors.length > 0) {
      messages.push(`${label}: ${errors.join('; ')}.`);
    }
  });

  return { ok: messages.length === 0, messages };
}

function emptyRow(jvaLabel: string, id: string): ElisJvaFormRow {
  return {
    id,
    sourceId: null,
    jvaLabel,
    rektor: '',
    sicherheitsrahmen: emptySicherheitsrahmen(),
    ansprechpartner: emptyAnsprechpartner(),
    anmerkung: '',
    datenKorrekt: '',
    original: null,
  };
}

function defaultLabels(jvaId: string): string[] {
  const jva = getJvaById(jvaId);
  const name = (jva?.name ?? jvaId).replace(/^JVA\s+/, '');
  if (!jva) return [name];
  if (jva.haftform === 'offen') return [`${name} (oV)`];
  if (jva.haftform === 'geschlossen') return [`${name} (gV)`];
  return [`${name} (gV)`, `${name} (oV)`];
}

function rowFromStored(entry: StoredElisJvaSubmission['rows'][number]): ElisJvaFormRow {
  const snapshot = snapshotFromJvaRow(entry);
  return {
    id: entry.id,
    sourceId: entry.sourceId ?? entry.id,
    ...snapshot,
    datenKorrekt: '',
    original: snapshot,
  };
}

function storageKey(jvaId: string): string {
  return `${STORAGE_PREFIX}${jvaId}`;
}

export function loadSubmittedElisJvaRows(jvaId: string): ElisJvaFormRow[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(jvaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredElisJvaSubmission;
    if (parsed.version !== 1 || parsed.jvaId !== jvaId || !Array.isArray(parsed.rows)) {
      return null;
    }
    return parsed.rows.map(rowFromStored);
  } catch {
    return null;
  }
}

export function saveSubmittedElisJvaRows(
  jvaId: string,
  rows: ElisJvaFormRow[],
  source: ElisChangeSource = 'jva-kontakte',
): void {
  if (typeof window === 'undefined') return;
  const payload: StoredElisJvaSubmission = {
    version: 1,
    jvaId,
    year: ELIS_FORM_ERFASSUNGSJAHR,
    submittedAt: new Date().toISOString(),
    rows: rows.map((row) => ({
      id: row.id,
      sourceId: row.sourceId,
      ...snapshotFromJvaRow(row),
    })),
  };
  window.sessionStorage.setItem(storageKey(jvaId), JSON.stringify(payload));
  recordElisChange(source, jvaId);
}

export function buildElisJvaFormRows(mode: ElisFormMode, jvaId: string): ElisJvaFormRow[] {
  if (mode === 'erstfassung') {
    return defaultLabels(jvaId).map((label, index) => emptyRow(label, `${jvaId}-neu-${index}`));
  }

  const submitted = loadSubmittedElisJvaRows(jvaId);
  if (submitted && submitted.length > 0) return submitted;

  const table = buildElisAnsprechpersonenTable(demoOperational, DEMO_PERIOD);
  const previous = (table?.rows ?? [])
    .filter((row) => row.jvaId === jvaId)
    .map((row) => {
      const snapshot: ElisJvaSnapshot = {
        jvaLabel: row.jvaLabel,
        rektor: row.rektor,
        sicherheitsrahmen: { ...row.sicherheitsrahmen },
        ansprechpartner: { ...row.sicherheitspartner },
        anmerkung: row.anmerkungen,
      };
      return {
        id: row.key,
        sourceId: row.key,
        ...snapshot,
        datenKorrekt: '' as JaNeinValue,
        original: snapshot,
      };
    });

  return previous.length > 0
    ? previous
    : defaultLabels(jvaId).map((label, index) => emptyRow(label, `${jvaId}-leer-${index}`));
}

export function overlayStoredAnsprechpersonen(table: ElisAnsprechpersonenTable): ElisAnsprechpersonenTable {
  const change = getElisLastChange();
  const standLabel = change ? formatElisStand(change.at) : table.standLabel;
  const byJva = new Map<string, ElisAnsprechpersonenRow[]>();
  for (const row of table.rows) {
    const list = byJva.get(row.jvaId) ?? [];
    list.push(row);
    byJva.set(row.jvaId, list);
  }

  const rows: ElisAnsprechpersonenRow[] = [];
  for (const jva of [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de'))) {
    const stored = loadSubmittedElisJvaRows(jva.id);
    if (stored && stored.length > 0) {
      rows.push(
        ...stored.map((row) => ({
          key: row.id,
          jvaId: jva.id,
          jvaLabel: row.jvaLabel,
          rektor: row.rektor,
          sicherheitsrahmen: { ...row.sicherheitsrahmen },
          sicherheitspartner: { ...row.ansprechpartner },
          anmerkungen: row.anmerkung,
        })),
      );
      continue;
    }
    rows.push(...(byJva.get(jva.id) ?? []));
  }

  return { ...table, standLabel, rows };
}
