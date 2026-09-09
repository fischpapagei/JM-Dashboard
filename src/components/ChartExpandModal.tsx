import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { EmptyState } from "./EmptyState";
import { KernButton, KernHeading, KernText } from "../ui/kern";

export interface ChartExpandSize {
  width: number;
  height: number;
}

interface ChartExpandModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  hasData: boolean;
  emptyDescription?: string;
  onClose: () => void;
  children: (size: ChartExpandSize) => ReactNode;
}

function viewportChartSize(): ChartExpandSize {
  return {
    width: Math.max(window.innerWidth - 24, 320),
    height: Math.max(window.innerHeight - 140, 280),
  };
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
  const bodyRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartExpandSize>(viewportChartSize);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = bodyRef.current;
    if (!el) return;

    const update = () => {
      const width = Math.floor(el.clientWidth);
      const height = Math.floor(el.clientHeight);
      if (width <= 0 || height <= 0) return;
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] p-2 sm:p-3">
      <div className="absolute inset-0 bg-(--justiz-nachtblau)/55" onClick={onClose} aria-hidden />

      <div
        className="relative z-10 flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded border-2 border-(--color-border) bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-expand-title"
      >
        <div className="flex w-full shrink-0 items-start justify-between gap-4 border-b-2 border-(--color-border) px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <KernHeading id="chart-expand-title" level={3} size="small">
              {title}
            </KernHeading>
            {subtitle ? <KernText>{subtitle}</KernText> : null}
          </div>
          <KernButton type="button" variant="secondary" label="Schließen" onClick={onClose} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4">
          <div ref={bodyRef} className="min-h-0 min-w-0 flex-1">
            {hasData ? children(size) : (
              <EmptyState description={emptyDescription} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
