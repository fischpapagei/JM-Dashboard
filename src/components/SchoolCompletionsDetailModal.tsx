import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SchoolCompletionTypeRow } from "../types/domain";
import { EmptyState } from "./EmptyState";
import { formatNumber } from "../utils/format";

interface SchoolCompletionsDetailModalProps {
  open: boolean;
  title: string;
  rows: SchoolCompletionTypeRow[];
  total?: number | null;
  onClose: () => void;
}

function typeKey(key: string) {
  return `type:${key}`;
}

export function SchoolCompletionsDetailModal({
  open,
  title,
  rows,
  total,
  onClose,
}: SchoolCompletionsDetailModalProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const computedTotal = useMemo(
    () => total ?? rows.reduce((sum, row) => sum + row.total, 0),
    [rows, total],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setExpanded(new Set());
  }, [open]);

  const toggle = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />

      <div className="relative mx-auto mt-16 w-full max-w-4xl rounded-xl border border-slate-200/80 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-(--color-ink)">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {formatNumber(computedTotal)} Abschlüsse gesamt — Anzahl anklicken für Verteilung nach JVA
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
          {rows.length === 0 ? (
            <EmptyState description="Keine Schulabschlüsse für die aktuelle Filterauswahl." />
          ) : (
            <div className="space-y-2">
              {rows.map((row) => {
                const key = typeKey(row.completionTypeKey);
                const isOpen = expanded.has(key);
                return (
                  <section
                    key={row.completionTypeKey}
                    className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 py-3 pl-4 pr-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{row.completionTypeLabel}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {row.jvaBreakdown.length}{" "}
                          {row.jvaBreakdown.length === 1 ? "JVA" : "JVAen"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          aria-expanded={isOpen}
                          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-(--color-accent) hover:bg-(--color-accent)/10 focus:outline-none focus:ring-2 focus:ring-(--color-accent)/40"
                        >
                          {formatNumber(row.total)}
                          <ChevronDown
                            className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                              <th className="py-2 pr-3">JVA</th>
                              <th className="py-2 text-right">Anzahl</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.jvaBreakdown.map((jvaRow) => (
                              <tr
                                key={jvaRow.jvaId}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="py-2 pr-3 font-medium text-slate-700">{jvaRow.jvaName}</td>
                                <td className="py-2 text-right font-semibold text-(--color-ink)">
                                  {formatNumber(jvaRow.count)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
