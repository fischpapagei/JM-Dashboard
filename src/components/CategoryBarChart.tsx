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
  const tickAngle = density === "compact" ? -22 : -32;
  const bottomMargin = pdfExportMode ? 96 : density === "modal" ? 132 : expanded ? 100 : 56;
  const topMargin = pdfExportMode ? 32 : density === "modal" ? 36 : expanded ? 20 : 16;
  const tickHeight = pdfExportMode ? 88 : density === "modal" ? 118 : expanded ? 92 : 52;
  const maxY = yAxisMax(data);

  const leftMargin = density === "modal" ? 36 : expanded ? 28 : 18;

  return (
    <ResponsiveContainer width={width && width > 0 ? width : "100%"} height={height} minWidth={1} minHeight={1}>
      <BarChart data={data} margin={{ top: topMargin, right: 16, left: leftMargin, bottom: bottomMargin }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey={labelKey}
          interval={0}
          tick={{ fontSize: pdfExportMode ? 10 : font.tick, fill: CHART_TICK }}
          angle={tickAngle}
          textAnchor="end"
          height={tickHeight}
          dy={8}
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
          isAnimationActive={!pdfExportMode}
          label={(props) => renderBarTopLabel(props, total, density, pdfExportMode)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
