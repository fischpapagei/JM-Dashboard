import type { JvaOperationalRow } from "../utils/aggregations";
import { formatNumber } from "../utils/format";
import { EmptyState } from "./EmptyState";

interface JvaOperationalTableProps {
  rows: JvaOperationalRow[];
  onSelectJva?: (jvaId: string) => void;
}

export function JvaOperationalTable({ rows, onSelectJva }: JvaOperationalTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-(--color-ink)">Personal & eLis nach Anstalt</h3>
        <p className="text-xs text-slate-500">Landesweite Aufschlüsselung aller JVAen</p>
      </div>
      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">JVA</th>
              <th className="px-3 py-2">Stellen</th>
              <th className="px-3 py-2">Besetzt</th>
              <th className="px-3 py-2">Extern</th>
              <th className="px-3 py-2">eLis Lernplätze</th>
              <th className="px-3 py-2">Mandantschaften</th>
              <th className="px-3 py-2">Digitale Sozialräume</th>
              <th className="px-3 py-2">Hafträume</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-3">
                  <EmptyState description="Noch keine Kennzahlendaten geladen — Daten aus BASIS-Web" />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.jvaId}
                  className={`border-t border-slate-100 ${onSelectJva ? "cursor-pointer hover:bg-blue-50" : ""}`}
                  onClick={() => onSelectJva?.(row.jvaId)}
                >
                  <td className="px-3 py-2 font-medium text-(--color-accent)">{row.jvaName}</td>
                  <td className="px-3 py-2">{formatNumber(row.paedStellen)}</td>
                  <td className="px-3 py-2">{formatNumber(row.paedBesetzt)}</td>
                  <td className="px-3 py-2">{formatNumber(row.paedExtern)}</td>
                  <td className="px-3 py-2">{formatNumber(row.elisLernplaetze)}</td>
                  <td className="px-3 py-2">{formatNumber(row.elisMandantschaften)}</td>
                  <td className="px-3 py-2">{formatNumber(row.elisDigitaleSozialraeume)}</td>
                  <td className="px-3 py-2">{formatNumber(row.elisHaftraeume)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
