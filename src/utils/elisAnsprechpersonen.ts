import { getJvaById, JVAS } from '../data/jvas';
import type { Jva } from '../types/domain';
import type { JvaOperationalRecord } from './aggregations';
import { standDateFromPeriod } from './elisRaume';
import { resolveStellenPeriod } from './stellen';

const REKTOR_NAMES = [
  'Dr. A. Meier',
  'Dr. S. Schneider',
  'M. Hoffmann',
  'Dr. K. Weber',
  'L. Schäfer',
  'Dr. T. Koch',
  'C. Bauer',
  'Dr. J. Richter',
];

const CONTACT_NAMES = [
  'K. Lange',
  'M. Krüger',
  'S. Wolf',
  'P. Hartmann',
  'R. Neumann',
  'T. Schwarz',
  'N. Braun',
  'H. Zimmermann',
];

const NOTES = ['', '', 'elis-Verbund', '', 'Vertretung über Standortverbund', ''];

export const ELIS_SICHERHEITSRAHMEN_COLUMNS = [
  { key: 'alVl', label: 'AL/VL' },
  { key: 'paedD', label: 'Päd. D.' },
  { key: 'technisch', label: 'Technisch' },
  { key: 'sonstige', label: 'Sonstige' },
] as const;

export const ELIS_SICHERHEITSPARTNER_COLUMNS = [
  { key: 'alVl', label: 'AL/VL' },
  { key: 'paedD', label: 'Päd. D.' },
  { key: 'paedVertreter', label: 'Päd. Vertreter' },
  { key: 'technisch', label: 'Technisch' },
  { key: 'sonstige', label: 'Sonstige' },
] as const;

export type ElisSicherheitsrahmenKey = (typeof ELIS_SICHERHEITSRAHMEN_COLUMNS)[number]['key'];
export type ElisSicherheitspartnerKey = (typeof ELIS_SICHERHEITSPARTNER_COLUMNS)[number]['key'];

export interface ElisAnsprechpersonenRow {
  key: string;
  jvaId: string;
  jvaLabel: string;
  rektor: string;
  sicherheitsrahmen: Record<ElisSicherheitsrahmenKey, string>;
  sicherheitspartner: Record<ElisSicherheitspartnerKey, string>;
  anmerkungen: string;
}

export interface ElisAnsprechpersonenTable {
  period: string;
  standLabel: string;
  rows: ElisAnsprechpersonenRow[];
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function shortJvaName(name: string): string {
  return name.replace(/^JVA\s+/, '');
}

function vollzugKuerzel(haftform: Jva['haftform']): readonly ('gV' | 'oV')[] {
  if (haftform === 'offen') return ['oV'];
  if (haftform === 'geschlossen') return ['gV'];
  return ['gV', 'oV'];
}

function pickName(seedKey: string): string {
  return CONTACT_NAMES[hashSeed(seedKey) % CONTACT_NAMES.length] ?? CONTACT_NAMES[0] ?? '';
}

function contactOrEmpty(seedKey: string, fillWhen: number[]): string {
  const seed = hashSeed(seedKey);
  return fillWhen.includes(seed % 5) ? pickName(seedKey) : '';
}

function ensureOneFilled<K extends string>(
  values: Record<K, string>,
  keys: readonly K[],
  seedKey: string,
): Record<K, string> {
  if (keys.some((key) => values[key].trim() !== '')) return values;
  const fallbackKey = keys[hashSeed(seedKey) % keys.length];
  if (!fallbackKey) return values;
  return { ...values, [fallbackKey]: pickName(`${seedKey}-fallback`) };
}

export function buildElisAnsprechpersonenTable(
  records: JvaOperationalRecord[],
  berichtszeitpunkt: string,
): ElisAnsprechpersonenTable | null {
  const period = resolveStellenPeriod(berichtszeitpunkt, records);
  if (!period) return null;

  const rows: ElisAnsprechpersonenRow[] = [];

  for (const jva of [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de'))) {
    const record = records.find((item) => item.jvaId === jva.id && item.reportingPeriod === period);
    if (!record) continue;

    const display = getJvaById(jva.id)?.name ?? jva.name;
    const rektor = REKTOR_NAMES[hashSeed(`${jva.id}-rektor`) % REKTOR_NAMES.length] ?? REKTOR_NAMES[0] ?? '';

    for (const suffix of vollzugKuerzel(jva.haftform)) {
      const seed = `${jva.id}-${suffix}`;
      const sicherheitsrahmen = ensureOneFilled(
        {
          alVl: contactOrEmpty(`${seed}-rahmen-al`, [0, 1]),
          paedD: contactOrEmpty(`${seed}-rahmen-paed`, [0]),
          technisch: contactOrEmpty(`${seed}-rahmen-tech`, [2]),
          sonstige: contactOrEmpty(`${seed}-rahmen-sonst`, [3]),
        },
        ELIS_SICHERHEITSRAHMEN_COLUMNS.map((column) => column.key),
        `${seed}-rahmen`,
      );
      const sicherheitspartner = ensureOneFilled(
        {
          alVl: contactOrEmpty(`${seed}-partner-al`, [1]),
          paedD: contactOrEmpty(`${seed}-partner-paed`, [0, 2]),
          paedVertreter: contactOrEmpty(`${seed}-partner-vert`, [0]),
          technisch: contactOrEmpty(`${seed}-partner-tech`, [4]),
          sonstige: contactOrEmpty(`${seed}-partner-sonst`, [3]),
        },
        ELIS_SICHERHEITSPARTNER_COLUMNS.map((column) => column.key),
        `${seed}-partner`,
      );

      rows.push({
        key: seed,
        jvaId: jva.id,
        jvaLabel: `${shortJvaName(display)} (${suffix})`,
        rektor,
        sicherheitsrahmen,
        sicherheitspartner,
        anmerkungen: NOTES[hashSeed(`${seed}-note`) % NOTES.length] ?? '',
      });
    }
  }

  if (rows.length === 0) return null;

  return {
    period,
    standLabel: standDateFromPeriod(period),
    rows,
  };
}
