import { demoOperational } from '../data/demoData';
import { getJvaById } from '../data/jvas';
import type { ElisMandantRow, ElisRaumeTable } from './elisRaume';
import { buildElisRaumeTable } from './elisRaume';
import { parseAbsoluteInt } from './elisSchulraeumeForm';
import { formatElisStand, getElisLastChange, recordElisChange } from './elisLastChange';

const STORAGE_PREFIX = 'weberfassung_elis_mandanten_v1_';
const DEMO_PERIOD = '2026-Q1';

export interface ElisMandantFormRow {
  id: string;
  jvaId: string;
  jvaLabel: string;
  mandantName: string;
  kuerzel: string;
  gemeldeteAnzahl: string;
  rabattierteZaehlung: string;
  rektor: string;
  anmerkung: string;
  isNew: boolean;
}

interface StoredMandanten {
  version: 1;
  jvaId: string;
  submittedAt: string;
  rows: Array<Omit<ElisMandantFormRow, 'isNew'>>;
}

function nextId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mandant-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function storageKey(jvaId: string): string {
  return `${STORAGE_PREFIX}${jvaId}`;
}

function shortJvaName(name: string): string {
  return name.replace(/^JVA\s+/, '');
}

export function createEmptyMandantRow(jvaId: string, jvaLabel: string): ElisMandantFormRow {
  return {
    id: nextId(),
    jvaId,
    jvaLabel,
    mandantName: '',
    kuerzel: '',
    gemeldeteAnzahl: '',
    rabattierteZaehlung: '',
    rektor: '',
    anmerkung: '',
    isNew: true,
  };
}

export function loadSubmittedMandanten(jvaId: string): ElisMandantFormRow[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(jvaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMandanten;
    if (parsed.version !== 1 || parsed.jvaId !== jvaId || !Array.isArray(parsed.rows)) {
      return null;
    }
    return parsed.rows.map((row) => ({ ...row, isNew: false }));
  } catch {
    return null;
  }
}

export function saveSubmittedMandanten(jvaId: string, rows: ElisMandantFormRow[]): void {
  if (typeof window === 'undefined') return;
  const payload: StoredMandanten = {
    version: 1,
    jvaId,
    submittedAt: new Date().toISOString(),
    rows: rows.map((row) => ({
      id: row.id,
      jvaId: row.jvaId,
      jvaLabel: row.jvaLabel,
      mandantName: row.mandantName.trim(),
      kuerzel: row.kuerzel.trim(),
      gemeldeteAnzahl: row.gemeldeteAnzahl.trim(),
      rabattierteZaehlung: row.rabattierteZaehlung.trim(),
      rektor: row.rektor.trim(),
      anmerkung: row.anmerkung.trim(),
    })),
  };
  window.sessionStorage.setItem(storageKey(jvaId), JSON.stringify(payload));
  recordElisChange('fb-paed', jvaId);
}

export function normalizeMandantRow(row: ElisMandantFormRow): ElisMandantFormRow {
  return {
    ...row,
    mandantName: row.mandantName.trim(),
    kuerzel: row.kuerzel.trim(),
    gemeldeteAnzahl: String(parseAbsoluteInt(row.gemeldeteAnzahl) ?? 0),
    rabattierteZaehlung: String(parseAbsoluteInt(row.rabattierteZaehlung) ?? 0),
    rektor: row.rektor.trim(),
    anmerkung: row.anmerkung.trim(),
  };
}

export function validateMandantenForm(rows: ElisMandantFormRow[]): { ok: boolean; messages: string[] } {
  const messages: string[] = [];
  if (rows.length === 0) {
    return { ok: false, messages: ['Bitte erfassen Sie mindestens eine Mandantschaft.'] };
  }
  rows.forEach((row, index) => {
    const label = row.mandantName.trim() || `Zeile ${index + 1}`;
    const errors: string[] = [];
    if (!row.mandantName.trim()) errors.push('Name der Mandantschaft fehlt');
    if (parseAbsoluteInt(row.gemeldeteAnzahl) == null) {
      errors.push('Gemeldete Anzahl muss eine ganze Zahl sein');
    }
    if (parseAbsoluteInt(row.rabattierteZaehlung) == null) {
      errors.push('Rabattierte Zählung muss eine ganze Zahl sein');
    }
    if (errors.length > 0) {
      messages.push(`${label}: ${errors.join('; ')}.`);
    }
  });
  return { ok: messages.length === 0, messages };
}

function rowFromTable(row: ElisMandantRow): ElisMandantFormRow {
  return {
    id: row.key,
    jvaId: row.jvaId,
    jvaLabel: row.jvaLabel,
    mandantName: row.mandantName,
    kuerzel: row.kuerzel,
    gemeldeteAnzahl: String(row.gemeldeteAnzahl),
    rabattierteZaehlung: String(row.rabattierteZaehlung),
    rektor: row.rektor,
    anmerkung: row.anmerkungen,
    isNew: false,
  };
}

