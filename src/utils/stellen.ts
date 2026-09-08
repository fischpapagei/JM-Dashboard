import { getJvaById, JVAS } from '../data/jvas';
import type { JvaOperationalRecord } from './aggregations';

export interface StellenRow {
  jvaId: string;
  jvaName: string;
  stellen: number;
  besetzt: number;
}

export interface StellenTable {
  period: string;
  rows: StellenRow[];
  totals: {
    stellen: number;
    besetzt: number;
  };
}

export function resolveStellenPeriod(
  berichtszeitpunkt: string,
  records: JvaOperationalRecord[],
): string | null {
  const periods = [...new Set(records.map((record) => record.reportingPeriod))].sort();
  if (periods.length === 0) return null;
  if (periods.includes(berichtszeitpunkt)) return berichtszeitpunkt;
  const earlier = periods.filter((period) => period <= berichtszeitpunkt);
  return earlier[earlier.length - 1] ?? periods[0] ?? null;
}

export function buildStellenTable(
  records: JvaOperationalRecord[],
  berichtszeitpunkt: string,
): StellenTable | null {
  const period = resolveStellenPeriod(berichtszeitpunkt, records);
  if (!period) return null;

  const rows: StellenRow[] = JVAS.flatMap((jva) => {
    const record = records.find((item) => item.jvaId === jva.id && item.reportingPeriod === period);
    if (!record) return [];
    return [
      {
        jvaId: jva.id,
        jvaName: getJvaById(jva.id)?.name ?? jva.name,
        stellen: record.paedStellen,
        besetzt: record.paedBesetzt,
      },
    ];
  }).sort((a, b) => a.jvaName.localeCompare(b.jvaName, 'de'));

  if (rows.length === 0) return null;

  const totals = rows.reduce(
    (acc, row) => ({
      stellen: acc.stellen + row.stellen,
      besetzt: acc.besetzt + row.besetzt,
    }),
    { stellen: 0, besetzt: 0 },
  );

  return { period, rows, totals };
}
