import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
} from "recharts";
import { formatPercent } from "../utils/format";

export interface CourseUtilizationChartDatum {
  name: string;
  value: number;
}

interface CourseUtilizationBarChartProps {
  data: CourseUtilizationChartDatum[];
  height: number;
  pdfExportMode?: boolean;
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
  const maxCharsPerLine = expanded ? 32 : 14;
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

function CourseAxisTick({ x = 0, y = 0, payload, expanded }: AxisTickProps & { expanded: boolean }) {
  const label = payload?.value ?? "";
  const lines = wrapLabel(label, expanded ? 32 : 14);
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

function renderBarPercentLabel(props: LabelProps, compact: boolean) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  const percent = typeof value === "number" ? value : Number(value ?? 0);
  if (!percent) return null;

  const barWidth = Number(width);
  const inside = barWidth > (compact ? 40 : 52);
  const label = formatPercent(percent);

  return (
    <text
      x={inside ? Number(x) + barWidth - 6 : Number(x) + barWidth + 6}
      y={Number(y) + Number(height) / 2}
      textAnchor={inside ? "end" : "start"}
      dominantBaseline="middle"
      fill={inside ? "#ffffff" : "var(--color-ink)"}
      fontSize={compact ? 8 : 10}
      fontWeight={600}
    >
      {label}
    </text>
  );
}

export function CourseUtilizationBarChart({
  data,
  height,
  pdfExportMode = false,
}: CourseUtilizationBarChartProps) {
  const expanded = pdfExportMode || height > 250;
  const compact = !expanded;

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data],
  );

  const yAxisWidth = computeYAxisWidth(
    sorted.map((item) => item.name),
    expanded,
  );
  const rowGap = compact ? 6 : 10;
  const minRowHeight = compact ? 22 : 28;
  const minContentHeight = sorted.length * (minRowHeight + rowGap) + (expanded ? 36 : 32);
  const contentHeight = Math.max(height, minContentHeight);
  const maxBarSize = Math.max(minRowHeight, Math.floor((contentHeight - 36) / sorted.length) - rowGap);
  const bottomMargin = expanded ? 28 : 22;

  return (
    <div
      className={
        pdfExportMode
          ? "h-full w-full overflow-visible"
          : "h-full w-full overflow-y-auto overflow-x-hidden"
      }
      style={pdfExportMode ? undefined : { maxHeight: height }}
    >
      <ResponsiveContainer width="100%" height={contentHeight}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: expanded ? 16 : 8, left: 4, bottom: bottomMargin }}
          barCategoryGap={rowGap}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: compact ? 9 : 10, fill: "#64748b" }}
          >
            <Label
              value="Auslastung in %"
              position="insideBottom"
              offset={compact ? -2 : -4}
              style={{ fill: "#475569", fontSize: compact ? 9 : 11, fontWeight: 600 }}
            />
          </XAxis>
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            tick={(props) => <CourseAxisTick {...props} expanded={expanded} />}
          />
          <Tooltip formatter={(value) => [formatPercent(typeof value === "number" ? value : Number(value ?? 0)), "Auslastung"]} />
          <Bar
            dataKey="value"
            fill="var(--color-accent)"
            radius={[0, 4, 4, 0]}
            maxBarSize={maxBarSize}
            label={(props) => renderBarPercentLabel(props, compact)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
