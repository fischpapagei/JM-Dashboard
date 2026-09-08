import type { SchulabschlussYearLabels, SchulabschlussYearRow } from '../utils/schulabschluesse';
import { formatNumber, formatPercent } from '../utils/format';
import {
  REPORT_DATA_CELL,
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
} from './reportTableStyles';

function ChangeCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-400">—</span>;
  const className = value < 0 ? 'font-medium text-red-600' : 'text-slate-700';
  return <span className={className}>{formatPercent(value)}</span>;
}

const LABEL_CELL = REPORT_LABEL_CELL;
const DATA_CELL = REPORT_DATA_CELL;
const HEADER_CELL = REPORT_HEADER_CELL;

interface YearTableProps {
  title: string;
  rows: SchulabschlussYearRow[];
  labels: SchulabschlussYearLabels;
  showNrwComparison?: boolean;
  showWeiblich?: boolean;
  showMaennlich?: boolean;
}

export function SchulabschluesseYearTable({
  title,
  rows,
  labels,
  showNrwComparison = false,
  showWeiblich = true,
  showMaennlich = true,
}: YearTableProps) {
  const bothSpan = showNrwComparison ? 3 : 1;
  const genderSpan = showNrwComparison ? 6 : 4;
  const visibleGenders = [
    ...(showWeiblich ? ([['weiblich', 'Weibliche']] as const) : []),
    ...(showMaennlich ? ([['männlich', 'Männliche']] as const) : []),
  ];
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-sky-200 bg-sky-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a3352]">{title}</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[11px]`}>
          <thead>
            <tr className="bg-sky-100 text-[10px] uppercase tracking-wide text-sky-900">
              <th className={`${HEADER_CELL} border-sky-200`} rowSpan={2}>
                Abschlussart
              </th>
              <th
                className={`${HEADER_CELL} border-sky-200 text-center`}
                colSpan={bothSpan}
                rowSpan={showNrwComparison ? 1 : 2}
              >
                Beide Geschlechter im aktuellen Jahr ({labels.current})
              </th>
              {visibleGenders.map(([key, label]) => (
                <th key={key} className={`${HEADER_CELL} border-sky-200 text-center`} colSpan={genderSpan}>
                  {label} Gefangene
                </th>
              ))}
            </tr>
            <tr className="bg-sky-50 text-[9px] leading-tight text-sky-900">
              {showNrwComparison && (
                <>
                  <th className={`${HEADER_CELL} border-sky-200`}>Aktuelles Jahr ({labels.current})</th>
                  <th className={`${HEADER_CELL} border-sky-200`}>NRW-Ø ({labels.current})</th>
                  <th className={`${HEADER_CELL} border-sky-200`}>% zu NRW-Ø</th>
                </>
              )}
              {visibleGenders.flatMap(([gender]) => [
                <th key={`${gender}-c`} className={`${HEADER_CELL} border-sky-200`}>
                  Aktuelles Jahr ({labels.current})
                </th>,
                <th key={`${gender}-p`} className={`${HEADER_CELL} border-sky-200`}>
                  Letztes Jahr ({labels.previous})
                </th>,
                <th key={`${gender}-s`} className={`${HEADER_CELL} border-sky-200`}>
                  Prozentualer Anteil {labels.current}
                </th>,
                <th key={`${gender}-d`} className={`${HEADER_CELL} border-sky-200`}>
                  Veränderung zum letzten Jahr
                </th>,
                ...(showNrwComparison
                  ? [
                      <th key={`${gender}-nrw`} className={`${HEADER_CELL} border-sky-200`}>
                        NRW-Ø ({labels.current})
                      </th>,
                      <th key={`${gender}-vs`} className={`${HEADER_CELL} border-sky-200`}>
                        % zu NRW-Ø
                      </th>,
                    ]
                  : []),
              ])}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const genderMetrics = [
                ...(showWeiblich ? [row.weiblich] : []),
                ...(showMaennlich ? [row.maennlich] : []),
              ];
              return (
                <tr
                  key={row.groupKey}
                  className={row.isSum ? 'bg-sky-50/70 font-medium' : 'bg-white'}
                >
                  <td className={`${LABEL_CELL} border-slate-200 text-[#1a3352]`}>{row.groupLabel}</td>
                  {showNrwComparison ? (
                    <>
                      <td className={DATA_CELL}>{formatNumber(row.both)}</td>
                      <td className={DATA_CELL}>{formatNumber(row.bothNrw)}</td>
                      <td className={DATA_CELL}>
                        <ChangeCell value={row.bothVsNrw ?? null} />
                      </td>
                    </>
                  ) : (
                    <td className={DATA_CELL}>{formatNumber(row.both)}</td>
                  )}
                  {genderMetrics.flatMap((metric, genderIndex) => [
                    <td key={`${genderIndex}-c`} className={DATA_CELL}>
                      {formatNumber(metric.current)}
                    </td>,
                    <td key={`${genderIndex}-p`} className={DATA_CELL}>
                      {formatNumber(metric.previous)}
                    </td>,
                    <td key={`${genderIndex}-s`} className={DATA_CELL}>
                      {formatPercent(metric.share)}
                    </td>,
                    <td key={`${genderIndex}-d`} className={DATA_CELL}>
                      <ChangeCell value={metric.changePrev} />
                    </td>,
                    ...(showNrwComparison
                      ? [
                          <td key={`${genderIndex}-nrw`} className={DATA_CELL}>
                            {formatNumber(metric.nrwCurrent)}
                          </td>,
                          <td key={`${genderIndex}-vs`} className={DATA_CELL}>
                            <ChangeCell value={metric.vsNrw ?? null} />
                          </td>,
                        ]
                      : []),
                  ])}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
