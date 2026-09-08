import type {
  UtilizationQuarterLabels,
  UtilizationQuarterRow,
  UtilizationYearLabels,
  UtilizationYearRow,
} from '../utils/auslastungsquote';
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
  rows: UtilizationQuarterRow[];
  labels: UtilizationQuarterLabels;
  showNrwComparison?: boolean;
}

export function AuslastungsquoteQuarterTable({
  title,
  rows,
  labels,
  showNrwComparison = false,
}: QuarterTableProps) {
  const bothSpan = showNrwComparison ? 3 : 1;
  const occupancySpan = showNrwComparison ? 7 : 5;
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-(--color-ink)">{title}</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[11px]`}>
          <thead>
            <tr className="bg-emerald-100 text-[10px] uppercase tracking-wide text-emerald-900">
              <th className={`${HEADER_CELL} border-emerald-200`} rowSpan={2}>
                Hauptkategorie
              </th>
              <th className={`${HEADER_CELL} border-emerald-200`} rowSpan={2}>
                Maßnahmenkategorie
              </th>
              <th className={`${HEADER_CELL} border-emerald-200 text-center`} colSpan={bothSpan}>
                Auslastungsquote beide Geschlechter
              </th>
              <th className={`${HEADER_CELL} border-emerald-200 text-center`} colSpan={occupancySpan}>
                Auslastungsquote — Weibliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-emerald-200 text-center`} colSpan={3}>
                Soll-Plätze — Weibliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-emerald-200 text-center`} colSpan={occupancySpan}>
                Auslastungsquote — Männliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-emerald-200 text-center`} colSpan={3}>
                Soll-Plätze — Männliche Gefangene
              </th>
            </tr>
            <tr className="bg-emerald-50 text-[9px] leading-tight text-emerald-900">
              <th className={`${HEADER_CELL} border-emerald-200`}>Aktuelles Quartal ({labels.current})</th>
              {showNrwComparison && (
                <>
                  <th className={`${HEADER_CELL} border-emerald-200`}>NRW-Ø ({labels.current})</th>
                  <th className={`${HEADER_CELL} border-emerald-200`}>% zu NRW-Ø</th>
                </>
              )}
              {(['weiblich', 'männlich'] as const).flatMap((gender) => [
                <th key={`${gender}-oc`} className={`${HEADER_CELL} border-emerald-200`}>
                  Aktuelles Quartal ({labels.current})
                </th>,
                <th key={`${gender}-op`} className={`${HEADER_CELL} border-emerald-200`}>
                  Letztes Quartal ({labels.previous})
                </th>,
                <th key={`${gender}-oy`} className={`${HEADER_CELL} border-emerald-200`}>
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
                <th key={`${gender}-pc`} className={`${HEADER_CELL} border-emerald-200`}>
                  Aktuelles Quartal ({labels.current})
                </th>,
                <th key={`${gender}-py`} className={`${HEADER_CELL} border-emerald-200`}>
                  Vorjahresquartal ({labels.yearAgo})
                </th>,
                <th key={`${gender}-pd`} className={`${HEADER_CELL} border-emerald-200`}>
                  Veränderung zum Vorjahres-Q.
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const prev = rows[index - 1];
              const showCategory = !prev || prev.categoryKey !== row.categoryKey;
              const span = rows.filter((item) => item.categoryKey === row.categoryKey).length;
              const genders = [row.weiblich, row.maennlich];
              return (
                <tr
                  key={`${row.categoryKey}-${row.courseTypeKey ?? 'sum'}`}
                  className={row.isCategorySum ? 'bg-emerald-50/70 font-medium' : 'bg-white'}
                >
                  {showCategory && (
                    <td className={`${LABEL_CELL} border-slate-200 text-(--color-ink)`} rowSpan={span}>
                      {row.categoryLabel}
                    </td>
                  )}
                  <td className={`${LABEL_CELL} border-slate-200`}>{row.courseTypeLabel}</td>
                  <td className={DATA_CELL}>{formatPercent(row.occupancyBoth)}</td>
                  {showNrwComparison && (
                    <>
                      <td className={DATA_CELL}>{formatPercent(row.occupancyBothNrw)}</td>
                      <td className={DATA_CELL}>
                        <ChangeCell value={row.occupancyBothVsNrw ?? null} />
                      </td>
                    </>
                  )}
                  {genders.flatMap((metric, genderIndex) => [
                    <td key={`${genderIndex}-oc`} className={DATA_CELL}>
                      {formatPercent(metric.occupancyCurrent)}
                    </td>,
                    <td key={`${genderIndex}-op`} className={DATA_CELL}>
                      {formatPercent(metric.occupancyPrevious)}
                    </td>,
                    <td key={`${genderIndex}-oy`} className={DATA_CELL}>
                      {formatPercent(metric.occupancyYearAgo)}
                    </td>,
                    <td key={`${genderIndex}-cp`} className={DATA_CELL}>
                      <ChangeCell value={metric.occupancyChangePrev} />
                    </td>,
                    <td key={`${genderIndex}-cy`} className={DATA_CELL}>
                      <ChangeCell value={metric.occupancyChangeYearAgo} />
                    </td>,
                    ...(showNrwComparison
                      ? [
                          <td key={`${genderIndex}-nrw`} className={DATA_CELL}>
                            {formatPercent(metric.occupancyNrw)}
                          </td>,
                          <td key={`${genderIndex}-vs`} className={DATA_CELL}>
                            <ChangeCell value={metric.occupancyVsNrw ?? null} />
                          </td>,
                        ]
                      : []),
                    <td key={`${genderIndex}-pc`} className={DATA_CELL}>
                      {formatNumber(metric.placesCurrent)}
                    </td>,
                    <td key={`${genderIndex}-py`} className={DATA_CELL}>
                      {formatNumber(metric.placesYearAgo)}
                    </td>,
                    <td key={`${genderIndex}-pd`} className={DATA_CELL}>
                      <SignedNumberCell value={metric.placesChangeYearAgo} />
                    </td>,
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
  rows: UtilizationYearRow[];
  labels: UtilizationYearLabels;
  showNrwComparison?: boolean;
}

export function AuslastungsquoteYearTable({
  title,
  rows,
  labels,
  showNrwComparison = false,
}: YearTableProps) {
  const bothSpan = showNrwComparison ? 3 : 1;
  const occupancySpan = showNrwComparison ? 5 : 3;
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-sky-200 bg-sky-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-(--color-ink)">{title}</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-[11px]`}>
          <thead>
            <tr className="bg-sky-100 text-[10px] uppercase tracking-wide text-sky-900">
              <th className={`${HEADER_CELL} border-sky-200`} rowSpan={2}>
                Hauptkategorie
              </th>
              <th className={`${HEADER_CELL} border-sky-200`} rowSpan={2}>
                Maßnahmenkategorie
              </th>
              <th
                className={`${HEADER_CELL} border-sky-200 text-center`}
                colSpan={bothSpan}
                rowSpan={showNrwComparison ? 1 : 2}
              >
                Auslastungsquote beide Geschlechter im aktuellen Jahr ({labels.current})
              </th>
              <th className={`${HEADER_CELL} border-sky-200 text-center`} colSpan={occupancySpan}>
                Auslastungsquote — Weibliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-sky-200 text-center`} colSpan={3}>
                Soll-Plätze — Weibliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-sky-200 text-center`} colSpan={occupancySpan}>
                Auslastungsquote — Männliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-sky-200 text-center`} colSpan={3}>
                Soll-Plätze — Männliche Gefangene
              </th>
            </tr>
            <tr className="bg-sky-50 text-[9px] leading-tight text-sky-900">
              {showNrwComparison && (
                <>
                  <th className={`${HEADER_CELL} border-sky-200`}>Aktuelles Jahr ({labels.current})</th>
                  <th className={`${HEADER_CELL} border-sky-200`}>NRW-Ø ({labels.current})</th>
                  <th className={`${HEADER_CELL} border-sky-200`}>% zu NRW-Ø</th>
                </>
              )}
              {(['weiblich', 'männlich'] as const).flatMap((gender) => [
                <th key={`${gender}-oc`} className={`${HEADER_CELL} border-sky-200`}>
                  Aktuelles Jahr ({labels.current})
                </th>,
                <th key={`${gender}-op`} className={`${HEADER_CELL} border-sky-200`}>
                  Letztes Jahr ({labels.previous})
                </th>,
                <th key={`${gender}-od`} className={`${HEADER_CELL} border-sky-200`}>
                  % zum Vorjahr
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
                <th key={`${gender}-pc`} className={`${HEADER_CELL} border-sky-200`}>
                  Aktuelles Jahr ({labels.current})
                </th>,
                <th key={`${gender}-pp`} className={`${HEADER_CELL} border-sky-200`}>
                  Letztes Jahr ({labels.previous})
                </th>,
                <th key={`${gender}-pd`} className={`${HEADER_CELL} border-sky-200`}>
                  Veränderung der Soll-Plätze
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const prev = rows[index - 1];
              const showCategory = !prev || prev.categoryKey !== row.categoryKey;
              const span = rows.filter((item) => item.categoryKey === row.categoryKey).length;
              const genders = [row.weiblich, row.maennlich];
              return (
                <tr
                  key={`${row.categoryKey}-${row.courseTypeKey ?? 'sum'}`}
                  className={row.isCategorySum ? 'bg-sky-50/70 font-medium' : 'bg-white'}
                >
                  {showCategory && (
                    <td className={`${LABEL_CELL} border-slate-200 text-(--color-ink)`} rowSpan={span}>
                      {row.categoryLabel}
                    </td>
                  )}
                  <td className={`${LABEL_CELL} border-slate-200`}>{row.courseTypeLabel}</td>
                  {showNrwComparison ? (
                    <>
                      <td className={DATA_CELL}>{formatPercent(row.occupancyBoth)}</td>
                      <td className={DATA_CELL}>{formatPercent(row.occupancyBothNrw)}</td>
                      <td className={DATA_CELL}>
                        <ChangeCell value={row.occupancyBothVsNrw ?? null} />
                      </td>
                    </>
                  ) : (
                    <td className={DATA_CELL}>{formatPercent(row.occupancyBoth)}</td>
                  )}
                  {genders.flatMap((metric, genderIndex) => [
                    <td key={`${genderIndex}-oc`} className={DATA_CELL}>
                      {formatPercent(metric.occupancyCurrent)}
                    </td>,
                    <td key={`${genderIndex}-op`} className={DATA_CELL}>
                      {formatPercent(metric.occupancyPrevious)}
                    </td>,
                    <td key={`${genderIndex}-od`} className={DATA_CELL}>
                      <ChangeCell value={metric.occupancyChangePrev} />
                    </td>,
                    ...(showNrwComparison
                      ? [
                          <td key={`${genderIndex}-nrw`} className={DATA_CELL}>
                            {formatPercent(metric.occupancyNrw)}
                          </td>,
                          <td key={`${genderIndex}-vs`} className={DATA_CELL}>
                            <ChangeCell value={metric.occupancyVsNrw ?? null} />
                          </td>,
                        ]
                      : []),
                    <td key={`${genderIndex}-pc`} className={DATA_CELL}>
                      {formatNumber(metric.placesCurrent)}
                    </td>,
                    <td key={`${genderIndex}-pp`} className={DATA_CELL}>
                      {formatNumber(metric.placesPrevious)}
                    </td>,
                    <td key={`${genderIndex}-pd`} className={DATA_CELL}>
                      <SignedNumberCell value={metric.placesChangePrev} />
                    </td>,
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
