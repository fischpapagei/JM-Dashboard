import type { KursangebotTable } from '../utils/kursangebote';
import { EMPTY_VALUE_LABEL, formatNumber } from '../utils/format';
import { ReportScrollTable } from './ReportScrollTable';
import {
  REPORT_DATA_CELL,
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
  REPORT_TEXT_CELL,
  reportStickyCell,
} from './reportTableStyles';

const LABEL_CELL = `${REPORT_LABEL_CELL} border-slate-300 text-[11px] text-(--color-ink)`;
const NUMBER_CELL = `${REPORT_DATA_CELL} border-slate-300 text-center`;
const TEXT_CELL = `${REPORT_TEXT_CELL} border-slate-300 text-[11px]`;
const HEADER_CELL = `${REPORT_HEADER_CELL} border-nachtblau-30 bg-nachtblau text-[10px] font-semibold uppercase tracking-wide text-white`;

interface KursangeboteOfferTableProps {
  table: KursangebotTable;
  showExternalColumn: boolean;
}

export function KursangeboteOfferTable({ table, showExternalColumn }: KursangeboteOfferTableProps) {
  const colCount = showExternalColumn ? 8 : 7;
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-(--color-ink)">
          {table.titlePrefix}
          <span className="text-grasgruen">{table.genderPhrase}</span>
          {` im ${table.agePhrase}`}
        </h3>
      </div>
      <ReportScrollTable>
        <table className={`${REPORT_TABLE_CLASS} text-[11px]`}>
          <thead>
            <tr className="bg-nachtblau">
              <th className={`${HEADER_CELL} ${reportStickyCell(1, 'bg-nachtblau')}`}>Hauptkategorie</th>
              <th className={`${HEADER_CELL} ${reportStickyCell(2, 'bg-nachtblau', { edge: true })}`}>Maßnahmenkategorie</th>
              <th className={HEADER_CELL}>Name Kurs</th>
              <th className={HEADER_CELL}>SOLL Plätze</th>
              <th className={HEADER_CELL}>Dauer der Maßnahme in Monaten</th>
              <th className={HEADER_CELL}>Beginn der Maßnahme</th>
              <th className={HEADER_CELL}>Vorgesehener Abschluss</th>
              {showExternalColumn ? (
                <th className="border border-nachtblau-50 bg-nachtblau-30 px-2 py-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-nachtblau">
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
                    <td
                      className={`${LABEL_CELL} font-medium ${reportStickyCell(1, row.groupStripe ? 'bg-slate-50' : 'bg-white')}`}
                      rowSpan={row.categorySpan}
                    >
                      {row.categoryLabel}
                    </td>
                  ) : null}
                  {row.showType ? (
                    <td
                      className={`${LABEL_CELL} ${reportStickyCell(2, row.groupStripe ? 'bg-slate-50' : 'bg-white', { edge: true })}`}
                      rowSpan={row.typeSpan}
                    >
                      {row.typeLabel}
                    </td>
                  ) : null}
                  <td className={`${TEXT_CELL} text-nachtblau`}>{row.courseName}</td>
                  <td className={`${NUMBER_CELL} text-nachtblau`}>{formatNumber(row.targetPlaces)}</td>
                  <td className={`${NUMBER_CELL} text-grasgruen`}>
                    {row.durationMonths == null ? EMPTY_VALUE_LABEL : formatNumber(row.durationMonths)}
                  </td>
                  <td className={`${TEXT_CELL} text-grasgruen`}>{row.startLabel}</td>
                  <td className={`${TEXT_CELL} text-grasgruen`}>{row.intendedQualification}</td>
                  {showExternalColumn ? (
                    <td className="border border-nachtblau-30 bg-nachtblau-15 px-2 py-1.5 text-center text-[11px] font-semibold text-grasgruen">
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
      </ReportScrollTable>
    </section>
  );
}
