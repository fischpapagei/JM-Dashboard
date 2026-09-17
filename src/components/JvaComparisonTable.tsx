import type { JvaTableRow } from "../types/domain";
import { formatNumber, formatPercent } from "../utils/format";
import { EmptyState } from "./EmptyState";
import { ReportScrollTable } from "./ReportScrollTable";

interface JvaComparisonTableProps {
  rows: JvaTableRow[];
  onSelectJva?: (jvaId: string) => void;
}

export function JvaComparisonTable({ rows, onSelectJva }: JvaComparisonTableProps) {
  return (
    <section className="kern-card kern-card--hug dashboard-panel overflow-hidden">
      <div className="border-b-2 border-(--color-border) px-4 py-3">
        <h3 className="kern-heading-small text-(--color-ink)">Alle Anstalten</h3>
        <p className="kern-body kern-body--small text-(--color-muted)">Klick auf Zeile öffnet JVA-Stammdatenblatt</p>
      </div>
      <ReportScrollTable className="kern-table-responsive max-h-[280px] overflow-y-auto">
        <table className="kern-table kern-table--small kern-table--striped dashboard-table">
          <thead>
            <tr className="kern-table__row">
              <th className="kern-table__header report-sticky-1">JVA</th>
              <th className="kern-table__header report-sticky-2 report-sticky-edge">Überkategorien</th>
              <th className="kern-table__header">Grundbezeichnungen</th>
              <th className="kern-table__header">Teilnehmende</th>
              <th className="kern-table__header">Soll-Plätze</th>
              <th className="kern-table__header">Auslastung</th>
              <th className="kern-table__header">Freie Plätze</th>
              <th className="kern-table__header">Beendigungen</th>
              <th className="kern-table__header">Datenstand</th>
            </tr>
          </thead>
          <tbody className="kern-table__body">
            {rows.length === 0 ? (
              <tr className="kern-table__row">
                <td className="kern-table__cell" colSpan={9}>
                  <EmptyState description="Noch keine Kennzahlendaten geladen — Daten aus BASIS" />
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.jvaId}
                  className={`kern-table__row ${onSelectJva ? "cursor-pointer hover:bg-nachtblau-15" : ""}`}
                  onClick={() => onSelectJva?.(r.jvaId)}
                >
                  <td className="kern-table__cell font-semibold text-(--color-ink) report-sticky-1">{r.jvaName}</td>
                  <td className="kern-table__cell report-sticky-2 report-sticky-edge">{r.courseCategory}</td>
                  <td className="kern-table__cell">{r.courseType}</td>
                  <td className="kern-table__cell">{formatNumber(r.participants)}</td>
                  <td className="kern-table__cell">{formatNumber(r.targetPlaces)}</td>
                  <td className="kern-table__cell">{formatPercent(r.utilization)}</td>
                  <td className="kern-table__cell">{formatNumber(r.freePlaces)}</td>
                  <td className="kern-table__cell">{formatNumber(r.terminations)}</td>
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