export function defaultMandantJvaLabel(jvaId: string): string {
  const name = shortJvaName(getJvaById(jvaId)?.name ?? jvaId);
  return `${name} (gV)`;
}

export function buildMandantenFormRows(jvaId: string): ElisMandantFormRow[] {
  const submitted = loadSubmittedMandanten(jvaId);
  if (submitted && submitted.length > 0) return submitted;

  const table = buildElisRaumeTable(demoOperational, DEMO_PERIOD);
  const previous = (table?.rows ?? [])
    .filter((row) => row.kind === 'mandant' && row.jvaId === jvaId)
    .map(rowFromTable);

  return previous.length > 0
    ? previous
    : [createEmptyMandantRow(jvaId, defaultMandantJvaLabel(jvaId))];
}

export function mandantenStandLabel(): string {
  return formatElisStand(getElisLastChange()?.at);
}

export function overlayStoredMandanten(table: ElisRaumeTable): ElisRaumeTable {
  const change = getElisLastChange();
  const standLabel = change ? formatElisStand(change.at) : table.standLabel;
  const rows: ElisMandantRow[] = [];

  const grouped = new Map<string, ElisMandantRow[]>();
  for (const row of table.rows) {
    if (!row.jvaId) continue;
    const list = grouped.get(row.jvaId) ?? [];
    list.push(row);
    grouped.set(row.jvaId, list);
  }

  const jvaIds = [...grouped.keys()];
  for (const jvaId of jvaIds) {
    const stored = loadSubmittedMandanten(jvaId);
    const original = grouped.get(jvaId) ?? [];
    if (!stored || stored.length === 0) {
      rows.push(...original);
      continue;
    }
    const template = original.find((row) => row.kind === 'mandant') ?? original[0];
    const mandants = stored.map((row, index) => {
      const gemeldeteAnzahl = parseAbsoluteInt(row.gemeldeteAnzahl) ?? 0;
      const rabattierteZaehlung = parseAbsoluteInt(row.rabattierteZaehlung) ?? 0;
      return {
        key: row.id,
        kind: 'mandant' as const,
        jvaId,
        jvaLabel: row.jvaLabel,
        showJva: index === 0,
        jvaSpan: stored.length,
        mandantName: row.mandantName,
        kuerzel: row.kuerzel,
        gemeldeteAnzahl,
        rabattierteZaehlung,
        schulraeume: template?.schulraeume ?? 0,
        schulPcPlaetze: template?.schulPcPlaetze ?? 0,
        sozialraeume: template?.sozialraeume ?? 0,
        sozialPcPlaetze: template?.sozialPcPlaetze ?? 0,
        rektor: row.rektor,
        anmerkungen: row.anmerkung,
        showFacility: index === 0,
      };
    });
    rows.push(...mandants);
    const jvaName = shortJvaName(getJvaById(jvaId)?.name ?? jvaId);
    rows.push({
      key: `${jvaId}-sum`,
      kind: 'jva-sum',
      jvaId,
      jvaLabel: stored[0]?.jvaLabel ?? '',
      showJva: false,
      jvaSpan: 1,
      mandantName: `Summe ${jvaName}`,
      kuerzel: '',
      gemeldeteAnzahl: mandants.reduce((sum, row) => sum + row.gemeldeteAnzahl, 0),
      rabattierteZaehlung: mandants.reduce((sum, row) => sum + row.rabattierteZaehlung, 0),
      schulraeume: template?.schulraeume ?? 0,
      schulPcPlaetze: template?.schulPcPlaetze ?? 0,
      sozialraeume: template?.sozialraeume ?? 0,
      sozialPcPlaetze: template?.sozialPcPlaetze ?? 0,
      rektor: stored[0]?.rektor ?? '',
      anmerkungen: stored[0]?.anmerkung ?? '',
      showFacility: true,
    });
  }

  const leftoverTotal = table.rows.find((row) => row.kind === 'total');
  const mandants = rows.filter((row) => row.kind === 'mandant');
  const sums = rows.filter((row) => row.kind === 'jva-sum');
  if (leftoverTotal) {
    rows.push({
      ...leftoverTotal,
      gemeldeteAnzahl: mandants.reduce((sum, row) => sum + row.gemeldeteAnzahl, 0),
      rabattierteZaehlung: mandants.reduce((sum, row) => sum + row.rabattierteZaehlung, 0),
      schulraeume: sums.reduce((sum, row) => sum + row.schulraeume, 0),
      schulPcPlaetze: sums.reduce((sum, row) => sum + row.schulPcPlaetze, 0),
      sozialraeume: sums.reduce((sum, row) => sum + row.sozialraeume, 0),
      sozialPcPlaetze: sums.reduce((sum, row) => sum + row.sozialPcPlaetze, 0),
    });
  }

  return { ...table, standLabel, rows };
}
