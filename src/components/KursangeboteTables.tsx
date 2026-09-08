import type { KursangebotTable } from '../utils/kursangebote';
import { EMPTY_VALUE_LABEL, formatNumber } from '../utils/format';
import {
  REPORT_DATA_CELL,
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
  REPORT_TEXT_CELL,
} from './reportTableStyles';

const LABEL_CELL = `${REPORT_LABEL_CELL} border-slate-300 text-[11px] text-[#1a3352]`;
const NUMBER_CELL = `${REPORT_DATA_CELL} border-slate-300 text-center`;
const TEXT_CELL = `${REPORT_TEXT_CELL} border-slate-300 text-[11px]`;
const HEADER_CELL = `${REPORT_HEADER_CELL} border-slate-600 text-[10px] font-semibold uppercase tracking-wide text-white`;

interface KursangeboteOfferTableProps {
  table: KursangebotTable;
  showExternalColumn: boolean;
}

export function KursangeboteOfferTable({ table, showExternalColumn }: KursangeboteOfferTableProps) {
  const colCount = showExternalColumn ? 8 : 7;
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a3352]">
          {table.titlePrefix}
          <span className="text-emerald-700">{table.genderPhrase}</span>
          {` im ${table.agePhrase}`}
        </h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[11px]`}>
          <thead>
            <tr className="bg-slate-600">
              <th className={HEADER_CELL}>Hauptkategorie</th>
              <th className={HEADER_CELL}>Maßnahmenkategorie</th>
              <th className={HEADER_CELL}>Name Kurs</th>
              <th className={HEADER_CELL}>SOLL Plätze</th>
              <th className={HEADER_CELL}>Dauer der Maßnahme in Monaten</th>
              <th className={HEADER_CELL}>Beginn der Maßnahme</th>
              <th className={HEADER_CELL}>Vorgesehener Abschluss</th>
              {showExternalColumn ? (
                <th className="border border-violet-400 bg-violet-200 px-2 py-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-violet-950">
                  Durchführung durch externe Kraft
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr
                key={`${row.typeKey}-${row.courseName}`}
                className={row.groupStripe ? 'bg-slate-50' : 'bg-white'}
              >
                  {row.showCategory ? (
                    <td className={`${LABEL_CELL} font-medium`} rowSpan={row.categorySpan}>
                      {row.categoryLabel}
                    </td>
                  ) : null}
                  {row.showType ? (
                    <td className={LABEL_CELL} rowSpan={row.typeSpan}>
                      {row.typeLabel}
                    </td>
                  ) : null}
                  <td className={`${TEXT_CELL} text-sky-700`}>{row.courseName}</td>
                  <td className={`${NUMBER_CELL} text-sky-700`}>{formatNumber(row.targetPlaces)}</td>
                  <td className={`${NUMBER_CELL} text-emerald-700`}>
                    {row.durationMonths == null ? EMPTY_VALUE_LABEL : formatNumber(row.durationMonths)}
                  </td>
                  <td className={`${TEXT_CELL} text-emerald-700`}>{row.startLabel}</td>
                  <td className={`${TEXT_CELL} text-emerald-700`}>{row.intendedQualification}</td>
                  {showExternalColumn ? (
                    <td className="border border-violet-200 bg-violet-50 px-2 py-1.5 text-center text-[11px] font-semibold text-violet-900">
                      {row.externalStaff ? 'X' : ''}
                    </td>
                  ) : null}
                </tr>
            ))}
            {table.rows.length === 0 ? (
              <tr>
                <td className={`${TEXT_CELL} text-slate-500`} colSpan={colCount}>
                  Keine aktiven Kursangebote.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
