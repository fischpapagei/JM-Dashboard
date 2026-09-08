import type { SollplatzChangeKind, SollplatzVeraenderungTable } from '../utils/sollplatzVeraenderung';
import { formatNumber } from '../utils/format';
import {
  REPORT_DATA_CELL,
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
} from './reportTableStyles';

const LABEL_CELL = `${REPORT_LABEL_CELL} border-slate-300`;
const DATA_CELL = `${REPORT_DATA_CELL} border-slate-300 text-[11px]`;
const HEADER_CELL = `${REPORT_HEADER_CELL} border-slate-600 bg-slate-600 text-[10px] font-semibold uppercase tracking-wide text-white`;

function rowTone(kind: SollplatzChangeKind): string {
  if (kind === 'new') return 'text-emerald-700';
  if (kind === 'changed') return 'text-red-600';
  return 'text-[#1a3352]';
}

function formatSigned(value: number): string {
  if (value > 0) return `+${formatNumber(value)}`;
  return formatNumber(value);
}

interface SollplatzVeraenderungTableProps {
  table: SollplatzVeraenderungTable;
}

export function SollplatzVeraenderungTableView({ table }: SollplatzVeraenderungTableProps) {
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a3352]">Veränderung der Schulkurse und deren Soll-Plätze</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Vergleich {table.previousMonthLabel} → {table.currentMonthLabel}
        </p>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[11px]`}>
          <thead>
            <tr>
              <th className={HEADER_CELL}>JVA</th>
              <th className={HEADER_CELL}>Hauptkategorie</th>
              <th className={HEADER_CELL}>Maßnahmenkategorie</th>
              <th className={HEADER_CELL}>Name Kurs</th>
              <th className={HEADER_CELL}>Soll-Plätze Vormonat</th>
              <th className={HEADER_CELL}>Soll-Plätze aktueller Monat</th>
              <th className={HEADER_CELL}>Veränderung Soll Plätze</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => {
              const tone = rowTone(row.kind);
              return (
                <tr key={row.key} className={tone}>
                  {row.showJva ? (
                    <td className={`${LABEL_CELL} font-medium`} rowSpan={row.jvaSpan}>
                      {row.jvaName}
                    </td>
                  ) : null}
                  <td className={LABEL_CELL}>{row.categoryLabel}</td>
                  <td className={LABEL_CELL}>{row.typeLabel}</td>
                  <td className={LABEL_CELL}>{row.courseName}</td>
                  <td className={DATA_CELL}>{formatNumber(row.previousPlaces)}</td>
                  <td className={DATA_CELL}>{formatNumber(row.currentPlaces)}</td>
                  <td className={`${DATA_CELL} font-medium`}>{formatSigned(row.change)}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold text-[#1a3352]">
              <td className={LABEL_CELL} colSpan={4}>
                Gesamtsumme
              </td>
              <td className={DATA_CELL}>{formatNumber(table.totals.previousPlaces)}</td>
              <td className={DATA_CELL}>{formatNumber(table.totals.currentPlaces)}</td>
              <td className={DATA_CELL}>{formatSigned(table.totals.change)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
