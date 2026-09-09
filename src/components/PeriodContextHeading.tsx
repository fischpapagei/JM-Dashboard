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
    <div className="kern-card kern-card--hug dashboard-panel">
      <div className="kern-card__container w-full">
      <p className="kern-label mb-2">Aktive Filter</p>
      <div className="flex flex-wrap gap-2">
        {summaryItems.map((item) => (
          <span
            key={item.label}
            className={`inline-flex max-w-full items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm ${
              item.isActive
                ? "border-(--justiz-petrol) bg-[#dceae6] text-(--color-ink)"
                : "border-(--color-border) bg-white text-(--color-ink)"
            }`}
          >
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-(--color-muted)">
              {item.label}
            </span>
            <span className="truncate font-semibold">{item.value}</span>
          </span>
        ))}
      </div>
      </div>
    </div>
  );
}
