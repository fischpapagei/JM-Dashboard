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
import { formatNumber } from "../utils/format";
import type { CategoryChartDatum } from "../utils/aggregations";

interface CategoryBarChartProps {
  data: CategoryChartDatum[];
  height: number;
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

function CategoryAxisTick({ x = 0, y = 0, payload }: AxisTickProps) {
  const label = payload?.value ?? "";
  const lines = wrapLabel(label, 14);

  return (
    <text x={x} y={y + 14} textAnchor="middle" fill="#475569" fontSize={11}>
      {lines.map((line, index) => (
        <tspan key={line} x={x} dy={index === 0 ? 0 : 13}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function renderBarTopLabel(props: LabelProps, total: number, compact: boolean) {
  const { x = 0, y = 0, width = 0, value } = props;
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  if (!numericValue) return null;

  const percent = total > 0 ? (numericValue / total) * 100 : 0;
  const centerX = Number(x) + Number(width) / 2;
  const barTop = Number(y);
  const valueOffset = compact ? 22 : 28;
  const percentOffset = compact ? 10 : 12;

  return (
    <text textAnchor="middle" fill="#1a3352">
      <tspan
        x={centerX}
        y={barTop - valueOffset}
        fontSize={compact ? 9 : 12}
        fontWeight={600}
      >
        {formatNumber(numericValue)}
      </tspan>
      <tspan
        x={centerX}
        y={barTop - percentOffset}
        fontSize={compact ? 8 : 10}
        fill="#64748b"
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

export function CategoryBarChart({ data, height }: CategoryBarChartProps) {
  const expanded = height > 250;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const labelKey = expanded ? "fullName" : "name";
  const bottomMargin = expanded ? 88 : 56;
  const topMargin = expanded ? 20 : 16;
  const maxY = yAxisMax(data);

  const leftMargin = expanded ? 28 : 18;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: topMargin, right: 12, left: leftMargin, bottom: bottomMargin }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey={labelKey}
          interval={0}
          tick={expanded ? <CategoryAxisTick /> : { fontSize: 9, fill: "#475569" }}
          angle={expanded ? 0 : -22}
          textAnchor={expanded ? "middle" : "end"}
          height={expanded ? 84 : 52}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          width={48}
          domain={[0, maxY]}
          tickFormatter={(value) => formatNumber(Number(value))}
        >
          <Label
            value="Absolute Zahl der Teilnehmenden"
            angle={-90}
            position="insideLeft"
            offset={expanded ? 4 : 0}
            style={{ fill: "#475569", fontSize: expanded ? 11 : 9, fontWeight: 600, textAnchor: "middle" }}
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
          fill="#2d5a8e"
          radius={[4, 4, 0, 0]}
          maxBarSize={expanded ? 72 : 48}
          label={(props) => renderBarTopLabel(props, total, !expanded)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
