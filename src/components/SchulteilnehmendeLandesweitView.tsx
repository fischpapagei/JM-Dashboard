import { useMemo, type RefObject } from 'react';
import { demoRecords } from '../data/demoData';
import { JVAS } from '../data/jvas';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import {
  formatReportingPeriodDisplay,
  getCompletedYearAsOf,
  getYearFromPeriod,
} from '../utils/periods';
import {
  buildCategoryChartGroups,
  buildCategoryCourseTrendSeries,
  buildGenderTrendSeries,
  buildQuarterComparisonTable,
  buildYearComparisonTable,
  filterRecordsByJva,
  getPresentCourseTypeKeys,
  SCHULTEILNEHMENDE_ALTERSGRUPPEN,
} from '../utils/schulteilnehmende';
import { EmptyState } from './EmptyState';
import { KurzberichtButton } from './KurzberichtButton';
import { ParticipantCategoryTrendChart } from './ParticipantCategoryTrendChart';
import { ParticipantGenderTrendChart } from './ParticipantGenderTrendChart';
import { SchulteilnehmendeQuarterTable, SchulteilnehmendeYearTable } from './SchulteilnehmendeTables';

interface SchulteilnehmendeLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  jvaId?: string;
}

export function SchulteilnehmendeLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
  jvaId,
}: SchulteilnehmendeLandesweitViewProps) {
  const isJvaReport = Boolean(jvaId);
  const jvaName = jvaId ? (JVAS.find((jva) => jva.id === jvaId)?.name ?? jvaId) : null;
  const nrwRecords = demoMode ? demoRecords : [];
  const records = demoMode && jvaId ? filterRecordsByJva(demoRecords, jvaId) : nrwRecords;
  const completedYear = getCompletedYearAsOf(berichtszeitpunkt);
  const endYear = completedYear ?? getYearFromPeriod(berichtszeitpunkt);

  const ageSections = useMemo(() => {
    if (!demoMode) return [];
    return SCHULTEILNEHMENDE_ALTERSGRUPPEN.flatMap((ageGroup) => {
      const presentCourseKeys = isJvaReport
        ? getPresentCourseTypeKeys(records, ageGroup.key)
        : undefined;
      if (isJvaReport && (!presentCourseKeys || presentCourseKeys.length === 0)) {
        return [];
      }
      const categoryGroups = buildCategoryChartGroups(presentCourseKeys);
      const tableOptions = {
        courseTypeKeys: presentCourseKeys,
        nrwRecords: isJvaReport ? nrwRecords : undefined,
      };
      const femaleLabel = `weibliche ${ageGroup.adjective}`;
      const maleLabel = `männliche ${ageGroup.adjective}`;
      return [
        {
          ageGroup,
          femaleLabel,
          maleLabel,
          quarterTable: buildQuarterComparisonTable(
            records,
            ageGroup.key,
            berichtszeitpunkt,
            tableOptions,
          ),
          yearTable: buildYearComparisonTable(records, ageGroup.key, berichtszeitpunkt, tableOptions),
          trends: {
            quarters: buildGenderTrendSeries(
              records,
              ageGroup.key,
              'last-5-quarters',
              berichtszeitpunkt,
              tableOptions.nrwRecords,
            ),
            months: buildGenderTrendSeries(
              records,
              ageGroup.key,
              'last-13-months',
              berichtszeitpunkt,
              tableOptions.nrwRecords,
            ),
            years: buildGenderTrendSeries(
              records,
              ageGroup.key,
              'last-11-years',
              berichtszeitpunkt,
              tableOptions.nrwRecords,
            ),
          },
          categoryCharts: categoryGroups.flatMap((group) =>
            (
              [
                ['weiblich', femaleLabel],
                ['männlich', maleLabel],
              ] as const
            ).map(([geschlecht, genderLabel]) => ({
              key: `${ageGroup.key}-${group.id}-${geschlecht}`,
              title: `Zahl der Teilnehmenden — ${genderLabel} in der Kategorie „${group.title}“`,
              group,
              data: buildCategoryCourseTrendSeries(
                records,
                group,
                geschlecht,
                ageGroup.key,
                endYear,
                tableOptions.nrwRecords,
              ),
            })),
          ),
        },
      ];
    });
  }, [berichtszeitpunkt, demoMode, endYear, isJvaReport, nrwRecords, records]);

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    const slug = jvaId ? jvaId.replace(/^jva-/, '') : 'landesweit';
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Schulteilnehmende_${slug}_${berichtszeitpunkt}.pdf`,
    });
  };

  const title = isJvaReport
    ? `Schulteilnehmende (${jvaName})`
    : 'Schulteilnehmende (landesweit)';
  const reportLabel = isJvaReport ? 'Bericht 3b' : 'Bericht 3a';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-(--color-ink)">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {reportLabel}
            {jvaName ? ` · ${jvaName}` : ''}
            {' · '}Berichtszeitpunkt {formatReportingPeriodDisplay(berichtszeitpunkt)}
            {completedYear != null ? ` · Jahresdaten ${completedYear}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Zurück zur Konfiguration
          </button>
          <KurzberichtButton onGenerate={handlePdf} disabled={!demoMode} label="PDF erzeugen" />
        </div>
      </div>

      {!demoMode ? (
        <EmptyState
          title="Keine Daten geladen"
          description="Aktivieren Sie Demo-Daten in der Konfiguration, um den Bericht anzuzeigen. Produktivdaten kommen später aus BASIS-Web."
        />
      ) : ageSections.length === 0 ? (
        <EmptyState
          title="Keine schulischen Maßnahmen in dieser Anstalt"
          description="Für die ausgewählte JVA liegen im Demo-Datensatz keine Teilnehmenden an schulischen Maßnahmen vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-10">
          {ageSections.map(({ ageGroup, femaleLabel, maleLabel, quarterTable, yearTable, trends, categoryCharts }) => (
              <section key={ageGroup.key} className="space-y-5">
                <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-lg font-semibold text-(--color-ink)">
                    {ageGroup.label} — Teilnehmende an schulischen Maßnahmen
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isJvaReport
                      ? `${jvaName} · nur vorhandene Angebote · gestrichelte Linien: NRW-Durchschnitt je Anstalt`
                      : 'Landesweite Auswertung · absolute Zahlen'}
                  </p>
                </div>

                <div data-pdf-block>
                  <ParticipantGenderTrendChart
                    title="Summe Teilnehmende an allen Maßnahmen — letzte 5 Quartale"
                    subtitle={`${ageGroup.label} · weiblich, männlich und Summe${isJvaReport ? ' inkl. NRW-Ø' : ''}`}
                    data={trends.quarters}
                    femaleLabel={femaleLabel}
                    maleLabel={maleLabel}
                    showNrwComparison={isJvaReport}
                  />
                </div>
                <div data-pdf-block>
                  <ParticipantGenderTrendChart
                    title="Summe Teilnehmende an allen Maßnahmen — letzte 13 Monate"
                    subtitle={`${ageGroup.label} · weiblich, männlich und Summe${isJvaReport ? ' inkl. NRW-Ø' : ''}`}
                    data={trends.months}
                    femaleLabel={femaleLabel}
                    maleLabel={maleLabel}
                    showNrwComparison={isJvaReport}
                  />
                </div>
                <div data-pdf-block>
                  <ParticipantGenderTrendChart
                    title="Summe Teilnehmende an allen Maßnahmen — letzte 11 Jahre"
                    subtitle={`${ageGroup.label} · weiblich, männlich und Summe${isJvaReport ? ' inkl. NRW-Ø' : ''}`}
                    data={trends.years}
                    femaleLabel={femaleLabel}
                    maleLabel={maleLabel}
                    showNrwComparison={isJvaReport}
                  />
                </div>

                {categoryCharts.map((chart) => (
                    <div data-pdf-block key={chart.key}>
                      <ParticipantCategoryTrendChart
                        title={chart.title}
                        group={chart.group}
                        data={chart.data}
                        showNrwComparison={isJvaReport}
                      />
                    </div>
                ))}

                <div data-pdf-block data-pdf-landscape data-pdf-multipage data-pdf-capture-width="2400">
                  <SchulteilnehmendeQuarterTable
                    title={`Teilnehmende – ${ageGroup.label} (Quartalsdaten)`}
                    rows={quarterTable.rows}
                    labels={quarterTable.labels}
                    showNrwComparison={isJvaReport}
                  />
                </div>

                {yearTable && (
                  <div data-pdf-block data-pdf-landscape data-pdf-multipage data-pdf-capture-width="2400">
                    <SchulteilnehmendeYearTable
                      title={`Teilnehmende – ${ageGroup.label} (Jahresdaten)`}
                      rows={yearTable.rows}
                      labels={yearTable.labels}
                      showNrwComparison={isJvaReport}
                    />
                  </div>
                )}
              </section>
          ))}
        </div>
      )}
    </div>
  );
}
