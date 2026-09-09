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
import { CHART_BAR, CHART_GRID, CHART_MUTED, CHART_TICK } from "../ui/chartTheme";
import { formatNumber } from "../utils/format";
import type { CategoryChartDatum } from "../utils/aggregations";

interface CategoryBarChartProps {
  data: CategoryChartDatum[];
  height: number;
  pdfExportMode?: boolean;
}

export type { CategoryChartDatum };

interface AxisTickProps {
  x?: number;
  y?: number;
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

function formatCategoryAxisLabel(text: string, pdfExportMode: boolean): string[] {
  if (pdfExportMode && text.includes("(")) {
    const openIndex = text.indexOf("(");
    const firstLine = text.slice(0, openIndex).trim();
    const secondLine = text.slice(openIndex).trim();
    return secondLine ? [firstLine, secondLine] : [firstLine];
  }
  return wrapLabel(text, pdfExportMode ? 11 : 14);
}

function CategoryAxisTick({
  x = 0,
  y = 0,
  payload,
  pdfExportMode = false,
}: AxisTickProps & { pdfExportMode?: boolean }) {
  const label = payload?.value ?? "";
  const lines = formatCategoryAxisLabel(label, pdfExportMode);
  const lineHeight = pdfExportMode ? 12 : 13;

  return (
    <text x={x} y={y + 14} textAnchor="middle" fill={CHART_TICK} fontSize={pdfExportMode ? 10 : 11}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function renderBarTopLabel(
  props: LabelProps,
  total: number,
  compact: boolean,
  pdfExportMode: boolean,
) {
  const { x = 0, y = 0, width = 0, value } = props;
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  if (!numericValue) return null;

  const percent = total > 0 ? (numericValue / total) * 100 : 0;
  const centerX = Number(x) + Number(width) / 2;
  const barTop = Number(y);
  const valueOffset = pdfExportMode ? 30 : compact ? 22 : 28;
  const percentOffset = pdfExportMode ? 14 : compact ? 10 : 12;
  const valueFontSize = pdfExportMode ? 12 : compact ? 9 : 12;
  const percentFontSize = pdfExportMode ? 10 : compact ? 8 : 10;

  return (
    <text textAnchor="middle" fill="var(--color-ink)">
      <tspan
        x={centerX}
        y={barTop - valueOffset}
        fontSize={valueFontSize}
        fontWeight={600}
      >
        {formatNumber(numericValue)}
      </tspan>
      <tspan
        x={centerX}
        y={barTop - percentOffset}
        fontSize={percentFontSize}
        fill={CHART_MUTED}
        fontWeight={500}
      >
        {percent.toFixed(1)} %
      </tspan>
    </text>
  );
}

function yAxisMax(data: CategoryChartDatum[]): number {
  const peak = Math.max(...data.map((item) => item.value), 0);
  return Math.ceil(peak * 1.22) || 1;
}

export function CategoryBarChart({ data, height, pdfExportMode = false }: CategoryBarChartProps) {
  const expanded = pdfExportMode || height > 250;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const labelKey = expanded ? "fullName" : "name";
  const bottomMargin = pdfExportMode ? 108 : expanded ? 88 : 56;
  const topMargin = pdfExportMode ? 32 : expanded ? 20 : 16;
  const maxY = yAxisMax(data);

  const leftMargin = expanded ? 28 : 18;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: topMargin, right: 12, left: leftMargin, bottom: bottomMargin }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey={labelKey}
          interval={0}
          tick={expanded ? <CategoryAxisTick pdfExportMode={pdfExportMode} /> : { fontSize: 9, fill: CHART_TICK }}
          angle={expanded ? 0 : -22}
          textAnchor={expanded ? "middle" : "end"}
          height={pdfExportMode ? 96 : expanded ? 84 : 52}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_TICK }}
          width={48}
          domain={[0, maxY]}
          tickFormatter={(value) => formatNumber(Number(value))}
        >
          <Label
            value="Absolute Zahl der Teilnehmenden"
            angle={-90}
            position="insideLeft"
            offset={expanded ? 4 : 0}
            style={{ fill: CHART_TICK, fontSize: expanded ? 11 : 9, fontWeight: 600, textAnchor: "middle" }}
          />
        </YAxis>
        <Tooltip
          formatter={(value) => {
            const numericValue = typeof value === "number" ? value : Number(value ?? 0);
            const percent = total > 0 ? ((numericValue / total) * 100).toFixed(1) : "0";
            return [`${formatNumber(numericValue)} (${percent} %)`, "Teilnehmende"];
          }}
          labelFormatter={(label) => String(label)}
        />
        <Bar
          dataKey="value"
          fill={CHART_BAR}
          radius={[4, 4, 0, 0]}
          maxBarSize={pdfExportMode ? 88 : expanded ? 72 : 48}
          label={(props) => renderBarTopLabel(props, total, !expanded, pdfExportMode)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
