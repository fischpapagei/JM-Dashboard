import type { DashboardFilters } from "../types/domain";
import { buildFilterSummary, type FilterSummaryOptions } from "../utils/filterSummary";

interface PeriodContextHeadingProps extends FilterSummaryOptions {
  filters: DashboardFilters;
}

export function PeriodContextHeading({
  filters,
  variant = "default",
  hideJva = false,
}: PeriodContextHeadingProps) {
  const summaryItems = buildFilterSummary(filters, { variant, hideJva });

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Aktive Filter</p>
      <div className="flex flex-wrap gap-2">
        {summaryItems.map((item) => (
          <span
            key={item.label}
            className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              item.isActive
                ? "border-[#2d5a8e]/35 bg-[#2d5a8e]/10 text-[#1a3352]"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </span>
            <span className="truncate font-medium">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
