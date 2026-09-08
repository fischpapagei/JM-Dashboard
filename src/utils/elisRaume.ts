import { getJvaById, JVAS } from '../data/jvas';
import type { Jva } from '../types/domain';
import type { JvaOperationalRecord } from './aggregations';
import { formatDate } from './format';
import { getLastMonthKeyOfQuarter, parseReportingPeriodKind } from './periods';
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

const NOTES = ['', '', '', 'elis-Verbund', 'Standort im Aufbau', ''];

export interface ElisMandantRow {
  key: string;
  kind: 'mandant' | 'jva-sum' | 'total';
  jvaId: string;
  jvaLabel: string;
  showJva: boolean;
  jvaSpan: number;
  mandantName: string;
  kuerzel: string;
  gemeldeteAnzahl: number;
  rabattierteZaehlung: number;
  schulraeume: number;
  schulPcPlaetze: number;
  sozialraeume: number;
  sozialPcPlaetze: number;
  rektor: string;
  anmerkungen: string;
  showFacility: boolean;
}

export interface ElisRaumeTable {
  period: string;
  standLabel: string;
  rows: ElisMandantRow[];
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

function kuerzelPrefix(jva: Jva): string {
  const letters = shortJvaName(jva.name)
    .replace(/[^A-Za-zÄÖÜäöüß]/g, '')
    .toUpperCase()
    .replace(/Ä/g, 'AE')
    .replace(/Ö/g, 'OE')
    .replace(/Ü/g, 'UE')
    .slice(0, 3);
  return (letters + 'XXX').slice(0, 3);
}

function mandantTemplates(jva: Jva): string[] {
  const names: string[] = [];
  if (jva.geschlecht !== 'weiblich') names.push('Schule männl. Gef.');
  if (jva.geschlecht !== 'männlich') names.push('Schule weibl. Gef.');
  const seed = hashSeed(jva.id);
  if (seed % 2 === 0) names.push('Studienzentrum');
  if (jva.geschlecht !== 'männlich' && seed % 3 !== 0) names.push('Berufsbildung weibl. Gef.');
  return names.length > 0 ? names : ['Schule männl. Gef.'];
}

function splitCount(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  const rest = total - base * parts;
  return Array.from({ length: parts }, (_, index) => Math.max(0, base + (index < rest ? 1 : 0)));
}

function lastDayOfMonth(monthKey: string): string {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  const day = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function standDateFromPeriod(period: string): string {
  const kind = parseReportingPeriodKind(period);
  if (kind === 'month') return formatDate(lastDayOfMonth(period));
  if (kind === 'quarter') return formatDate(lastDayOfMonth(getLastMonthKeyOfQuarter(period)));
  if (kind === 'year') return formatDate(`${period}-12-31`);
  return formatDate(period);
}

export function buildElisRaumeTable(
  records: JvaOperationalRecord[],
  berichtszeitpunkt: string,
): ElisRaumeTable | null {
  const period = resolveStellenPeriod(berichtszeitpunkt, records);
  if (!period) return null;

  const rows: ElisMandantRow[] = [];

  for (const jva of [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de'))) {
    const record = records.find((item) => item.jvaId === jva.id && item.reportingPeriod === period);
    if (!record) continue;

    const templates = mandantTemplates(jva);
    const gemeldet = splitCount(record.elisMandantschaften, templates.length);
    const jvaLabel = `${shortJvaName(getJvaById(jva.id)?.name ?? jva.name)} (qV)`;
    const prefix = kuerzelPrefix(jva);
    const rektor = REKTOR_NAMES[hashSeed(`${jva.id}-rektor`) % REKTOR_NAMES.length] ?? REKTOR_NAMES[0];
    const anmerkungen = NOTES[hashSeed(`${jva.id}-note`) % NOTES.length] ?? '';
    const facility = {
      schulraeume: record.elisSchulraeume,
      schulPcPlaetze: record.elisLernplaetze,
      sozialraeume: record.elisDigitaleSozialraeume,
      sozialPcPlaetze: record.elisHaftraeume,
      rektor,
      anmerkungen,
    };

    const mandantRows = templates.map((name, index) => {
      const gemeldeteAnzahl = gemeldet[index] ?? 0;
      return {
        key: `${jva.id}-${index}`,
        kind: 'mandant' as const,
        jvaId: jva.id,
        jvaLabel,
        showJva: index === 0,
        jvaSpan: templates.length,
        mandantName: name,
        kuerzel: `${prefix}${index}`,
        gemeldeteAnzahl,
        rabattierteZaehlung: Math.ceil(gemeldeteAnzahl / 2),
        ...facility,
        showFacility: index === 0,
      };
    });

    rows.push(...mandantRows);

    const sumGemeldet = mandantRows.reduce((sum, row) => sum + row.gemeldeteAnzahl, 0);
    const sumRabatt = mandantRows.reduce((sum, row) => sum + row.rabattierteZaehlung, 0);
    rows.push({
      key: `${jva.id}-sum`,
      kind: 'jva-sum',
      jvaId: jva.id,
      jvaLabel,
      showJva: false,
      jvaSpan: 1,
      mandantName: `Summe ${shortJvaName(jva.name)}`,
      kuerzel: '',
      gemeldeteAnzahl: sumGemeldet,
      rabattierteZaehlung: sumRabatt,
      ...facility,
      showFacility: true,
    });
  }

  if (rows.length === 0) return null;

  const mandants = rows.filter((row) => row.kind === 'mandant');
  const facilityRows = rows.filter((row) => row.kind === 'jva-sum');
  rows.push({
    key: 'gesamtsumme',
    kind: 'total',
    jvaId: '',
    jvaLabel: '',
    showJva: false,
    jvaSpan: 1,
    mandantName: 'Gesamtsumme',
    kuerzel: '',
    gemeldeteAnzahl: mandants.reduce((sum, row) => sum + row.gemeldeteAnzahl, 0),
    rabattierteZaehlung: mandants.reduce((sum, row) => sum + row.rabattierteZaehlung, 0),
    schulraeume: facilityRows.reduce((sum, row) => sum + row.schulraeume, 0),
    schulPcPlaetze: facilityRows.reduce((sum, row) => sum + row.schulPcPlaetze, 0),
    sozialraeume: facilityRows.reduce((sum, row) => sum + row.sozialraeume, 0),
    sozialPcPlaetze: facilityRows.reduce((sum, row) => sum + row.sozialPcPlaetze, 0),
    rektor: '',
    anmerkungen: '',
    showFacility: true,
  });

  return {
    period,
    standLabel: standDateFromPeriod(period),
    rows,
  };
}
