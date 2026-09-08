import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
} from 'recharts';
import { formatNumber, formatPercent } from '../utils/format';
import {
  NRW_SERIES_SUFFIX,
  type CategoryChartGroup,
  type CategoryTrendPoint,
} from '../utils/schulteilnehmende';

const SERIES_COLORS = [
  '#C0504D',
  '#9BBB59',
  '#8064A2',
  '#4BACC6',
  '#F79646',
  '#1F497D',
  '#C3D69B',
  '#948A54',
  '#E46C0A',
  '#4F81BD',
];

function renderCountLabel(props: LabelProps, color: string, valueIsPercent: boolean) {
  const { x, y, value } = props;
  if (value == null || x == null || y == null) return null;
  const numericValue = typeof value === 'number' ? value : Number(value);
  return (
    <text
      x={Number(x)}
      y={Number(y) - 8}
      textAnchor="middle"
      fill={color}
      fontSize={9}
      fontWeight={600}
    >
      {valueIsPercent ? formatPercent(numericValue) : formatNumber(numericValue)}
    </text>
  );
}

interface ParticipantCategoryTrendChartProps {
  title: string;
  group: CategoryChartGroup;
  data: CategoryTrendPoint[];
  height?: number;
  showNrwComparison?: boolean;
  valueIsPercent?: boolean;
}

export function ParticipantCategoryTrendChart({
  title,
  group,
  data,
  height = 340,
  showNrwComparison = false,
  valueIsPercent = false,
}: ParticipantCategoryTrendChartProps) {
  const numericKeys = group.series.flatMap((series) =>
    showNrwComparison ? [series.key, `${series.key}${NRW_SERIES_SUFFIX}`] : [series.key],
  );
  const peak = Math.max(
    ...data.flatMap((point) => numericKeys.map((key) => Number(point[key] ?? 0))),
    0,
  );
  const maxY = valueIsPercent ? Math.max(100, Math.ceil(peak)) : Math.ceil(peak * 1.18) || 10;
  const formatValue = (value: unknown) =>
    valueIsPercent
      ? formatPercent(typeof value === 'number' ? value : Number(value))
      : formatNumber(typeof value === 'number' ? value : Number(value));
  const hasLeadingSumme = group.series[0]?.isSumme === true;

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-(--color-ink)">{title}</h3>
      <div className="mt-3" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} />
            <YAxis tick={{ fontSize: 11, fill: '#475569' }} domain={[0, maxY]} />
            <Tooltip formatter={(value, name) => [formatValue(value), String(name)]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {group.series.map((series, index) => {
              const color = series.isSumme
                ? '#4F81BD'
                : SERIES_COLORS[hasLeadingSumme ? index - 1 : index] ?? '#64748b';
              return (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={color}
                  strokeWidth={series.isSumme ? 3 : 2}
                  dot={{ r: 3, fill: color }}
                  label={(props) => renderCountLabel(props, color, valueIsPercent)}
                />
              );
            })}
            {showNrwComparison &&
              group.series.map((series, index) => {
                const color = series.isSumme
                  ? '#4F81BD'
                  : SERIES_COLORS[hasLeadingSumme ? index - 1 : index] ?? '#64748b';
                return (
                  <Line
                    key={`${series.key}${NRW_SERIES_SUFFIX}`}
                    type="monotone"
                    dataKey={`${series.key}${NRW_SERIES_SUFFIX}`}
                    name={`${series.label} (NRW-Ø)`}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    dot={false}
                    legendType="plainline"
                  />
                );
              })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
