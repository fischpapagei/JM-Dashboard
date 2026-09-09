import { useEffect, type ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { KernButton, KernHeading, KernText } from "../ui/kern";

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
      <div className="absolute inset-0 bg-(--justiz-nachtblau)/55" onClick={onClose} aria-hidden />

      <div
        className="kern-card relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-expand-title"
      >
        <div className="flex w-full items-start justify-between gap-4 border-b-2 border-(--color-border) px-5 py-4">
          <div>
            <KernHeading id="chart-expand-title" level={3} size="small">
              {title}
            </KernHeading>
            {subtitle ? <KernText>{subtitle}</KernText> : null}
          </div>
          <KernButton type="button" variant="secondary" label="Schließen" onClick={onClose} />
        </div>

        <div className="flex-1 overflow-auto px-5 py-5">
          {hasData ? <div className="min-h-[420px]">{children}</div> : <EmptyState description={emptyDescription} />}
        </div>
      </div>
    </div>
  );
}
