import type {
  QuarterTableColumnLabels,
  SchulteilnehmendeQuarterRow,
  SchulteilnehmendeYearRow,
  YearTableColumnLabels,
} from '../utils/schulteilnehmende';
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

interface QuarterTableProps {
  title: string;
  rows: SchulteilnehmendeQuarterRow[];
  labels: QuarterTableColumnLabels;
  showNrwComparison?: boolean;
}

export function SchulteilnehmendeQuarterTable({
  title,
  rows,
  labels,
  showNrwComparison = false,
}: QuarterTableProps) {
  const genderColSpan = showNrwComparison ? 7 : 5;
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a3352]">{title}</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-xs`}>
          <thead>
            <tr className="bg-emerald-100 text-[11px] uppercase tracking-wide text-emerald-900">
              <th className={`${HEADER_CELL} border-emerald-200`} rowSpan={2}>
                Hauptkategorie
              </th>
              <th className={`${HEADER_CELL} border-emerald-200`} rowSpan={2}>
                Maßnahmenkategorie
              </th>
              <th className={`${HEADER_CELL} border-emerald-200 text-center`} colSpan={genderColSpan}>
                Teilnehmende — Weibliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-emerald-200 text-center`} colSpan={genderColSpan}>
                Teilnehmende — Männliche Gefangene
              </th>
            </tr>
            <tr className="bg-emerald-50 text-[10px] text-emerald-900">
              {['weiblich', 'männlich'].flatMap((gender) => [
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
              const showCategory = !prev || prev.categoryKey !== row.categoryKey;
              const span = rows.filter((item) => item.categoryKey === row.categoryKey).length;
              const genders = [row.weiblich, row.maennlich];
              return (
                <tr
                  key={`${row.categoryKey}-${row.courseTypeKey ?? 'sum'}`}
                  className={row.isCategorySum ? 'bg-emerald-50/70 font-medium' : 'bg-white'}
                >
                  {showCategory && (
                    <td className={`${LABEL_CELL} border-slate-200 text-[#1a3352]`} rowSpan={span}>
                      {row.categoryLabel}
                    </td>
                  )}
                  <td className={`${LABEL_CELL} border-slate-200`}>{row.courseTypeLabel}</td>
                  {genders.flatMap((metric, genderIndex) => [
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
  rows: SchulteilnehmendeYearRow[];
  labels: YearTableColumnLabels;
  showNrwComparison?: boolean;
}

export function SchulteilnehmendeYearTable({
  title,
  rows,
  labels,
  showNrwComparison = false,
}: YearTableProps) {
  const genderColSpan = showNrwComparison ? 6 : 4;
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-sky-200 bg-sky-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1a3352]">{title}</h3>
      </div>
      <div className="w-full overflow-x-auto">
        <table className={`${REPORT_TABLE_CLASS} text-xs`}>
          <thead>
            <tr className="bg-sky-100 text-[11px] uppercase tracking-wide text-sky-900">
              <th className={`${HEADER_CELL} border-sky-200`} rowSpan={2}>
                Hauptkategorie
              </th>
              <th className={`${HEADER_CELL} border-sky-200`} rowSpan={2}>
                Maßnahmenkategorie
              </th>
              <th className={`${HEADER_CELL} border-sky-200 text-center`} colSpan={genderColSpan}>
                Teilnehmende — Weibliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-sky-200 text-center`} colSpan={genderColSpan}>
                Teilnehmende — Männliche Gefangene
              </th>
            </tr>
            <tr className="bg-sky-50 text-[10px] text-sky-900">
              {['weiblich', 'männlich'].flatMap((gender) => [
                <th key={`${gender}-c`} className={`${HEADER_CELL} border-sky-200`}>
                  Aktuelles Jahr ({labels.current})
                </th>,
                <th key={`${gender}-p`} className={`${HEADER_CELL} border-sky-200`}>
                  Vorjahr ({labels.previous})
                </th>,
                <th key={`${gender}-s`} className={`${HEADER_CELL} border-sky-200`}>
                  %-Anteil {labels.current}
                </th>,
                <th key={`${gender}-d`} className={`${HEADER_CELL} border-sky-200`}>
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
                    <td className={`${LABEL_CELL} border-slate-200 text-[#1a3352]`} rowSpan={span}>
                      {row.categoryLabel}
                    </td>
                  )}
                  <td className={`${LABEL_CELL} border-slate-200`}>{row.courseTypeLabel}</td>
                  {genders.flatMap((metric, genderIndex) => [
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
