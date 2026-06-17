import type { DashboardFilters } from "../types/domain";
import { formatReportingPeriodLabel, formatTimeGranularityLabel } from "../utils/format";

interface PeriodContextHeadingProps {
  filters: DashboardFilters;
}

export function PeriodContextHeading({ filters }: PeriodContextHeadingProps) {
  const zeitraum = formatTimeGranularityLabel(filters.timeGranularity);
  const berichtszeitraum = formatReportingPeriodLabel(filters.reportingPeriod);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <h2 className="text-base font-semibold text-[#1a3352]">
        Zeitraum: {zeitraum}
        <span className="mx-2 font-normal text-slate-300">·</span>
        Berichtszeitraum: {berichtszeitraum}
      </h2>
    </div>
  );
}
