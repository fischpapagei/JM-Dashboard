import type { FreeCapacityRow } from "../types/domain";
import { formatNumber } from "../utils/format";
import { EmptyState } from "./EmptyState";

interface FreeCapacityTableProps {
  rows: FreeCapacityRow[];
}

export function FreeCapacityTable({ rows }: FreeCapacityTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a3352]">Tagesaktuell freie Plätze</h3>
      </div>
      <div className="overflow-x-auto max-h-[280px]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">JVA</th>
              <th className="px-3 py-2 normal-case">MAßNAHMENKATEGORIE</th>
              <th className="px-3 py-2">Geschlecht</th>
              <th className="px-3 py-2">Haftform</th>
              <th className="px-3 py-2">Altersgruppe</th>
              <th className="px-3 py-2">Haftart</th>
              <th className="px-3 py-2">Freie Plätze</th>
              <th className="px-3 py-2">Datenstand</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-3">
                  <EmptyState description="Startzustand ohne Beispielzahlen — Daten aus BASIS-Web" />
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.jvaId}-${i}`} className="border-t border-slate-100">
                  <td className="px-3 py-2">{r.jvaName}</td>
                  <td className="px-3 py-2">{r.courseType}</td>
                  <td className="px-3 py-2">{r.geschlecht}</td>
                  <td className="px-3 py-2">{r.haftform}</td>
                  <td className="px-3 py-2">{r.altersgruppe ?? "—"}</td>
                  <td className="px-3 py-2">{r.haftart ?? "—"}</td>
                  <td className="px-3 py-2">{formatNumber(r.freePlaces)}</td>
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
