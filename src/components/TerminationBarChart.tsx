import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
} from "recharts";
import { formatNumber } from "../utils/format";

const COLORS = ["#1a3352", "#2d5a8e", "#4a7ab5", "#6b9cd4", "#8bb8e8", "#a8cce8", "#c5dff5"];

export interface TerminationChartDatum {
  name: string;
  value: number;
  key?: string;
}

interface TerminationBarChartProps {
  data: TerminationChartDatum[];
  height: number;
}

interface AxisTickProps {
  x?: string | number;
  y?: string | number;
  payload?: { value: string };
}

function wrapLabel(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.length > 0 ? lines : [text];
}

function computeYAxisWidth(names: string[], expanded: boolean): number {
  const maxCharsPerLine = expanded ? 32 : 16;
  let longestLine = 0;

  for (const name of names) {
    for (const line of wrapLabel(name, maxCharsPerLine)) {
      longestLine = Math.max(longestLine, line.length);
    }
  }

  const charWidth = expanded ? 6.2 : 5.2;
  const minWidth = expanded ? 64 : 44;
  const maxWidth = expanded ? 280 : 118;
  return Math.min(maxWidth, Math.max(minWidth, Math.ceil(longestLine * charWidth) + 8));
}

function ReasonAxisTick({ x = 0, y = 0, payload, expanded }: AxisTickProps & { expanded: boolean }) {
  const label = payload?.value ?? "";
  const lines = wrapLabel(label, expanded ? 32 : 16);
  const xPos = Number(x) - 4;

  return (
    <text x={xPos} y={Number(y)} textAnchor="end" dominantBaseline="middle" fill="#475569" fontSize={expanded ? 11 : 8}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={xPos} dy={index === 0 ? 0 : 11}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function renderBarValueLabel(props: LabelProps, total: number, compact: boolean) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  const count = typeof value === "number" ? value : Number(value ?? 0);
  if (!count) return null;

  const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
  const barWidth = Number(width);
  const inside = barWidth > (compact ? 52 : 72);

  return (
    <text
      x={inside ? Number(x) + barWidth - 6 : Number(x) + barWidth + 6}
      y={Number(y) + Number(height) / 2}
      textAnchor={inside ? "end" : "start"}
      dominantBaseline="middle"
      fill={inside ? "#ffffff" : "#1a3352"}
      fontSize={compact ? 8 : 10}
      fontWeight={600}
    >
      {formatNumber(count)} ({percent} %)
    </text>
  );
}

function xAxisMax(data: TerminationChartDatum[]): number {
  const peak = Math.max(...data.map((item) => item.value), 0);
  return Math.ceil(peak * 1.12) || 1;
}

export function TerminationBarChart({ data, height }: TerminationBarChartProps) {
  const expanded = height > 250;
  const compact = !expanded;

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data],
  );

  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  const yAxisWidth = computeYAxisWidth(
    sorted.map((item) => item.name),
    expanded,
  );
  const maxX = xAxisMax(sorted);
  const rowGap = compact ? 6 : 10;
  const minRowHeight = compact ? 22 : 28;
  const minContentHeight = sorted.length * (minRowHeight + rowGap) + 20;
  const contentHeight = Math.max(height, minContentHeight);
  const maxBarSize = Math.max(minRowHeight, Math.floor((contentHeight - 20) / sorted.length) - rowGap);

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden" style={{ maxHeight: height }}>
      <ResponsiveContainer width="100%" height={contentHeight}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: expanded ? 16 : 8, left: 4, bottom: 4 }}
          barCategoryGap={rowGap}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[0, maxX]}
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickFormatter={(value) => formatNumber(Number(value))}
            hide={compact}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            tick={(props) => <ReasonAxisTick {...props} expanded={expanded} />}
          />
          <Tooltip
            formatter={(value) => {
              const count = typeof value === "number" ? value : Number(value ?? 0);
              const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
              return [`${formatNumber(count)} (${percent} %)`, "Anzahl"];
            }}
            labelFormatter={(label) => String(label)}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            maxBarSize={maxBarSize}
            label={(props) => renderBarValueLabel(props, total, compact)}
          >
            {sorted.map((entry, index) => (
              <Cell key={entry.key ?? index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
