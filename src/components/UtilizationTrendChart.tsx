import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
} from "recharts";
import type { DashboardFilters, EducationMeasureRecord } from "../types/domain";
import { buildUtilizationTrend } from "../utils/aggregations";
import { linearRegressionTrend } from "../utils/calculations";
import {
  getEntwicklungZeitraumGranularity,
  getTrendTimelineForEntwicklungZeitraum,
  TREND_GRANULARITY_LABELS,
  type EntwicklungZeitraum,
  type TrendGranularity,
} from "../utils/periods";
import { CHART_FONT, CHART_GRID, CHART_LINE, CHART_TICK, CHART_TREND, chartDensity } from "../ui/chartTheme";

const GRANULARITIES: TrendGranularity[] = ["month", "quarter", "year"];

function renderValueLabel(
  props: LabelProps,
  density: ReturnType<typeof chartDensity>,
  granularity: TrendGranularity,
  showAllValueLabels: boolean,
) {
  const { x, y, value, index = 0 } = props;
  if (value == null || x == null || y == null) return null;
  if (!showAllValueLabels && granularity === "week" && density === "compact" && index % 4 !== 0) return null;

  const numericValue = typeof value === "number" ? value : Number(value);
  const font = CHART_FONT[density];
  return (
    <text
      x={Number(x)}
      y={Number(y) - font.valueOffset}
      textAnchor="middle"
      fill={CHART_LINE}
      fontSize={font.value}
      fontWeight={600}
    >
      {numericValue.toFixed(1)} %
    </text>
  );
}

function yAxisMax(data: Array<{ value: number; trend?: number }>): number {
  const peak = Math.max(...data.map((point) => Math.max(point.value, point.trend ?? 0)), 0);
  return Math.min(100, Math.ceil(peak * 1.12) || 100);
}

interface UtilizationTrendChartProps {
  records: EducationMeasureRecord[];
  filters: DashboardFilters;
  forcedJvaId?: string;
  height: number;
  width?: number;
  defaultGranularity?: TrendGranularity;
  entwicklungZeitraum?: EntwicklungZeitraum;
  berichtszeitpunkt?: string;
  hideControls?: boolean;
  pdfExportMode?: boolean;
}

export function UtilizationTrendChart({
  records,
  filters,
  forcedJvaId,
  height,
  width,
  defaultGranularity = "month",
  entwicklungZeitraum,
  berichtszeitpunkt,
  hideControls = false,
  pdfExportMode = false,
}: UtilizationTrendChartProps) {
  const lockedGranularity = entwicklungZeitraum
    ? getEntwicklungZeitraumGranularity(entwicklungZeitraum)
    : null;
  const [granularity, setGranularity] = useState<TrendGranularity>(
    lockedGranularity ?? defaultGranularity,
  );
  const [showTrendLine, setShowTrendLine] = useState(true);

  const effectiveGranularity = lockedGranularity ?? granularity;

  const data = useMemo(() => {
    const timeline = entwicklungZeitraum
      ? getTrendTimelineForEntwicklungZeitraum(entwicklungZeitraum, berichtszeitpunkt)
      : undefined;
    const base = buildUtilizationTrend(
      records,
      filters,
      forcedJvaId,
      effectiveGranularity,
      timeline,
    );
    const trend = linearRegressionTrend(base.map((point) => point.value));
    return base.map((point, index) => ({
      ...point,
      trend: trend[index],
    }));
  }, [records, filters, forcedJvaId, effectiveGranularity, entwicklungZeitraum, berichtszeitpunkt]);

  const density = chartDensity(height, pdfExportMode);
  const compact = density === "compact";
  const expanded = density !== "compact";
  const font = CHART_FONT[density];
  const controlsHeight = hideControls ? 0 : density === "modal" ? 48 : compact ? 36 : 40;
  const showAllValueLabels = pdfExportMode || density === "modal";
  const tickAngle = pdfExportMode ? 0 : effectiveGranularity === "week" ? -55 : effectiveGranularity === "month" && compact ? -40 : 0;
  const bottomMargin = pdfExportMode ? 32 : effectiveGranularity === "week" ? (compact ? 36 : 56) : density === "modal" ? 36 : compact ? 20 : 24;
  const topMargin = pdfExportMode ? 36 : density === "modal" ? 36 : compact ? 20 : 24;
  const tickInterval = pdfExportMode ? 0 : effectiveGranularity === "week" ? (compact ? 7 : 3) : 0;
  const leftMargin = density === "modal" ? 36 : expanded ? 28 : 18;
  const maxY = yAxisMax(data);

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-3">
      {!hideControls && !entwicklungZeitraum && (
      <div
        className="flex flex-wrap items-center gap-1 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {GRANULARITIES.map((option) => {
          const active = granularity === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setGranularity(option)}
              className={[
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-(--justiz-petrol) text-white"
                  : "border border-(--color-border) bg-white text-(--color-ink) hover:bg-[#dceae6]",
              ].join(" ")}
            >
              {TREND_GRANULARITY_LABELS[option]}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowTrendLine((current) => !current)}
          className={[
            "ml-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
            showTrendLine
              ? "border-(--justiz-rot) bg-[#fde8ea] text-(--justiz-rot)"
              : "border-(--color-border) bg-white text-(--color-ink) hover:bg-[#dceae6]",
          ].join(" ")}
          aria-pressed={showTrendLine}
        >
          Trendlinie
        </button>
      </div>
      )}

      <div className="min-h-0 w-full flex-1 pointer-events-none">
        <ResponsiveContainer
          width={width && width > 0 ? width : "100%"}
          height={Math.max(height - controlsHeight, 160)}
          minWidth={1}
          minHeight={1}
        >
          <LineChart data={data} margin={{ top: topMargin, right: 12, left: leftMargin, bottom: bottomMargin }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: font.tick, fill: CHART_TICK }}
              interval={tickInterval}
              angle={tickAngle}
              textAnchor={tickAngle ? "end" : "middle"}
              height={tickAngle ? (compact ? 48 : 64) : density === "modal" ? 40 : 28}
            />
            <YAxis tick={{ fontSize: font.tick, fill: CHART_TICK }} domain={[0, maxY]} width={font.yWidth}>
              <Label
                value="Auslastungsquote in %"
                angle={-90}
                position="insideLeft"
                offset={density === "modal" ? 8 : expanded ? 4 : 0}
                style={{ fill: CHART_TICK, fontSize: font.axis, fontWeight: 600, textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip
              formatter={(value, name) => [
                `${value} %`,
                name === "trend" ? "Trendlinie" : "Auslastung",
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="value"
              stroke={CHART_LINE}
              strokeWidth={density === "modal" ? 3.5 : pdfExportMode ? 2.5 : compact ? 2 : 2.5}
              isAnimationActive={!pdfExportMode}
              dot={
                showAllValueLabels || !(effectiveGranularity === "week" && compact)
                  ? { r: density === "modal" ? 6 : pdfExportMode ? 5 : compact ? 3 : 4, fill: CHART_LINE, strokeWidth: 0 }
                  : false
              }
              activeDot={{ r: density === "modal" ? 7 : 5 }}
              label={(props) => renderValueLabel(props, density, effectiveGranularity, showAllValueLabels)}
            />
            {showTrendLine && (
              <Line
                type="monotone"
                dataKey="trend"
                name="trend"
                stroke={CHART_TREND}
                strokeWidth={density === "modal" ? 3 : pdfExportMode ? 2 : compact ? 1.5 : 2}
                isAnimationActive={!pdfExportMode}
                dot={false}
                strokeDasharray="6 4"
                activeDot={{ r: 4, fill: CHART_TREND }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
