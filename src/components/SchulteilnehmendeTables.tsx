import type {
  QuarterTableColumnLabels,
  SchulteilnehmendeQuarterRow,
  SchulteilnehmendeYearRow,
  YearTableColumnLabels,
} from '../utils/schulteilnehmende';
import { formatNumber, formatPercent } from '../utils/format';
import { ReportScrollTable } from './ReportScrollTable';
import {
  REPORT_DATA_CELL,
  REPORT_HEADER_CELL,
  REPORT_LABEL_CELL,
  REPORT_TABLE_CLASS,
  reportStickyCell,
} from './reportTableStyles';

function ChangeCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-400">—</span>;
  const className = value < 0 ? 'font-medium text-landesrot' : 'text-slate-700';
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
      <div className="border-b border-nachtblau-30 bg-nachtblau-15 px-4 py-3">
        <h3 className="text-sm font-semibold text-(--color-ink)">{title}</h3>
      </div>
      <ReportScrollTable>
        <table className={`${REPORT_TABLE_CLASS} text-xs`}>
          <thead>
            <tr className="bg-nachtblau-30 text-[11px] uppercase tracking-wide text-nachtblau">
              <th className={`${HEADER_CELL} border-nachtblau-30 ${reportStickyCell(1, 'bg-nachtblau-30')}`} rowSpan={2}>
                Hauptkategorie
              </th>
              <th
                className={`${HEADER_CELL} border-nachtblau-30 ${reportStickyCell(2, 'bg-nachtblau-30', { edge: true })}`}
                rowSpan={2}
              >
                Maßnahmenkategorie
              </th>
              <th className={`${HEADER_CELL} border-nachtblau-30 text-center`} colSpan={genderColSpan}>
                Teilnehmende — Weibliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-nachtblau-30 text-center`} colSpan={genderColSpan}>
                Teilnehmende — Männliche Gefangene
              </th>
            </tr>
            <tr className="bg-nachtblau-15 text-[10px] text-nachtblau">
              {['weiblich', 'männlich'].flatMap((gender) => [
                <th key={`${gender}-c`} className={`${HEADER_CELL} border-nachtblau-30`}>
                  Aktuelles Quartal ({labels.current})
                </th>,
                <th key={`${gender}-p`} className={`${HEADER_CELL} border-nachtblau-30`}>
                  Letztes Quartal ({labels.previous})
                </th>,
                <th key={`${gender}-y`} className={`${HEADER_CELL} border-nachtblau-30`}>
                  Vorjahresquartal ({labels.yearAgo})
                </th>,
                <th key={`${gender}-cp`} className={`${HEADER_CELL} border-nachtblau-30`}>
                  % zum letzten Q.
                </th>,
                <th key={`${gender}-cy`} className={`${HEADER_CELL} border-nachtblau-30`}>
                  % zum Vorjahres-Q.
                </th>,
                ...(showNrwComparison
                  ? [
                      <th key={`${gender}-nrw`} className={`${HEADER_CELL} border-nachtblau-30`}>
                        NRW-Ø ({labels.current})
                      </th>,
                      <th key={`${gender}-vs`} className={`${HEADER_CELL} border-nachtblau-30`}>
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
              const stickyBg = row.isCategorySum ? 'bg-nachtblau-15' : 'bg-white';
              return (
                <tr
                  key={`${row.categoryKey}-${row.courseTypeKey ?? 'sum'}`}
                  className={row.isCategorySum ? 'bg-nachtblau-15/80 font-medium' : 'bg-white'}
                >
                  {showCategory && (
                    <td
                      className={`${LABEL_CELL} border-slate-200 text-(--color-ink) ${reportStickyCell(1, stickyBg)}`}
                      rowSpan={span}
                    >
                      {row.categoryLabel}
                    </td>
                  )}
                  <td className={`${LABEL_CELL} border-slate-200 ${reportStickyCell(2, stickyBg, { edge: true })}`}>
                    {row.courseTypeLabel}
                  </td>
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
      </ReportScrollTable>
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
      <div className="border-b border-nachtblau-50 bg-nachtblau-30 px-4 py-3">
        <h3 className="text-sm font-semibold text-(--color-ink)">{title}</h3>
      </div>
      <ReportScrollTable>
        <table className={`${REPORT_TABLE_CLASS} text-xs`}>
          <thead>
            <tr className="bg-nachtblau-50 text-[11px] uppercase tracking-wide text-nachtblau">
              <th className={`${HEADER_CELL} border-nachtblau-50 ${reportStickyCell(1, 'bg-nachtblau-50')}`} rowSpan={2}>
                Hauptkategorie
              </th>
              <th
                className={`${HEADER_CELL} border-nachtblau-50 ${reportStickyCell(2, 'bg-nachtblau-50', { edge: true })}`}
                rowSpan={2}
              >
                Maßnahmenkategorie
              </th>
              <th className={`${HEADER_CELL} border-nachtblau-50 text-center`} colSpan={genderColSpan}>
                Teilnehmende — Weibliche Gefangene
              </th>
              <th className={`${HEADER_CELL} border-nachtblau-50 text-center`} colSpan={genderColSpan}>
                Teilnehmende — Männliche Gefangene
              </th>
            </tr>
            <tr className="bg-nachtblau-30 text-[10px] text-nachtblau">
              {['weiblich', 'männlich'].flatMap((gender) => [
                <th key={`${gender}-c`} className={`${HEADER_CELL} border-nachtblau-50`}>
                  Aktuelles Jahr ({labels.current})
                </th>,
                <th key={`${gender}-p`} className={`${HEADER_CELL} border-nachtblau-50`}>
                  Vorjahr ({labels.previous})
                </th>,
                <th key={`${gender}-s`} className={`${HEADER_CELL} border-nachtblau-50`}>
                  %-Anteil {labels.current}
                </th>,
                <th key={`${gender}-d`} className={`${HEADER_CELL} border-nachtblau-50`}>
                  % zum Vorjahr
                </th>,
                ...(showNrwComparison
                  ? [
                      <th key={`${gender}-nrw`} className={`${HEADER_CELL} border-nachtblau-50`}>
                        NRW-Ø ({labels.current})
                      </th>,
                      <th key={`${gender}-vs`} className={`${HEADER_CELL} border-nachtblau-50`}>
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
              const stickyBg = row.isCategorySum ? 'bg-nachtblau-30' : 'bg-white';
              return (
                <tr
                  key={`${row.categoryKey}-${row.courseTypeKey ?? 'sum'}`}
                  className={row.isCategorySum ? 'bg-nachtblau-30/80 font-medium' : 'bg-white'}
                >
                  {showCategory && (
                    <td
                      className={`${LABEL_CELL} border-slate-200 text-(--color-ink) ${reportStickyCell(1, stickyBg)}`}
                      rowSpan={span}
                    >
                      {row.categoryLabel}
                    </td>
                  )}
                  <td className={`${LABEL_CELL} border-slate-200 ${reportStickyCell(2, stickyBg, { edge: true })}`}>
                    {row.courseTypeLabel}
                  </td>
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
      </ReportScrollTable>
    </section>
  );
}
