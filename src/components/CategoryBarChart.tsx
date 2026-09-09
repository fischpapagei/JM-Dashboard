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
import { CHART_BAR, CHART_FONT, CHART_GRID, CHART_MUTED, CHART_TICK, chartDensity } from "../ui/chartTheme";
import { formatNumber } from "../utils/format";
import type { CategoryChartDatum } from "../utils/aggregations";

interface CategoryBarChartProps {
  data: CategoryChartDatum[];
  height: number;
  width?: number;
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
  density = "default",
}: AxisTickProps & { pdfExportMode?: boolean; density?: ReturnType<typeof chartDensity> }) {
  const label = payload?.value ?? "";
  const lines = formatCategoryAxisLabel(label, pdfExportMode);
  const font = CHART_FONT[density];
  const lineHeight = pdfExportMode ? 12 : font.tick + 4;

  return (
    <text x={x} y={y + 14} textAnchor="middle" fill={CHART_TICK} fontSize={pdfExportMode ? 10 : font.tick}>
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
  density: ReturnType<typeof chartDensity>,
  pdfExportMode: boolean,
) {
  const { x = 0, y = 0, width = 0, value } = props;
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  if (!numericValue) return null;

  const percent = total > 0 ? (numericValue / total) * 100 : 0;
  const centerX = Number(x) + Number(width) / 2;
  const barTop = Number(y);
  const font = CHART_FONT[pdfExportMode ? "default" : density];
  const valueOffset = pdfExportMode ? 30 : font.valueOffset + 16;
  const percentOffset = pdfExportMode ? 14 : font.valueOffset;
  const valueFontSize = pdfExportMode ? 12 : font.value;
  const percentFontSize = pdfExportMode ? 10 : Math.max(font.value - 2, 10);

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

export function CategoryBarChart({ data, height, width, pdfExportMode = false }: CategoryBarChartProps) {
  const density = chartDensity(height, pdfExportMode);
  const expanded = density !== "compact";
  const font = CHART_FONT[density];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const labelKey = expanded ? "fullName" : "name";
  const bottomMargin = pdfExportMode ? 108 : density === "modal" ? 110 : expanded ? 88 : 56;
  const topMargin = pdfExportMode ? 32 : density === "modal" ? 36 : expanded ? 20 : 16;
  const maxY = yAxisMax(data);

  const leftMargin = density === "modal" ? 36 : expanded ? 28 : 18;

  return (
    <ResponsiveContainer width={width && width > 0 ? width : "100%"} height={height} minWidth={1} minHeight={1}>
      <BarChart data={data} margin={{ top: topMargin, right: 12, left: leftMargin, bottom: bottomMargin }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey={labelKey}
          interval={0}
          tick={expanded ? <CategoryAxisTick pdfExportMode={pdfExportMode} density={density} /> : { fontSize: 9, fill: CHART_TICK }}
          angle={expanded ? 0 : -22}
          textAnchor={expanded ? "middle" : "end"}
          height={pdfExportMode ? 96 : density === "modal" ? 100 : expanded ? 84 : 52}
        />
        <YAxis
          tick={{ fontSize: font.tick, fill: CHART_TICK }}
          width={font.yWidth}
          domain={[0, maxY]}
          tickFormatter={(value) => formatNumber(Number(value))}
        >
          <Label
            value="Absolute Zahl der Teilnehmenden"
            angle={-90}
            position="insideLeft"
            offset={density === "modal" ? 8 : expanded ? 4 : 0}
            style={{ fill: CHART_TICK, fontSize: font.axis, fontWeight: 600, textAnchor: "middle" }}
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
          label={(props) => renderBarTopLabel(props, total, density, pdfExportMode)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
