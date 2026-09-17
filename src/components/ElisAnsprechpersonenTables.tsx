import type { ElisAnsprechpersonenTable } from '../utils/elisAnsprechpersonen';
import {
  ELIS_SICHERHEITSPARTNER_COLUMNS,
  ELIS_SICHERHEITSRAHMEN_COLUMNS,
} from '../utils/elisAnsprechpersonen';
import { EMPTY_VALUE_LABEL } from '../utils/format';
import {
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
  REPORT_TEXT_CELL,
} from './reportTableStyles';

const LABEL_CELL = `${REPORT_LABEL_CELL} border-slate-300 text-[10px] text-(--color-ink)`;
const TEXT_CELL = `${REPORT_TEXT_CELL} border-slate-300 text-[10px] text-(--color-ink)`;
const HEADER_CELL = `${REPORT_HEADER_CELL} border-nachtblau-30 bg-nachtblau-15 text-[9px] font-semibold uppercase tracking-wide text-nachtblau`;

function blank(value: string): string {
  return value.trim() === '' ? EMPTY_VALUE_LABEL : value;
}

interface ElisAnsprechpersonenTableProps {
  table: ElisAnsprechpersonenTable;
}

export function ElisAnsprechpersonenTableView({ table }: ElisAnsprechpersonenTableProps) {
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-nachtblau-30 bg-nachtblau-15 px-4 py-3 text-center">
        <h3 className="text-sm font-semibold text-(--color-ink)">Elis (Stand {table.standLabel})</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[10px]`}>
          <thead>
            <tr>
              <th className={HEADER_CELL} rowSpan={2}>
                Name der JVA (elis Verbünde)
              </th>
              <th className={HEADER_CELL} rowSpan={2}>
                Name der Rektorin/ des Rektors
              </th>
              <th className={`${HEADER_CELL} text-center`} colSpan={ELIS_SICHERHEITSRAHMEN_COLUMNS.length}>
                Elis Sicherheitsrahmen
              </th>
              <th className={`${HEADER_CELL} text-center`} colSpan={ELIS_SICHERHEITSPARTNER_COLUMNS.length}>
                Elis Sicherheitspartner
              </th>
              <th className={HEADER_CELL} rowSpan={2}>
                Anmerkungen
              </th>
            </tr>
            <tr>
              {ELIS_SICHERHEITSRAHMEN_COLUMNS.map((column) => (
                <th key={`rahmen-${column.key}`} className={HEADER_CELL}>
                  {column.label}
                </th>
              ))}
              {ELIS_SICHERHEITSPARTNER_COLUMNS.map((column) => (
                <th key={`partner-${column.key}`} className={HEADER_CELL}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={row.key} className={index % 2 === 1 ? 'bg-slate-100' : 'bg-white'}>
                <td className={`${LABEL_CELL} font-medium`}>{row.jvaLabel}</td>
                <td className={TEXT_CELL}>{blank(row.rektor)}</td>
                {ELIS_SICHERHEITSRAHMEN_COLUMNS.map((column) => (
                  <td key={`${row.key}-rahmen-${column.key}`} className={TEXT_CELL}>
                    {blank(row.sicherheitsrahmen[column.key])}
                  </td>
                ))}
                {ELIS_SICHERHEITSPARTNER_COLUMNS.map((column) => (
                  <td key={`${row.key}-partner-${column.key}`} className={TEXT_CELL}>
                    {blank(row.sicherheitspartner[column.key])}
                  </td>
                ))}
                <td className={TEXT_CELL}>{blank(row.anmerkungen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
