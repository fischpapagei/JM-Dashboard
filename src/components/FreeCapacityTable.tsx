import type { FreeCapacityRow } from "../types/domain";
import { formatNumber } from "../utils/format";
import { EmptyState } from "./EmptyState";
import { ReportScrollTable } from "./ReportScrollTable";

interface FreeCapacityTableProps {
  rows: FreeCapacityRow[];
}

export function FreeCapacityTable({ rows }: FreeCapacityTableProps) {
  return (
    <section className="kern-card kern-card--hug dashboard-panel overflow-hidden">
      <div className="border-b-2 border-(--color-border) px-4 py-3">
        <h3 className="kern-heading-small text-(--color-ink)">Tagesaktuell freie Plätze</h3>
      </div>
      <ReportScrollTable className="kern-table-responsive max-h-[280px] overflow-y-auto">
        <table className="kern-table kern-table--small kern-table--striped dashboard-table">
          <thead>
            <tr className="kern-table__row">
              <th className="kern-table__header report-sticky-1">JVA</th>
              <th className="kern-table__header report-sticky-2 report-sticky-edge">Maßnahmenkategorie</th>
              <th className="kern-table__header">Geschlecht</th>
              <th className="kern-table__header">Haftform</th>
              <th className="kern-table__header">Altersgruppe</th>
              <th className="kern-table__header">Haftart</th>
              <th className="kern-table__header">Freie Plätze</th>
              <th className="kern-table__header">Datenstand</th>
            </tr>
          </thead>
          <tbody className="kern-table__body">
            {rows.length === 0 ? (
              <tr className="kern-table__row">
                <td className="kern-table__cell" colSpan={8}>
                  <EmptyState description="Startzustand ohne Beispielzahlen — Daten aus BASIS" />
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.jvaId}-${i}`} className="kern-table__row">
                  <td className="kern-table__cell report-sticky-1">{r.jvaName}</td>
                  <td className="kern-table__cell report-sticky-2 report-sticky-edge">{r.courseType}</td>
                  <td className="kern-table__cell">{r.geschlecht}</td>
                  <td className="kern-table__cell">{r.haftform}</td>
                  <td className="kern-table__cell">{r.altersgruppe ?? "—"}</td>
                  <td className="kern-table__cell">{r.haftart ?? "—"}</td>
                  <td className="kern-table__cell">{formatNumber(r.freePlaces)}</td>
                  <td className="kern-table__cell">{r.dataStatus}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportScrollTable>
    </section>
  );
}
