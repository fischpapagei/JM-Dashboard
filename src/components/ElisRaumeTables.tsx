import type { ElisMandantRow, ElisRaumeTable } from '../utils/elisRaume';
import { EMPTY_VALUE_LABEL, formatNumber } from '../utils/format';
import {
  REPORT_DATA_CELL,
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
} from './reportTableStyles';

const LABEL_CELL = `${REPORT_LABEL_CELL} border-slate-300 text-[10px] text-(--color-ink)`;
const DATA_CELL = `${REPORT_DATA_CELL} border-slate-300 text-[10px] text-(--color-ink)`;
const HEADER_CELL = `${REPORT_HEADER_CELL} border-sky-300 bg-sky-100 text-[9px] font-semibold uppercase tracking-wide text-sky-950`;

function blank(value: string): string {
  return value.trim() === '' ? EMPTY_VALUE_LABEL : value;
}

function facilityCells(row: ElisMandantRow, rowSpan: number) {
  return (
    <>
      <td className={DATA_CELL} rowSpan={rowSpan}>
        {formatNumber(row.schulraeume)}
      </td>
      <td className={DATA_CELL} rowSpan={rowSpan}>
        {formatNumber(row.schulPcPlaetze)}
      </td>
      <td className={DATA_CELL} rowSpan={rowSpan}>
        {formatNumber(row.sozialraeume)}
      </td>
      <td className={DATA_CELL} rowSpan={rowSpan}>
        {formatNumber(row.sozialPcPlaetze)}
      </td>
      <td className={LABEL_CELL} rowSpan={rowSpan}>
        {blank(row.rektor)}
      </td>
      <td className={LABEL_CELL} rowSpan={rowSpan}>
        {blank(row.anmerkungen)}
      </td>
    </>
  );
}

interface ElisRaumeTableProps {
  table: ElisRaumeTable;
}

export function ElisRaumeTableView({ table }: ElisRaumeTableProps) {
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-sky-200 bg-sky-100 px-4 py-3 text-center">
        <h3 className="text-sm font-semibold text-(--color-ink)">
          Elis Räume und Mandantschaften (Stand {table.standLabel})
        </h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[10px]`}>
          <thead>
            <tr>
              <th className={HEADER_CELL} rowSpan={2}>
                Name der JVA (elis Verbünde)
              </th>
              <th className={`${HEADER_CELL} text-center`} colSpan={4}>
                Mandantschaft
              </th>
              <th className={`${HEADER_CELL} text-center`} colSpan={2}>
                Schulräume
              </th>
              <th className={`${HEADER_CELL} text-center`} colSpan={2}>
                Digitale Sozialräume
              </th>
              <th className={HEADER_CELL} rowSpan={2}>
                Name der Rektorin/ des Rektors
              </th>
              <th className={HEADER_CELL} rowSpan={2}>
                Anmerkungen
              </th>
            </tr>
            <tr>
              <th className={HEADER_CELL}>Name</th>
              <th className={HEADER_CELL}>Kürzel</th>
              <th className={HEADER_CELL}>Gemeldete Anzahl</th>
              <th className={HEADER_CELL}>Rabattierte Zählung</th>
              <th className={HEADER_CELL}>Anzahl Räume</th>
              <th className={HEADER_CELL}>Anzahl PC-Plätze (inkl. Lehrkraft)</th>
              <th className={HEADER_CELL}>Anzahl Räume</th>
              <th className={HEADER_CELL}>Anzahl PC-Plätze (inkl. Aufsicht)</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => {
              if (row.kind !== 'mandant') {
                return (
                  <tr key={row.key} className="bg-slate-100 font-semibold">
                    <td className={LABEL_CELL} colSpan={3}>
                      {row.mandantName}
                    </td>
                    <td className={DATA_CELL}>{formatNumber(row.gemeldeteAnzahl)}</td>
                    <td className={DATA_CELL}>{formatNumber(row.rabattierteZaehlung)}</td>
                    <td className={DATA_CELL}>{formatNumber(row.schulraeume)}</td>
                    <td className={DATA_CELL}>{formatNumber(row.schulPcPlaetze)}</td>
                    <td className={DATA_CELL}>{formatNumber(row.sozialraeume)}</td>
                    <td className={DATA_CELL}>{formatNumber(row.sozialPcPlaetze)}</td>
                    <td className={LABEL_CELL}>{blank(row.rektor)}</td>
                    <td className={LABEL_CELL}>{blank(row.anmerkungen)}</td>
                  </tr>
                );
              }
              return (
                <tr key={row.key} className="bg-white">
                  {row.showJva ? (
                    <td className={`${LABEL_CELL} font-medium`} rowSpan={row.jvaSpan}>
                      {row.jvaLabel}
                    </td>
                  ) : null}
                  <td className={LABEL_CELL}>{row.mandantName}</td>
                  <td className={DATA_CELL}>{row.kuerzel}</td>
                  <td className={DATA_CELL}>{formatNumber(row.gemeldeteAnzahl)}</td>
                  <td className={DATA_CELL}>{formatNumber(row.rabattierteZaehlung)}</td>
                  {row.showFacility ? facilityCells(row, row.jvaSpan) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
