import { Info, Maximize2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChartExpandModal } from "./ChartExpandModal";
import { EmptyState } from "./EmptyState";

interface ChartShellProps {
  title: string;
  subtitle?: string;
  infoDescription?: string;
  hasData: boolean;
  emptyDescription?: string;
  expandable?: boolean;
  interactiveChart?: boolean;
  expandedChart?: (height: number, width?: number) => ReactNode;
  className?: string;
  previewHeight?: number;
  expandedHeight?: number;
  surface?: "default" | "inset";
  pdfExportMode?: boolean;
}

function ChartInfoTooltip({ description }: { description: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const tooltipWidth = 288;
    const margin = 12;
    const estimatedHeight = 72;
    const preferredLeft = rect.right + margin;
    const left = Math.max(
      margin,
      Math.min(
        preferredLeft + tooltipWidth > window.innerWidth - margin
          ? rect.left - tooltipWidth - margin
          : preferredLeft,
        window.innerWidth - tooltipWidth - margin,
      ),
    );
    const centeredTop = rect.top + rect.height / 2 - estimatedHeight / 2;
    const top = Math.max(
      margin,
      Math.min(centeredTop, window.innerHeight - estimatedHeight - margin),
    );

    setPosition({ top, left });
  };

  const handleOpen = () => {
    clearCloseTimeout();
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimeout(), []);

  const tooltip = open
    ? createPortal(
        <div
          role="tooltip"
          style={{ top: position.top, left: position.left }}
          className="fixed z-[100] w-72 max-w-[calc(100vw-1.5rem)] rounded border-2 border-(--color-border) bg-white p-3 text-sm leading-relaxed text-(--color-ink) shadow-xl"
          onMouseEnter={handleOpen}
          onMouseLeave={scheduleClose}
        >
          <p>{description}</p>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Erklärung anzeigen"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-(--color-border) bg-white text-(--color-accent) hover:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onMouseEnter={handleOpen}
        onMouseLeave={scheduleClose}
      >
        <Info className="h-3 w-3" aria-hidden />
      </button>
      {tooltip}
    </>
  );
}

export function ChartShell({
  title,
  subtitle,
  infoDescription,
  hasData,
  emptyDescription = "Keine Daten für aktuelle Filterauswahl",
  expandable = false,
  interactiveChart = false,
  expandedChart,
  className = "",
  previewHeight = 200,
  expandedHeight = 420,
  surface = "default",
  pdfExportMode = false,
}: ChartShellProps) {
  const [open, setOpen] = useState(false);
  const canExpand = expandable && expandedChart && !pdfExportMode;
  const chartHeight = pdfExportMode ? expandedHeight : previewHeight;
  const surfaceClass =
    surface === "inset" ? "dashboard-kpi dashboard-kpi--inset" : "dashboard-kpi";

  const handleOpen = () => {
    if (canExpand) setOpen(true);
  };

  return (
    <>
      <section
        className={[
          "rounded p-4",
          surfaceClass,
          canExpand
            ? "cursor-pointer transition-colors hover:border-(--color-accent) hover:shadow-md"
            : "",
          className,
        ].join(" ")}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onClick={canExpand ? handleOpen : undefined}
        onKeyDown={(e) => {
          if (!canExpand) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        <header className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h3 className="kern-heading-small text-(--color-ink)">{title}</h3>
              {infoDescription && !pdfExportMode && <ChartInfoTooltip description={infoDescription} />}
            </div>
            {subtitle && <p className="kern-body kern-body--small mt-1 text-(--color-muted)">{subtitle}</p>}
          </div>
          {canExpand && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-(--justiz-petrol) px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Maximize2 className="h-3 w-3" aria-hidden />
              Vergrößern
            </span>
          )}
        </header>
        {hasData ? (
          <div
            className={interactiveChart && !pdfExportMode ? "min-h-0" : "min-h-0 pointer-events-none"}
            style={{ minHeight: chartHeight }}
            data-pdf-expand={pdfExportMode ? true : undefined}
          >
            {expandedChart?.(chartHeight)}
          </div>
        ) : (
          <EmptyState description={emptyDescription} />
        )}
      </section>

      {canExpand && (
        <ChartExpandModal
          open={open}
          title={title}
          subtitle={subtitle}
          hasData={hasData}
          emptyDescription={emptyDescription}
          onClose={() => setOpen(false)}
        >
          {(size) => (
            <div
              className="relative overflow-hidden"
              style={{ width: size.width, height: size.height }}
            >
              {expandedChart?.(size.height, size.width)}
            </div>
          )}
        </ChartExpandModal>
      )}
    </>
  );
}
