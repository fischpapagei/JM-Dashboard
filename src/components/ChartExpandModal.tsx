import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { EmptyState } from "./EmptyState";

interface ChartExpandModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  hasData: boolean;
  emptyDescription?: string;
  onClose: () => void;
  children: ReactNode;
}

export function ChartExpandModal({
  open,
  title,
  subtitle,
  hasData,
  emptyDescription = "Keine Daten für aktuelle Filterauswahl",
  onClose,
  children,
}: ChartExpandModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/45" onClick={onClose} aria-hidden />

      <div
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-expand-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 id="chart-expand-title" className="text-lg font-semibold text-(--color-ink)">
              {title}
            </h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" aria-hidden />
            Schließen
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-5">
          {hasData ? <div className="min-h-[420px]">{children}</div> : <EmptyState description={emptyDescription} />}
        </div>
      </div>
    </div>
  );
}
