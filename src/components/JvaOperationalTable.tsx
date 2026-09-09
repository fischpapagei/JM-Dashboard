import type { JvaOperationalRow } from "../utils/aggregations";
import { formatNumber } from "../utils/format";
import { EmptyState } from "./EmptyState";

interface JvaOperationalTableProps {
  rows: JvaOperationalRow[];
  onSelectJva?: (jvaId: string) => void;
}

export function JvaOperationalTable({ rows, onSelectJva }: JvaOperationalTableProps) {
  return (
    <section className="kern-card kern-card--hug dashboard-panel overflow-hidden">
      <div className="border-b-2 border-(--color-border) px-4 py-3">
        <h3 className="kern-heading-small text-(--color-ink)">Personal & eLis nach Anstalt</h3>
        <p className="kern-body kern-body--small text-(--color-muted)">Landesweite Aufschlüsselung aller JVAen</p>
      </div>
      <div className="kern-table-responsive max-h-[280px] overflow-x-auto overflow-y-auto">
        <table className="kern-table kern-table--small kern-table--striped dashboard-table">
          <thead>
            <tr className="kern-table__row">
              <th className="kern-table__header">JVA</th>
              <th className="kern-table__header">Stellen</th>
              <th className="kern-table__header">Besetzt</th>
              <th className="kern-table__header">Extern</th>
              <th className="kern-table__header">eLis Lernplätze</th>
              <th className="kern-table__header">Mandantschaften</th>
              <th className="kern-table__header">Digitale Sozialräume</th>
              <th className="kern-table__header">Hafträume</th>
            </tr>
          </thead>
          <tbody className="kern-table__body">
            {rows.length === 0 ? (
              <tr className="kern-table__row">
                <td className="kern-table__cell" colSpan={8}>
                  <EmptyState description="Noch keine Kennzahlendaten geladen — Daten aus BASIS-Web" />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.jvaId}
                  className={`kern-table__row ${onSelectJva ? "cursor-pointer hover:bg-[#dceae6]" : ""}`}
                  onClick={() => onSelectJva?.(row.jvaId)}
                >
                  <td className="kern-table__cell font-semibold text-(--color-ink)">{row.jvaName}</td>
                  <td className="kern-table__cell">{formatNumber(row.paedStellen)}</td>
                  <td className="kern-table__cell">{formatNumber(row.paedBesetzt)}</td>
                  <td className="kern-table__cell">{formatNumber(row.paedExtern)}</td>
                  <td className="kern-table__cell">{formatNumber(row.elisLernplaetze)}</td>
                  <td className="kern-table__cell">{formatNumber(row.elisMandantschaften)}</td>
                  <td className="kern-table__cell">{formatNumber(row.elisDigitaleSozialraeume)}</td>
                  <td className="kern-table__cell">{formatNumber(row.elisHaftraeume)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
