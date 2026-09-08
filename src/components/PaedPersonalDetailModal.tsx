import { useEffect, useMemo } from "react";
import type { JvaOperationalRow } from "../utils/aggregations";
import { EmptyState } from "./EmptyState";
import { formatNumber } from "../utils/format";

interface PaedPersonalDetailModalProps {
  open: boolean;
  title: string;
  rows: JvaOperationalRow[];
  totalStellen?: number | null;
  totalBesetzt?: number | null;
  totalExtern?: number | null;
  onClose: () => void;
}

export function PaedPersonalDetailModal({
  open,
  title,
  rows,
  totalStellen,
  totalBesetzt,
  totalExtern,
  onClose,
}: PaedPersonalDetailModalProps) {
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.jvaName.localeCompare(b.jvaName, "de-DE")),
    [rows],
  );

  const computedStellen = useMemo(
    () => totalStellen ?? sortedRows.reduce((sum, row) => sum + (row.paedStellen ?? 0), 0),
    [sortedRows, totalStellen],
  );

  const computedBesetzt = useMemo(
    () => totalBesetzt ?? sortedRows.reduce((sum, row) => sum + (row.paedBesetzt ?? 0), 0),
    [sortedRows, totalBesetzt],
  );

  const computedExtern = useMemo(
    () => totalExtern ?? sortedRows.reduce((sum, row) => sum + (row.paedExtern ?? 0), 0),
    [sortedRows, totalExtern],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />

      <div className="relative mx-auto mt-16 w-full max-w-3xl rounded-xl border border-slate-200/80 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#1a3352]">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {formatNumber(computedStellen)} Stellen gesamt · davon {formatNumber(computedBesetzt)} besetzt ·{" "}
              {formatNumber(computedExtern)} externe Kräfte
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Schließen
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-5 py-4">
          {sortedRows.length === 0 ? (
            <EmptyState description="Noch keine Personal-Daten geladen — Daten aus BASIS-Web" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3 font-medium">JVA</th>
                  <th className="py-2 pr-3 text-right font-medium">Anzahl Stellen</th>
                  <th className="py-2 pr-3 text-right font-medium">davon besetzt</th>
                  <th className="py-2 text-right font-medium">Externe Kräfte</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.jvaId} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-slate-800">{row.jvaName}</td>
                    <td className="py-2.5 pr-3 text-right text-slate-700">{formatNumber(row.paedStellen)}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold text-[#1a3352]">
                      {formatNumber(row.paedBesetzt)}
                    </td>
                    <td className="py-2.5 text-right text-slate-700">{formatNumber(row.paedExtern)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
