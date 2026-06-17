import { Maximize2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ChartExpandModal } from "./ChartExpandModal";
import { EmptyState } from "./EmptyState";

interface ChartShellProps {
  title: string;
  subtitle?: string;
  hasData: boolean;
  emptyDescription?: string;
  expandable?: boolean;
  interactiveChart?: boolean;
  expandedChart?: (height: number) => ReactNode;
  className?: string;
  previewHeight?: number;
}

export function ChartShell({
  title,
  subtitle,
  hasData,
  emptyDescription = "Keine Daten für aktuelle Filterauswahl",
  expandable = false,
  interactiveChart = false,
  expandedChart,
  className = "",
  previewHeight = 200,
}: ChartShellProps) {
  const [open, setOpen] = useState(false);
  const canExpand = expandable && expandedChart;

  const handleOpen = () => {
    if (canExpand) setOpen(true);
  };

  return (
    <>
      <section
        className={[
          "rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm",
          canExpand ? "cursor-pointer transition-colors hover:border-slate-300 hover:shadow-md" : "",
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
          <div>
            <h3 className="text-sm font-semibold text-[#1a3352]">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {canExpand && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <Maximize2 className="h-3 w-3" aria-hidden />
              Vergrößern
            </span>
          )}
        </header>
        {hasData ? (
          <div className={interactiveChart ? "min-h-0" : "min-h-0 pointer-events-none"} style={{ minHeight: previewHeight }}>
            {expandedChart?.(previewHeight)}
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
          {expandedChart?.(420)}
        </ChartExpandModal>
      )}
    </>
  );
}
