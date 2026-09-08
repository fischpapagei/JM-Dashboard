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
  valueLabel?: string;
  badge?: string;
  showNotLoadedBadge?: boolean;
  onClick?: () => void;
  compact?: boolean;
  surface?: "default" | "inset";
  accent?: "default" | "purple";
  exportMode?: boolean;
  secondaryMetric?: {
    label: string;
    value: number | null;
    isPercent?: boolean;
    previousValue?: number | null;
  };
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
  valueLabel,
  badge,
  showNotLoadedBadge,
  onClick,
  compact = false,
  surface = "default",
  accent = "default",
  exportMode = false,
  secondaryMetric,
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

  const clickable = Boolean(onClick) && !exportMode;
  const surfaceClass =
    accent === "purple"
      ? "border-violet-300/80 bg-gradient-to-br from-violet-50 via-purple-50 to-violet-100 shadow-sm ring-1 ring-violet-200/70"
      : surface === "inset"
        ? "border-slate-200/90 bg-slate-50/90 shadow-sm ring-1 ring-slate-100/80"
        : "border-slate-200/80 bg-white shadow-sm";
  const titleClass =
    accent === "purple"
      ? compact
        ? "text-xs font-medium text-violet-800"
        : exportMode
          ? "text-xs font-medium leading-snug text-violet-800"
          : "text-sm font-medium text-violet-800"
      : compact
        ? "text-xs font-medium text-slate-600"
        : exportMode
          ? "text-xs font-medium leading-snug text-slate-600"
          : "text-sm font-medium text-slate-600";
  const valueClass =
    accent === "purple" ? "text-violet-950" : "text-[#1a3352]";
  const metaClass =
    accent === "purple" ? "text-violet-700/80" : "text-slate-500";
  const dividerClass = accent === "purple" ? "border-violet-200" : "border-slate-200";
  const secondaryDisplay = secondaryMetric
    ? secondaryMetric.isPercent
      ? formatPercent(secondaryMetric.value)
      : formatNumber(secondaryMetric.value)
    : undefined;
  const secondaryPreviousDisplay =
    secondaryMetric && previousPeriodLabel != null
      ? secondaryMetric.isPercent
        ? formatPercent(secondaryMetric.previousValue)
        : formatNumber(secondaryMetric.previousValue)
      : undefined;

  return (
    <article
      className={[
        "rounded-xl border",
        surfaceClass,
        compact ? "p-3" : "p-4",
        clickable
          ? accent === "purple"
            ? "cursor-pointer hover:border-violet-400 hover:from-violet-100 hover:to-purple-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-300/50"
            : surface === "inset"
              ? "cursor-pointer hover:border-[#2d5a8e]/30 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/40"
              : "cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/40"
          : "",
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
        <h3 className={titleClass}>{title}</h3>
        {showBadge && (
          <Badge variant={badge === "Demo-Daten" ? "demo" : "empty"}>
            {badge ?? "nicht geladen"}
          </Badge>
        )}
      </div>
      {valueLabel && (
        <p className={`text-center text-[11px] font-medium ${titleClass}`}>{valueLabel}</p>
      )}
      <p className={[
        "text-center font-semibold",
        valueClass,
        compact ? "py-0.5 text-xl" : exportMode ? "py-1 text-xl" : "py-1 text-2xl",
      ].join(" ")}>{display}</p>
      {previousDisplay !== undefined && (
        <p className={compact ? `text-center text-xs ${metaClass}` : exportMode ? `text-center text-[11px] leading-snug ${metaClass}` : `text-center text-sm ${metaClass}`}>
          {previousPeriodLabel}: {previousDisplay}
        </p>
      )}
      {secondaryMetric && (
        <div className={`mt-3 border-t pt-3 ${dividerClass}`}>
          <p className={`text-center font-medium leading-snug ${exportMode ? "text-[10px]" : "text-[11px]"} ${titleClass}`}>
            {secondaryMetric.label}
          </p>
          <p className={`text-center font-semibold ${valueClass} ${exportMode ? "text-base" : "text-lg"}`}>{secondaryDisplay}</p>
          {secondaryPreviousDisplay !== undefined && (
            <p className={`text-center leading-snug ${exportMode ? "text-[10px]" : "text-xs"} ${metaClass}`}>
              {previousPeriodLabel}: {secondaryPreviousDisplay}
            </p>
          )}
        </div>
      )}
      <p className={compact ? `text-center text-[11px] ${metaClass}` : exportMode ? `text-center text-[10px] leading-snug ${metaClass}` : `text-center text-xs ${metaClass}`}>{subtitle}</p>
      {nrwText !== undefined && (
        <p className={compact ? `mt-1.5 text-center text-[11px] ${metaClass}` : exportMode ? `mt-2 text-center text-[10px] leading-snug ${metaClass}` : `mt-2 text-center text-xs ${metaClass}`}>NRW-Vergleich: {nrwText}</p>
      )}
    </article>
  );
}
