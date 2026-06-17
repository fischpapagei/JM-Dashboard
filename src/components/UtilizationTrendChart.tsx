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
import { TREND_GRANULARITY_LABELS, type TrendGranularity } from "../utils/periods";

const GRANULARITIES: TrendGranularity[] = ["week", "month", "quarter", "year"];

function renderValueLabel(
  props: LabelProps,
  compact: boolean,
  granularity: TrendGranularity,
) {
  const { x, y, value, index = 0 } = props;
  if (value == null || x == null || y == null) return null;
  if (granularity === "week" && compact && index % 4 !== 0) return null;

  const numericValue = typeof value === "number" ? value : Number(value);
  return (
    <text
      x={Number(x)}
      y={Number(y) - 8}
      textAnchor="middle"
      fill="#1a3352"
      fontSize={compact ? 8 : 10}
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
  defaultGranularity?: TrendGranularity;
}

export function UtilizationTrendChart({
  records,
  filters,
  forcedJvaId,
  height,
  defaultGranularity = "month",
}: UtilizationTrendChartProps) {
  const [granularity, setGranularity] = useState<TrendGranularity>(defaultGranularity);
  const [showTrendLine, setShowTrendLine] = useState(true);

  const data = useMemo(() => {
    const base = buildUtilizationTrend(records, filters, forcedJvaId, granularity);
    const trend = linearRegressionTrend(base.map((point) => point.value));
    return base.map((point, index) => ({
      ...point,
      trend: trend[index],
    }));
  }, [records, filters, forcedJvaId, granularity]);

  const compact = height <= 250;
  const expanded = !compact;
  const tickAngle = granularity === "week" ? -55 : granularity === "month" && compact ? -40 : 0;
  const bottomMargin = granularity === "week" ? (compact ? 36 : 48) : compact ? 20 : 24;
  const topMargin = compact ? 20 : 24;
  const tickFontSize = compact ? 8 : 10;
  const tickInterval = granularity === "week" ? (compact ? 7 : 3) : 0;
  const leftMargin = expanded ? 28 : 18;
  const maxY = yAxisMax(data);

  return (
    <div className="flex h-full flex-col gap-3">
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
                  ? "bg-[#2d5a8e] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
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
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          ].join(" ")}
          aria-pressed={showTrendLine}
        >
          Trendlinie
        </button>
      </div>

      <div className="min-h-0 flex-1 pointer-events-none">
        <ResponsiveContainer width="100%" height={height - (compact ? 36 : 40)}>
          <LineChart data={data} margin={{ top: topMargin, right: 12, left: leftMargin, bottom: bottomMargin }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: tickFontSize, fill: "#64748b" }}
              interval={tickInterval}
              angle={tickAngle}
              textAnchor={tickAngle ? "end" : "middle"}
              height={tickAngle ? (compact ? 48 : 56) : 28}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, maxY]} width={48}>
              <Label
                value="Auslastungsquote in %"
                angle={-90}
                position="insideLeft"
                offset={expanded ? 4 : 0}
                style={{ fill: "#475569", fontSize: expanded ? 11 : 9, fontWeight: 600, textAnchor: "middle" }}
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
              stroke="#1a3352"
              strokeWidth={compact ? 2 : 2.5}
              dot={granularity === "week" && compact ? false : { r: compact ? 3 : 4 }}
              activeDot={{ r: 5 }}
              label={(props) => renderValueLabel(props, compact, granularity)}
            />
            {showTrendLine && (
              <Line
                type="monotone"
                dataKey="trend"
                name="trend"
                stroke="#dc2626"
                strokeWidth={compact ? 1.5 : 2}
                dot={false}
                strokeDasharray="6 4"
                activeDot={{ r: 4, fill: "#dc2626" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
