import type { StellenTable } from '../utils/stellen';
import { formatNumber } from '../utils/format';
import {
  REPORT_DATA_CELL,
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
} from './reportTableStyles';

const LABEL_CELL = `${REPORT_LABEL_CELL} border-slate-300 text-sm text-(--color-ink)`;
const DATA_CELL = `${REPORT_DATA_CELL} border-slate-300 text-sm text-(--color-ink)`;
const HEADER_CELL = `${REPORT_HEADER_CELL} border-slate-400 bg-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-800`;

interface StellenTableProps {
  table: StellenTable;
}

export function StellenTableView({ table }: StellenTableProps) {
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-3 text-center">
        <h3 className="text-sm font-semibold text-(--color-ink)">Stellen pädagogischer Dienst</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-sm`}>
          <thead>
            <tr>
              <th className={HEADER_CELL}>JVA</th>
              <th className={HEADER_CELL}>Anzahl Stellen</th>
              <th className={HEADER_CELL}>davon besetzt</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={row.jvaId} className={index % 2 === 1 ? 'bg-slate-100' : 'bg-white'}>
                <td className={`${LABEL_CELL} font-medium`}>{row.jvaName}</td>
                <td className={DATA_CELL}>{formatNumber(row.stellen)}</td>
                <td className={DATA_CELL}>{formatNumber(row.besetzt)}</td>
              </tr>
            ))}
            <tr className="bg-slate-200 font-semibold">
              <td className={LABEL_CELL}>Summe</td>
              <td className={DATA_CELL}>{formatNumber(table.totals.stellen)}</td>
              <td className={DATA_CELL}>{formatNumber(table.totals.besetzt)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
