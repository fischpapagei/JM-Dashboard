import { useMemo, type RefObject } from 'react';
import { demoRecords } from '../data/demoData';
import { JVAS } from '../data/jvas';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import {
  formatReportingPeriodDisplay,
  getCompletedYearAsOf,
} from '../utils/periods';
import {
  buildUtilizationCategoryGroup,
  buildUtilizationCategoryTrend,
  buildUtilizationGenderTrend,
  buildUtilizationQuarterTable,
  buildUtilizationYearTable,
} from '../utils/auslastungsquote';
import {
  filterRecordsByJva,
  getPresentCourseTypeKeys,
  SCHULTEILNEHMENDE_ALTERSGRUPPEN,
} from '../utils/schulteilnehmende';
import { AuslastungsquoteQuarterTable, AuslastungsquoteYearTable } from './AuslastungsquoteTables';
import { EmptyState } from './EmptyState';
import { KurzberichtButton } from './KurzberichtButton';
import { ParticipantCategoryTrendChart } from './ParticipantCategoryTrendChart';
import { ParticipantGenderTrendChart } from './ParticipantGenderTrendChart';

interface AuslastungsquoteLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  jvaId?: string;
}

export function AuslastungsquoteLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
  jvaId,
}: AuslastungsquoteLandesweitViewProps) {
  const isJvaReport = Boolean(jvaId);
  const jvaName = jvaId ? (JVAS.find((jva) => jva.id === jvaId)?.name ?? jvaId) : null;
  const nrwRecords = demoMode ? demoRecords : [];
  const records = demoMode && jvaId ? filterRecordsByJva(demoRecords, jvaId) : nrwRecords;
  const completedYear = getCompletedYearAsOf(berichtszeitpunkt);

  const ageSections = useMemo(() => {
    if (!demoMode) return [];
    return SCHULTEILNEHMENDE_ALTERSGRUPPEN.flatMap((ageGroup) => {
      const presentCourseKeys = isJvaReport
        ? getPresentCourseTypeKeys(records, ageGroup.key)
        : undefined;
      if (isJvaReport && (!presentCourseKeys || presentCourseKeys.length === 0)) {
        return [];
      }
      const reportOptions = {
        courseTypeKeys: presentCourseKeys,
        nrwRecords: isJvaReport ? nrwRecords : undefined,
      };
      const categoryGroup = buildUtilizationCategoryGroup(presentCourseKeys);
      const femaleLabel = `weibliche ${ageGroup.adjective}`;
      const maleLabel = `männliche ${ageGroup.adjective}`;
      return [
        {
          ageGroup,
          femaleLabel,
          maleLabel,
          categoryGroup,
          trends: {
            quarters: buildUtilizationGenderTrend(
              records,
              ageGroup.key,
              'last-5-quarters',
              berichtszeitpunkt,
              reportOptions,
            ),
            months: buildUtilizationGenderTrend(
              records,
              ageGroup.key,
              'last-13-months',
              berichtszeitpunkt,
              reportOptions,
            ),
            years: buildUtilizationGenderTrend(
              records,
              ageGroup.key,
              'last-11-years',
              berichtszeitpunkt,
              reportOptions,
            ),
          },
          categoryCharts: (
            [
              ['weiblich', femaleLabel],
              ['männlich', maleLabel],
            ] as const
          ).map(([geschlecht, genderLabel]) => ({
            key: `${ageGroup.key}-${geschlecht}`,
            title: `Auslastungsquote — ${genderLabel} nach Kurskategorie (letzte 11 Jahre)`,
            data: buildUtilizationCategoryTrend(records, geschlecht, ageGroup.key, berichtszeitpunkt, {
              ...reportOptions,
              categoryKeys: categoryGroup.categoryKeys,
            }),
          })),
          quarterTable: buildUtilizationQuarterTable(
            records,
            ageGroup.key,
            berichtszeitpunkt,
            reportOptions,
          ),
          yearTable: buildUtilizationYearTable(records, ageGroup.key, berichtszeitpunkt, reportOptions),
        },
      ];
    });
  }, [berichtszeitpunkt, demoMode, isJvaReport, nrwRecords, records]);

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    const slug = jvaId ? jvaId.replace(/^jva-/, '') : 'landesweit';
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Auslastungsquote_${slug}_${berichtszeitpunkt}.pdf`,
    });
  };

  const title = isJvaReport
    ? `Auslastungsquote (${jvaName})`
    : 'Auslastungsquote (landesweit)';
  const reportLabel = isJvaReport ? 'Bericht 4b' : 'Bericht 4a';
  const tableCaptureWidth = isJvaReport ? '2600' : '2400';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1a3352]">{title}</h2>
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
          description="Für die ausgewählte JVA liegen im Demo-Datensatz keine Auslastungsdaten schulischer Maßnahmen vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-10">
          {ageSections.map(
            ({
              ageGroup,
              femaleLabel,
              maleLabel,
              categoryGroup,
              trends,
              categoryCharts,
              quarterTable,
              yearTable,
            }) => (
              <section key={ageGroup.key} className="space-y-5">
                <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#1a3352]">
                    {ageGroup.label} — Auslastungsquote schulischer Maßnahmen
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isJvaReport
                      ? `${jvaName} · nur vorhandene Angebote · gestrichelte Linien: landesweite Auslastung der Vergleichsgruppe`
                      : 'Landesweite Auswertung · Teilnehmende / Soll-Plätze in Prozent'}
                  </p>
                </div>

                <div data-pdf-block>
                  <ParticipantGenderTrendChart
                    title="Auslastungsquote aller Maßnahmen — letzte 5 Quartale"
                    subtitle={`${ageGroup.label} · weiblich, männlich und Summe${isJvaReport ? ' inkl. NRW-Ø' : ''}`}
                    data={trends.quarters}
                    femaleLabel={femaleLabel}
                    maleLabel={maleLabel}
                    valueIsPercent
                    showNrwComparison={isJvaReport}
                  />
                </div>
                <div data-pdf-block>
                  <ParticipantGenderTrendChart
                    title="Auslastungsquote aller Maßnahmen — letzte 13 Monate"
                    subtitle={`${ageGroup.label} · weiblich, männlich und Summe${isJvaReport ? ' inkl. NRW-Ø' : ''}`}
                    data={trends.months}
                    femaleLabel={femaleLabel}
                    maleLabel={maleLabel}
                    valueIsPercent
                    showNrwComparison={isJvaReport}
                  />
                </div>
                <div data-pdf-block>
                  <ParticipantGenderTrendChart
                    title="Auslastungsquote aller Maßnahmen — letzte 11 Jahre"
                    subtitle={`${ageGroup.label} · weiblich, männlich und Summe${isJvaReport ? ' inkl. NRW-Ø' : ''}`}
                    data={trends.years}
                    femaleLabel={femaleLabel}
                    maleLabel={maleLabel}
                    valueIsPercent
                    showNrwComparison={isJvaReport}
                  />
                </div>

                {categoryCharts.map((chart) => (
                  <div data-pdf-block key={chart.key}>
                    <ParticipantCategoryTrendChart
                      title={chart.title}
                      group={categoryGroup}
                      data={chart.data}
                      valueIsPercent
                      showNrwComparison={isJvaReport}
                    />
                  </div>
                ))}

                <div
                  data-pdf-block
                  data-pdf-landscape
                  data-pdf-multipage
                  data-pdf-capture-width={tableCaptureWidth}
                >
                  <AuslastungsquoteQuarterTable
                    title={`Auslastungsquote – ${ageGroup.label} (Quartalsdaten)`}
                    rows={quarterTable.rows}
                    labels={quarterTable.labels}
                    showNrwComparison={isJvaReport}
                  />
                </div>

                {yearTable && (
                  <div
                    data-pdf-block
                    data-pdf-landscape
                    data-pdf-multipage
                    data-pdf-capture-width={tableCaptureWidth}
                  >
                    <AuslastungsquoteYearTable
                      title={`Auslastungsquote – ${ageGroup.label} (Jahresdaten)`}
                      rows={yearTable.rows}
                      labels={yearTable.labels}
                      showNrwComparison={isJvaReport}
                    />
                  </div>
                )}
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
