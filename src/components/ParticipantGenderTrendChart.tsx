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
import type { GenderTrendPoint } from '../utils/schulteilnehmende';
import { formatNumber, formatPercent } from '../utils/format';

const COLORS = {
  weiblich: '#4F81BD',
  maennlich: '#F79646',
  summe: '#7F7F7F',
} as const;

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
      fontSize={10}
      fontWeight={600}
    >
      {valueIsPercent ? formatPercent(numericValue) : formatNumber(numericValue)}
    </text>
  );
}

interface ParticipantGenderTrendChartProps {
  title: string;
  subtitle?: string;
  data: GenderTrendPoint[];
  femaleLabel: string;
  maleLabel: string;
  height?: number;
  showNrwComparison?: boolean;
  showWeiblich?: boolean;
  showMaennlich?: boolean;
  valueIsPercent?: boolean;
}

export function ParticipantGenderTrendChart({
  title,
  subtitle,
  data,
  femaleLabel,
  maleLabel,
  height = 320,
  showNrwComparison = false,
  showWeiblich = true,
  showMaennlich = true,
  valueIsPercent = false,
}: ParticipantGenderTrendChartProps) {
  const showSumme = showWeiblich && showMaennlich;
  const peak = Math.max(
    ...data.flatMap((point) => [
      ...(showWeiblich ? [point.weiblich] : []),
      ...(showMaennlich ? [point.maennlich] : []),
      ...(showSumme ? [point.summe] : []),
      ...(showNrwComparison
        ? [
            ...(showWeiblich ? [point.weiblichNrw ?? 0] : []),
            ...(showMaennlich ? [point.maennlichNrw ?? 0] : []),
            ...(showSumme ? [point.summeNrw ?? 0] : []),
          ]
        : []),
    ]),
    0,
  );
  const maxY = valueIsPercent ? Math.max(100, Math.ceil(peak)) : Math.ceil(peak * 1.18) || 10;
  const formatValue = (value: unknown) =>
    valueIsPercent
      ? formatPercent(typeof value === 'number' ? value : Number(value))
      : formatNumber(typeof value === 'number' ? value : Number(value));

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-(--color-ink)">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-3" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} />
            <YAxis
              tick={{ fontSize: 11, fill: '#475569' }}
              domain={[0, maxY]}
              tickFormatter={(value) => (valueIsPercent ? `${value}` : String(value))}
            />
            <Tooltip formatter={(value, name) => [formatValue(value), String(name)]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {showWeiblich && (
              <Line
                type="monotone"
                dataKey="weiblich"
                name={femaleLabel}
                stroke={COLORS.weiblich}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.weiblich }}
                label={(props) => renderCountLabel(props, COLORS.weiblich, valueIsPercent)}
              />
            )}
            {showMaennlich && (
              <Line
                type="monotone"
                dataKey="maennlich"
                name={maleLabel}
                stroke={COLORS.maennlich}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.maennlich }}
                label={(props) => renderCountLabel(props, COLORS.maennlich, valueIsPercent)}
              />
            )}
            {showSumme && (
              <Line
                type="monotone"
                dataKey="summe"
                name="Summe"
                stroke={COLORS.summe}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.summe }}
                label={(props) => renderCountLabel(props, COLORS.summe, valueIsPercent)}
              />
            )}
            {showNrwComparison && (
              <>
                {showWeiblich && (
                  <Line
                    type="monotone"
                    dataKey="weiblichNrw"
                    name={`${femaleLabel} (NRW-Ø)`}
                    stroke={COLORS.weiblich}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    dot={false}
                    legendType="plainline"
                  />
                )}
                {showMaennlich && (
                  <Line
                    type="monotone"
                    dataKey="maennlichNrw"
                    name={`${maleLabel} (NRW-Ø)`}
                    stroke={COLORS.maennlich}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    dot={false}
                    legendType="plainline"
                  />
                )}
                {showSumme && (
                  <Line
                    type="monotone"
                    dataKey="summeNrw"
                    name="Summe (NRW-Ø)"
                    stroke={COLORS.summe}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    dot={false}
                    legendType="plainline"
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
