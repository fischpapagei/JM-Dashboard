import type { JvaTableRow } from "../types/domain";
import { formatNumber, formatPercent } from "../utils/format";
import { EmptyState } from "./EmptyState";

interface JvaComparisonTableProps {
  rows: JvaTableRow[];
  onSelectJva?: (jvaId: string) => void;
}

export function JvaComparisonTable({ rows, onSelectJva }: JvaComparisonTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a3352]">Alle Anstalten</h3>
        <p className="text-xs text-slate-500">Klick auf Zeile öffnet JVA-Stammdatenblatt</p>
      </div>
      <div className="overflow-x-auto max-h-[280px]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">JVA</th>
              <th className="px-3 py-2">Überkategorien</th>
              <th className="px-3 py-2">Grundbezeichnungen</th>
              <th className="px-3 py-2">Teilnehmende</th>
              <th className="px-3 py-2">Soll-Plätze</th>
              <th className="px-3 py-2">Auslastung</th>
              <th className="px-3 py-2">Freie Plätze</th>
              <th className="px-3 py-2">Beendigungen</th>
              <th className="px-3 py-2">Datenstand</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-3">
                  <EmptyState description="Noch keine Kennzahlendaten geladen — Daten aus BASIS-Web" />
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.jvaId}
                  className={`border-t border-slate-100 ${onSelectJva ? "cursor-pointer hover:bg-blue-50" : ""}`}
                  onClick={() => onSelectJva?.(r.jvaId)}
                >
                  <td className="px-3 py-2 font-medium text-[#2d5a8e]">{r.jvaName}</td>
                  <td className="px-3 py-2">{r.courseCategory}</td>
                  <td className="px-3 py-2">{r.courseType}</td>
                  <td className="px-3 py-2">{formatNumber(r.participants)}</td>
                  <td className="px-3 py-2">{formatNumber(r.targetPlaces)}</td>
                  <td className="px-3 py-2">{formatPercent(r.utilization)}</td>
                  <td className="px-3 py-2">{formatNumber(r.freePlaces)}</td>
                  <td className="px-3 py-2">{formatNumber(r.terminations)}</td>
                  <td className="px-3 py-2 text-slate-500">{r.dataStatus}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
