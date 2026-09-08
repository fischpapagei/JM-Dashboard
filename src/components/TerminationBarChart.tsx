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
import { terminationReasons } from "../data/catalog";

const CATALOG_TERMINATION_ORDER = new Map(
  terminationReasons.map((reason, index) => [reason.key, index]),
);

const COLORS = ["#003064", "#175e54", "#009036", "#3fb0ac", "#5c8a86", "#8fb9b4", "#c5d9d6"];

export interface TerminationChartDatum {
  name: string;
  value: number;
  key?: string;
}

interface TerminationBarChartProps {
  data: TerminationChartDatum[];
  height: number;
  pdfExportMode?: boolean;
}

interface AxisTickProps {
  x?: string | number;
  y?: string | number;
  payload?: { value: string };
}

type LayoutMode = "preview" | "modal";

function getLayoutMode(height: number): LayoutMode {
  return height >= 380 ? "modal" : "preview";
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

function getLabelLines(name: string, mode: LayoutMode): string[] {
  return wrapLabel(name, mode === "modal" ? 34 : 30);
}

function computeRowHeight(name: string, mode: LayoutMode, rowGap: number): number {
  const lines = getLabelLines(name, mode);
  const lineHeight = mode === "modal" ? 14 : 10;
  const labelHeight = lines.length * lineHeight + (mode === "modal" ? 10 : 4);
  const barHeight = mode === "modal" ? 22 : 11;
  const minRow = mode === "modal" ? 52 : 26;
  return Math.max(minRow, labelHeight, barHeight) + rowGap;
}

function computeYAxisWidth(names: string[], mode: LayoutMode): number {
  const maxCharsPerLine = mode === "modal" ? 34 : 30;
  let longestLine = 0;

  for (const name of names) {
    for (const line of wrapLabel(name, maxCharsPerLine)) {
      longestLine = Math.max(longestLine, line.length);
    }
  }

  const charWidth = mode === "modal" ? 6.5 : 5.8;
  const minWidth = mode === "modal" ? 140 : 120;
  const maxWidth = mode === "modal" ? 400 : 280;
  return Math.min(maxWidth, Math.max(minWidth, Math.ceil(longestLine * charWidth) + 14));
}

function ReasonAxisTick({ x = 0, y = 0, payload, mode }: AxisTickProps & { mode: LayoutMode }) {
  const label = payload?.value ?? "";
  const lines = getLabelLines(label, mode);
  const xPos = Number(x) - 8;
  const lineHeight = mode === "modal" ? 14 : 10;
  const startDy = -((lines.length - 1) * lineHeight) / 2;

  return (
    <text
      x={xPos}
      y={Number(y)}
      textAnchor="end"
      dominantBaseline="middle"
      fill="#475569"
      fontSize={mode === "modal" ? 11 : 9}
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={xPos} dy={index === 0 ? startDy : lineHeight}>
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
  const inside = barWidth > (compact ? 56 : 80);

  return (
    <text
      x={inside ? Number(x) + barWidth - 6 : Number(x) + barWidth + 6}
      y={Number(y) + Number(height) / 2}
      textAnchor={inside ? "end" : "start"}
      dominantBaseline="middle"
      fill={inside ? "#ffffff" : "var(--color-ink)"}
      fontSize={compact ? 9 : 10}
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

export function TerminationBarChart({ data, height, pdfExportMode = false }: TerminationBarChartProps) {
  const mode = getLayoutMode(height);
  const isPreview = mode === "preview";

  const chartData = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          (CATALOG_TERMINATION_ORDER.get(a.key ?? "") ?? Number.MAX_SAFE_INTEGER) -
          (CATALOG_TERMINATION_ORDER.get(b.key ?? "") ?? Number.MAX_SAFE_INTEGER),
      ),
    [data],
  );

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const yAxisWidth = computeYAxisWidth(
    chartData.map((item) => item.name),
    mode,
  );
  const maxX = xAxisMax(chartData);
  const rowGap = isPreview ? 4 : 14;
  const rowHeights = chartData.map((item) => computeRowHeight(item.name, mode, rowGap));
  const maxRowHeight = Math.max(...rowHeights, isPreview ? 26 : 52);
  const minContentHeight = chartData.length * maxRowHeight + 36;
  const contentHeight = Math.max(height, minContentHeight);
  const maxBarSize = Math.max(isPreview ? 10 : 22, maxRowHeight - rowGap - 2);

  return (
    <div
      className={
        pdfExportMode
          ? "h-full w-full overflow-visible"
          : "h-full w-full overflow-y-auto overflow-x-hidden"
      }
      style={pdfExportMode ? undefined : { maxHeight: height }}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <ResponsiveContainer width="100%" height={contentHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 8,
            right: isPreview ? 72 : 88,
            left: isPreview ? 6 : 10,
            bottom: isPreview ? 8 : 24,
          }}
          barCategoryGap={rowGap}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[0, maxX]}
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickFormatter={(value) => formatNumber(Number(value))}
            hide={isPreview}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            tickMargin={10}
            interval={0}
            tick={(props) => <ReasonAxisTick {...props} mode={mode} />}
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
            label={(props) => renderBarValueLabel(props, total, isPreview)}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.key ?? index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
