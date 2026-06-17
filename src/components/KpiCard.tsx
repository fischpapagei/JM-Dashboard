import { Badge } from "./Badge";
import { formatAverageNumber, formatNumber, formatPercent } from "../utils/format";

interface KpiCardProps {
  title: string;
  value: number | null;
  subtitle?: string;
  unit?: string;
  suffix?: string;
  suffixValue?: number | null;
  suffixLabel?: string;
  isPercent?: boolean;
  format?: "number" | "percent";
  nrwComparison?: string | number | null;
  nrwComparisonSuffixValue?: number | null;
  nrwComparisonSuffixLabel?: string;
  nrwComparisonIsAverage?: boolean;
  previousValue?: number | null;
  previousSuffix?: string;
  previousSuffixValue?: number | null;
  previousSuffixLabel?: string;
  previousPeriodLabel?: string | null;
  badge?: string;
  showNotLoadedBadge?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

function formatSuffix(
  suffixValue?: number | null,
  suffixLabel = "",
  fallbackSuffix = "",
): string {
  if (suffixValue != null) return ` / ${formatNumber(suffixValue)}${suffixLabel}`;
  return fallbackSuffix;
}

export function KpiCard({
  title,
  value,
  subtitle = "Daten aus BASIS-Web",
  unit = "",
  suffix = "",
  suffixValue,
  suffixLabel = "",
  isPercent,
  format,
  nrwComparison,
  nrwComparisonSuffixValue,
  nrwComparisonSuffixLabel = "",
  nrwComparisonIsAverage = false,
  previousValue,
  previousSuffix = "",
  previousSuffixValue,
  previousSuffixLabel = "",
  previousPeriodLabel,
  badge,
  showNotLoadedBadge,
  onClick,
  compact = false,
}: KpiCardProps) {
  const asPercent = isPercent ?? format === "percent";
  const display = asPercent
    ? formatPercent(value)
    : formatNumber(value) + formatSuffix(suffixValue, suffixLabel, suffix || unit);

  const previousDisplay =
    previousPeriodLabel != null
      ? asPercent
        ? formatPercent(previousValue)
        : formatNumber(previousValue) +
          formatSuffix(previousSuffixValue, previousSuffixLabel, previousSuffix)
      : undefined;

  const formatNrwPart = (part: number | null | undefined, asPercentValue: boolean) => {
    if (asPercentValue) return formatPercent(part);
    return nrwComparisonIsAverage ? formatAverageNumber(part) : formatNumber(part);
  };

  const nrwText =
    nrwComparison === undefined
      ? undefined
      : typeof nrwComparison === "string"
        ? nrwComparison || "—"
        : formatNrwPart(nrwComparison, asPercent) +
          (nrwComparisonSuffixValue != null
            ? ` / ${formatNrwPart(nrwComparisonSuffixValue, false)}${nrwComparisonSuffixLabel}`
            : "");

  const showBadge = badge ?? (showNotLoadedBadge !== false && value === null);

  const clickable = Boolean(onClick);

  return (
    <article
      className={[
        "rounded-xl border border-slate-200/80 bg-white shadow-sm",
        compact ? "p-3" : "p-4",
        clickable ? "cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/40" : "",
      ].join(" ")}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className={["flex items-start justify-between gap-2", compact ? "mb-1.5" : "mb-2"].join(" ")}>
        <h3 className={compact ? "text-xs font-medium text-slate-600" : "text-sm font-medium text-slate-600"}>{title}</h3>
        {showBadge && (
          <Badge variant={badge === "Demo-Daten" ? "demo" : "empty"}>
            {badge ?? "nicht geladen"}
          </Badge>
        )}
      </div>
      <p className={[
        "text-center font-semibold text-[#1a3352]",
        compact ? "py-0.5 text-xl" : "py-1 text-2xl",
      ].join(" ")}>{display}</p>
      {previousDisplay !== undefined && (
        <p className={compact ? "text-center text-xs text-slate-500" : "text-center text-sm text-slate-500"}>
          {previousPeriodLabel}: {previousDisplay}
        </p>
      )}
      <p className={compact ? "text-center text-[11px] text-slate-500" : "text-center text-xs text-slate-500"}>{subtitle}</p>
      {nrwText !== undefined && (
        <p className={compact ? "mt-1.5 text-center text-[11px] text-slate-500" : "mt-2 text-center text-xs text-slate-500"}>NRW-Vergleich: {nrwText}</p>
      )}
    </article>
  );
}
