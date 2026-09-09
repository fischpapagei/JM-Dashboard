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
import { CHART_BAR, CHART_FONT, CHART_GRID, CHART_TICK, chartDensity } from "../ui/chartTheme";

export interface CourseUtilizationChartDatum {
  name: string;
  value: number;
}

interface CourseUtilizationBarChartProps {
  data: CourseUtilizationChartDatum[];
  height: number;
  width?: number;
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

function computeYAxisWidth(names: string[], density: ReturnType<typeof chartDensity>): number {
  const expanded = density !== "compact";
  const maxCharsPerLine = expanded ? 32 : 14;
  let longestLine = 0;

  for (const name of names) {
    for (const line of wrapLabel(name, maxCharsPerLine)) {
      longestLine = Math.max(longestLine, line.length);
    }
  }

  const charWidth = density === "modal" ? 8.4 : expanded ? 6.2 : 5.2;
  const minWidth = density === "modal" ? 96 : expanded ? 64 : 44;
  const maxWidth = density === "modal" ? 360 : expanded ? 280 : 118;
  return Math.min(maxWidth, Math.max(minWidth, Math.ceil(longestLine * charWidth) + 8));
}

function CourseAxisTick({
  x = 0,
  y = 0,
  payload,
  expanded,
  density,
}: AxisTickProps & { expanded: boolean; density: ReturnType<typeof chartDensity> }) {
  const label = payload?.value ?? "";
  const lines = wrapLabel(label, expanded ? 32 : 14);
  const xPos = Number(x) - 4;
  const fontSize = CHART_FONT[density].tick;

  return (
    <text x={xPos} y={Number(y)} textAnchor="end" dominantBaseline="middle" fill={CHART_TICK} fontSize={fontSize}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={xPos} dy={index === 0 ? 0 : fontSize + 2}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function renderBarPercentLabel(props: LabelProps, density: ReturnType<typeof chartDensity>) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  const percent = typeof value === "number" ? value : Number(value ?? 0);
  if (!percent) return null;

  const barWidth = Number(width);
  const compact = density === "compact";
  const inside = barWidth > (compact ? 40 : 52);
  const label = formatPercent(percent);

  return (
    <text
      x={inside ? Number(x) + barWidth - 6 : Number(x) + barWidth + 6}
      y={Number(y) + Number(height) / 2}
      textAnchor={inside ? "end" : "start"}
      dominantBaseline="middle"
      fill={inside ? "#ffffff" : "var(--color-ink)"}
      fontSize={CHART_FONT[density].value}
      fontWeight={600}
    >
      {label}
    </text>
  );
}

export function CourseUtilizationBarChart({
  data,
  height,
  width,
  pdfExportMode = false,
}: CourseUtilizationBarChartProps) {
  const density = chartDensity(height, pdfExportMode);
  const expanded = density !== "compact";
  const compact = !expanded;
  const fillParent = Boolean(width && width > 0);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data],
  );

  const yAxisWidth = computeYAxisWidth(
    sorted.map((item) => item.name),
    density,
  );
  const rowGap = compact ? 6 : 10;
  const minRowHeight = compact ? 22 : density === "modal" ? 36 : 28;
  const minContentHeight = sorted.length * (minRowHeight + rowGap) + (expanded ? 36 : 32);
  const contentHeight = fillParent ? height : Math.max(height, minContentHeight);
  const maxBarSize = Math.max(minRowHeight, Math.floor((contentHeight - 36) / Math.max(sorted.length, 1)) - rowGap);
  const bottomMargin = density === "modal" ? 36 : expanded ? 28 : 22;
  const font = CHART_FONT[density];

  return (
    <div
      className={
        pdfExportMode || fillParent
          ? "h-full w-full overflow-hidden"
          : "h-full w-full overflow-y-auto overflow-x-hidden"
      }
      style={fillParent ? { width, height } : pdfExportMode ? undefined : { maxHeight: height }}
    >
      <ResponsiveContainer
        width={fillParent ? width : "100%"}
        height={contentHeight}
        minWidth={1}
        minHeight={1}
      >
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: expanded ? 16 : 8, left: 4, bottom: bottomMargin }}
          barCategoryGap={rowGap}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_GRID} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: font.tick, fill: CHART_TICK }}
          >
            <Label
              value="Auslastung in %"
              position="insideBottom"
              offset={compact ? -2 : -4}
              style={{ fill: CHART_TICK, fontSize: font.axis, fontWeight: 600 }}
            />
          </XAxis>
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            tick={(props) => <CourseAxisTick {...props} expanded={expanded} density={density} />}
          />
          <Tooltip formatter={(value) => [formatPercent(typeof value === "number" ? value : Number(value ?? 0)), "Auslastung"]} />
          <Bar
            dataKey="value"
            fill={CHART_BAR}
            radius={[0, 4, 4, 0]}
            maxBarSize={maxBarSize}
            label={(props) => renderBarPercentLabel(props, density)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
