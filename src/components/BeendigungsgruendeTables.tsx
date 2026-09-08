import type {
  TerminationQuarterLabels,
  TerminationQuarterRow,
  TerminationYearLabels,
  TerminationYearRow,
} from '../utils/beendigungsgruende';
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

function SignedNumberCell({ value }: { value: number }) {
  const className = value < 0 ? 'font-medium text-red-600' : 'text-slate-700';
  return <span className={className}>{formatNumber(value)}</span>;
}

const LABEL_CELL = REPORT_LABEL_CELL;
const DATA_CELL = REPORT_DATA_CELL;
const HEADER_CELL = REPORT_HEADER_CELL;

interface QuarterTableProps {
  title: string;
  rows: TerminationQuarterRow[];
  labels: TerminationQuarterLabels;
  showNrwComparison?: boolean;
  showWeiblich?: boolean;
  showMaennlich?: boolean;
}

export function BeendigungsgruendeQuarterTable({
  title,
  rows,
  labels,
  showNrwComparison = false,
  showWeiblich = true,
  showMaennlich = true,
}: QuarterTableProps) {
  const bothSpan = showNrwComparison ? 3 : 1;
  const genderSpan = showNrwComparison ? 7 : 5;
  const visibleGenders = [
    ...(showWeiblich ? ([['weiblich', 'Weibliche']] as const) : []),
    ...(showMaennlich ? ([['männlich', 'Männliche']] as const) : []),
  ];
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a3352]">{title}</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[11px]`}>
          <thead>
            <tr className="bg-emerald-100 text-[10px] uppercase tracking-wide text-emerald-900">
              <th className={`${HEADER_CELL} border-emerald-200`} rowSpan={2}>
                Beendigung
              </th>
              <th className={`${HEADER_CELL} border-emerald-200`} rowSpan={2}>
                Beendigungsgrund
              </th>
              <th
                className={`${HEADER_CELL} border-emerald-200 text-center`}
                colSpan={bothSpan}
                rowSpan={showNrwComparison ? 1 : 2}
              >
                Beendigungen beide Geschlechter im aktuellen Quartal ({labels.current})
              </th>
              {visibleGenders.map(([key, label]) => (
                <th key={key} className={`${HEADER_CELL} border-emerald-200 text-center`} colSpan={genderSpan}>
                  Beendigungen — {label} Gefangene
                </th>
              ))}
            </tr>
            <tr className="bg-emerald-50 text-[9px] leading-tight text-emerald-900">
              {showNrwComparison && (
                <>
                  <th className={`${HEADER_CELL} border-emerald-200`}>Aktuelles Quartal ({labels.current})</th>
                  <th className={`${HEADER_CELL} border-emerald-200`}>NRW-Ø ({labels.current})</th>
                  <th className={`${HEADER_CELL} border-emerald-200`}>% zu NRW-Ø</th>
                </>
              )}
              {visibleGenders.flatMap(([gender]) => [
                <th key={`${gender}-c`} className={`${HEADER_CELL} border-emerald-200`}>
                  Aktuelles Quartal ({labels.current})
                </th>,
                <th key={`${gender}-p`} className={`${HEADER_CELL} border-emerald-200`}>
                  Letztes Quartal ({labels.previous})
                </th>,
                <th key={`${gender}-y`} className={`${HEADER_CELL} border-emerald-200`}>
                  Vorjahresquartal ({labels.yearAgo})
                </th>,
                <th key={`${gender}-cp`} className={`${HEADER_CELL} border-emerald-200`}>
                  % zum letzten Q.
                </th>,
                <th key={`${gender}-cy`} className={`${HEADER_CELL} border-emerald-200`}>
                  % zum Vorjahres-Q.
                </th>,
                ...(showNrwComparison
                  ? [
                      <th key={`${gender}-nrw`} className={`${HEADER_CELL} border-emerald-200`}>
                        NRW-Ø ({labels.current})
                      </th>,
                      <th key={`${gender}-vs`} className={`${HEADER_CELL} border-emerald-200`}>
                        % zu NRW-Ø
                      </th>,
                    ]
                  : []),
              ])}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const prev = rows[index - 1];
              const showLevel = !prev || prev.levelKey !== row.levelKey;
              const span = rows.filter((item) => item.levelKey === row.levelKey).length;
              const genderMetrics = [
                ...(showWeiblich ? [row.weiblich] : []),
                ...(showMaennlich ? [row.maennlich] : []),
              ];
              return (
                <tr
                  key={`${row.levelKey}-${row.reasonKey ?? 'sum'}`}
                  className={row.isLevelSum ? 'bg-emerald-50/70 font-medium' : 'bg-white'}
                >
                  {showLevel && (
                    <td className={`${LABEL_CELL} border-slate-200 text-[#1a3352]`} rowSpan={span}>
                      {row.levelLabel}
                    </td>
                  )}
                  <td className={`${LABEL_CELL} border-slate-200`}>{row.reasonLabel}</td>
                  <td className={DATA_CELL}>{formatNumber(row.both)}</td>
                  {showNrwComparison && (
                    <>
                      <td className={DATA_CELL}>{formatNumber(row.bothNrw)}</td>
                      <td className={DATA_CELL}>
                        <ChangeCell value={row.bothVsNrw ?? null} />
                      </td>
                    </>
                  )}
                  {genderMetrics.flatMap((metric, genderIndex) => [
                    <td key={`${genderIndex}-c`} className={DATA_CELL}>
                      {formatNumber(metric.current)}
                    </td>,
                    <td key={`${genderIndex}-p`} className={DATA_CELL}>
                      {formatNumber(metric.previous)}
                    </td>,
                    <td key={`${genderIndex}-y`} className={DATA_CELL}>
                      {formatNumber(metric.yearAgo)}
                    </td>,
                    <td key={`${genderIndex}-cp`} className={DATA_CELL}>
                      <ChangeCell value={metric.changePrev} />
                    </td>,
                    <td key={`${genderIndex}-cy`} className={DATA_CELL}>
                      <ChangeCell value={metric.changeYearAgo} />
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

interface YearTableProps {
  title: string;
  rows: TerminationYearRow[];
  labels: TerminationYearLabels;
  showNrwComparison?: boolean;
  showWeiblich?: boolean;
  showMaennlich?: boolean;
}

export function BeendigungsgruendeYearTable({
  title,
  rows,
  labels,
  showNrwComparison = false,
  showWeiblich = true,
  showMaennlich = true,
}: YearTableProps) {
  const bothSpan = showNrwComparison ? 3 : 1;
  const genderSpan = showNrwComparison ? 5 : 3;
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
                Beendigung
              </th>
              <th className={`${HEADER_CELL} border-sky-200`} rowSpan={2}>
                Beendigungsgrund
              </th>
              <th
                className={`${HEADER_CELL} border-sky-200 text-center`}
                colSpan={bothSpan}
                rowSpan={showNrwComparison ? 1 : 2}
              >
                Beendigungen beide Geschlechter im aktuellen Jahr ({labels.current})
              </th>
              {visibleGenders.map(([key, label]) => (
                <th key={key} className={`${HEADER_CELL} border-sky-200 text-center`} colSpan={genderSpan}>
                  Beendigungen — {label} Gefangene
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
            {rows.map((row, index) => {
              const prev = rows[index - 1];
              const showLevel = !prev || prev.levelKey !== row.levelKey;
              const span = rows.filter((item) => item.levelKey === row.levelKey).length;
              const genderMetrics = [
                ...(showWeiblich ? [row.weiblich] : []),
                ...(showMaennlich ? [row.maennlich] : []),
              ];
              return (
                <tr
                  key={`${row.levelKey}-${row.reasonKey ?? 'sum'}`}
                  className={row.isLevelSum ? 'bg-sky-50/70 font-medium' : 'bg-white'}
                >
                  {showLevel && (
                    <td className={`${LABEL_CELL} border-slate-200 text-[#1a3352]`} rowSpan={span}>
                      {row.levelLabel}
                    </td>
                  )}
                  <td className={`${LABEL_CELL} border-slate-200`}>{row.reasonLabel}</td>
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
                    <td key={`${genderIndex}-d`} className={DATA_CELL}>
                      <SignedNumberCell value={metric.changePrev} />
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
