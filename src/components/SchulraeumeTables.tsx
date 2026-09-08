import type { SchulraumTable } from '../utils/schulraeume';
import { formatNumber } from '../utils/format';
import {
  REPORT_DATA_CELL,
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
} from './reportTableStyles';

const LABEL_CELL = `${REPORT_LABEL_CELL} border-slate-300 text-[11px] text-(--color-ink)`;
const DATA_CELL = `${REPORT_DATA_CELL} border-slate-300 text-[11px] text-(--color-ink)`;
const HEADER_CELL = `${REPORT_HEADER_CELL} border-slate-400 bg-slate-200 text-[10px] font-semibold uppercase tracking-wide text-slate-800`;

interface SchulraeumeTableProps {
  table: SchulraumTable;
}

export function SchulraeumeTable({ table }: SchulraeumeTableProps) {
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-center">
        <h3 className="text-sm font-semibold text-(--color-ink)">Übersicht der Schulräume</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[11px]`}>
          <thead>
            <tr>
              <th className={HEADER_CELL}>JVA</th>
              <th className={HEADER_CELL}>Raumbezeichnung</th>
              <th className={HEADER_CELL}>Anzahl Räume</th>
              <th className={HEADER_CELL}>Größe in qm</th>
              <th className={HEADER_CELL}>Elis? (1 = ja, 0 = nein)</th>
              <th className={HEADER_CELL}>Anzahl Schulplätze für Gefangene</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => {
              if (row.kind !== 'room') {
                return (
                  <tr key={row.key} className="bg-slate-100 font-semibold">
                    <td className={LABEL_CELL} colSpan={2}>
                      {row.designation}
                    </td>
                    <td className={DATA_CELL}>{formatNumber(row.roomCount)}</td>
                    <td className={DATA_CELL}>{formatNumber(row.squareMeters)}</td>
                    <td className={`${DATA_CELL} text-center`}>{formatNumber(row.elisFlag)}</td>
                    <td className={DATA_CELL}>{formatNumber(row.schoolSeats)}</td>
                  </tr>
                );
              }
              return (
                <tr key={row.key} className="bg-white">
                  {row.showJva ? (
                    <td className={`${LABEL_CELL} font-medium`} rowSpan={row.jvaSpan}>
                      {row.jvaName}
                    </td>
                  ) : null}
                  <td className={LABEL_CELL}>{row.designation}</td>
                  <td className={DATA_CELL}>{formatNumber(row.roomCount)}</td>
                  <td className={DATA_CELL}>{formatNumber(row.squareMeters)}</td>
                  <td className={`${DATA_CELL} text-center`}>{formatNumber(row.elisFlag)}</td>
                  <td className={DATA_CELL}>{formatNumber(row.schoolSeats)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
