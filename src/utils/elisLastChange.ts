import { formatDate } from './format';

const STORAGE_KEY = 'weberfassung_elis_last_change_v1';

export type ElisChangeSource = 'schulraeume' | 'jva-kontakte' | 'fb-paed';

export interface ElisLastChange {
  at: string;
  source: ElisChangeSource;
  jvaId?: string;
}

interface ElisLastChangeStore {
  global: ElisLastChange | null;
  byJva: Record<string, ElisLastChange>;
}

const SOURCE_LABEL: Record<ElisChangeSource, string> = {
  schulraeume: 'Anstalt (Schulräume)',
  'jva-kontakte': 'Anstalt (eLis-Kontakte)',
  'fb-paed': 'Fachbereich Pädagogik',
};

function emptyStore(): ElisLastChangeStore {
  return { global: null, byJva: {} };
}

function readStore(): ElisLastChangeStore {
  if (typeof window === 'undefined') return emptyStore();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as ElisLastChangeStore;
    if (!parsed || typeof parsed !== 'object') return emptyStore();
    return {
      global: parsed.global ?? null,
      byJva: parsed.byJva ?? {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: ElisLastChangeStore): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function recordElisChange(source: ElisChangeSource, jvaId?: string): ElisLastChange {
  const entry: ElisLastChange = {
    at: new Date().toISOString(),
    source,
    jvaId,
  };
  const store = readStore();
  store.global = entry;
  if (jvaId) {
    store.byJva[jvaId] = entry;
  }
  writeStore(store);
  return entry;
}

export function getElisLastChange(): ElisLastChange | null {
  return readStore().global;
}

export function getElisLastChangeForJva(jvaId: string): ElisLastChange | null {
  const store = readStore();
  return store.byJva[jvaId] ?? store.global;
}

export function formatElisStand(at?: string | null): string {
  const iso = at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  return formatDate(iso);
}

export function elisLastChangeLabel(change: ElisLastChange | null): string | null {
  if (!change) return null;
  return `Letzte Änderung: ${formatElisStand(change.at)} (${SOURCE_LABEL[change.source]})`;
}
