import { useMemo, type RefObject } from 'react';
import { demoRecords } from '../data/demoData';
import { JVAS } from '../data/jvas';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import {
  formatReportingPeriodDisplay,
  getCompletedYearAsOf,
} from '../utils/periods';
import {
  buildTerminationFreeTextListing,
  buildTerminationOverviewGroup,
  buildTerminationOverviewTrend,
  buildTerminationQuarterTable,
  buildTerminationReasonGroup,
  buildTerminationReasonTrend,
  buildTerminationYearTable,
  getPresentTerminationAspects,
  PREMATURE_LEVEL,
  REGULAR_LEVEL,
  scopeJvaTerminationRecords,
} from '../utils/beendigungsgruende';
import { SCHULTEILNEHMENDE_ALTERSGRUPPEN } from '../utils/schulteilnehmende';
import {
  BeendigungsgruendeQuarterTable,
  BeendigungsgruendeYearTable,
} from './BeendigungsgruendeTables';
import { EmptyState } from './EmptyState';
import { KurzberichtButton } from './KurzberichtButton';
import { ParticipantCategoryTrendChart } from './ParticipantCategoryTrendChart';

interface BeendigungsgruendeLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  jvaId?: string;
}

export function BeendigungsgruendeLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
  jvaId,
}: BeendigungsgruendeLandesweitViewProps) {
  const isJvaReport = Boolean(jvaId);
  const jvaName = jvaId ? (JVAS.find((jva) => jva.id === jvaId)?.name ?? jvaId) : null;
  const nrwRecords = demoMode ? demoRecords : [];
  const records = demoMode && jvaId ? scopeJvaTerminationRecords(demoRecords, jvaId) : nrwRecords;
  const completedYear = getCompletedYearAsOf(berichtszeitpunkt);

  const ageSections = useMemo(() => {
    if (!demoMode) return [];
    return SCHULTEILNEHMENDE_ALTERSGRUPPEN.flatMap((ageGroup) => {
      const present = isJvaReport ? getPresentTerminationAspects(records, ageGroup.key) : undefined;
      if (isJvaReport && (!present || present.reasonKeys.length === 0 || present.genders.length === 0)) {
        return [];
      }
      const reportOptions = {
        reasonKeys: present?.reasonKeys,
        genders: present?.genders,
        nrwRecords: isJvaReport ? nrwRecords : undefined,
      };
      const overviewGroup = buildTerminationOverviewGroup({
        genders: present?.genders,
        levels: present?.levels,
      });
      const regularGroup = buildTerminationReasonGroup(REGULAR_LEVEL, present?.reasonKeys);
      const prematureGroup = buildTerminationReasonGroup(PREMATURE_LEVEL, present?.reasonKeys);
      const femaleLabel = `weibliche ${ageGroup.adjective}`;
      const maleLabel = `männliche ${ageGroup.adjective}`;
      const showWeiblich = !present || present.genders.includes('weiblich');
      const showMaennlich = !present || present.genders.includes('männlich');
      return [
        {
          ageGroup,
          overviewGroup,
          showWeiblich,
          showMaennlich,
          overview: {
            quarters: buildTerminationOverviewTrend(
              records,
              ageGroup.key,
              'last-5-quarters',
              berichtszeitpunkt,
              reportOptions,
            ),
            months: buildTerminationOverviewTrend(
              records,
              ageGroup.key,
              'last-13-months',
              berichtszeitpunkt,
              reportOptions,
            ),
            years: buildTerminationOverviewTrend(
              records,
              ageGroup.key,
              'last-11-years',
              berichtszeitpunkt,
              reportOptions,
            ),
          },
          reasonCharts: (
            [
              [REGULAR_LEVEL, regularGroup, femaleLabel, 'weiblich' as const, 340],
              [REGULAR_LEVEL, regularGroup, maleLabel, 'männlich' as const, 340],
              [PREMATURE_LEVEL, prematureGroup, femaleLabel, 'weiblich' as const, 420],
              [PREMATURE_LEVEL, prematureGroup, maleLabel, 'männlich' as const, 420],
            ] as const
          )
            .filter(([, group, , geschlecht]) => {
              if (group.series.length === 0) return false;
              if (geschlecht === 'weiblich' && !showWeiblich) return false;
              if (geschlecht === 'männlich' && !showMaennlich) return false;
              return true;
            })
            .map(([level, group, genderLabel, geschlecht, height]) => ({
              key: `${ageGroup.key}-${level}-${geschlecht}`,
              title:
                level === PREMATURE_LEVEL
                  ? `Vorzeitige Beendigungsgründe — ${genderLabel} (letzte 11 Jahre)`
                  : `Reguläre Beendigungsgründe — ${genderLabel} (letzte 11 Jahre)`,
              group,
              height,
              data: buildTerminationReasonTrend(
                records,
                ageGroup.key,
                geschlecht,
                level,
                berichtszeitpunkt,
                reportOptions,
              ),
            })),
          quarterTable: buildTerminationQuarterTable(
            records,
            ageGroup.key,
            berichtszeitpunkt,
            reportOptions,
          ),
          yearTable: buildTerminationYearTable(records, ageGroup.key, berichtszeitpunkt, reportOptions),
        },
      ];
    });
  }, [berichtszeitpunkt, demoMode, isJvaReport, nrwRecords, records]);

  const freeTextEntries = useMemo(() => {
    if (!demoMode || completedYear == null) return [];
    return buildTerminationFreeTextListing(records, completedYear);
  }, [completedYear, demoMode, records]);

  const handlePdf = async () => {
    if (!exportRef.current) {
      throw new Error('Export-Bereich nicht gefunden.');
    }
    const slug = jvaId ? jvaId.replace(/^jva-/, '') : 'landesweit';
    await generateKurzberichtPdf({
      root: exportRef.current,
      filename: `Beendigungsgruende_${slug}_${berichtszeitpunkt}.pdf`,
    });
  };

  const title = isJvaReport
    ? `Beendigungsgründe (${jvaName})`
    : 'Beendigungsgründe (landesweit)';
  const reportLabel = isJvaReport ? 'Bericht 5b' : 'Bericht 5a';
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
          title="Keine Beendigungen in dieser Anstalt"
          description="Für die ausgewählte JVA liegen im Demo-Datensatz keine Beendigungen schulischer Maßnahmen vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-10">
          {ageSections.map(
            ({
              ageGroup,
              overviewGroup,
              overview,
              reasonCharts,
              quarterTable,
              yearTable,
              showWeiblich,
              showMaennlich,
            }) => (
              <section key={ageGroup.key} className="space-y-5">
                <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#1a3352]">
                    {ageGroup.label} — Beendigungsgründe schulischer Maßnahmen
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isJvaReport
                      ? `${jvaName} · nur vorhandene Aspekte · gestrichelte Linien: NRW-Durchschnitt je Anstalt`
                      : 'Landesweite Auswertung · vorzeitige und reguläre Beendigungen'}
                  </p>
                </div>

                <div data-pdf-block>
                  <ParticipantCategoryTrendChart
                    title="Beendigung aller Maßnahmen — letzte 5 Quartale"
                    group={overviewGroup}
                    data={overview.quarters}
                    showNrwComparison={isJvaReport}
                  />
                </div>
                <div data-pdf-block>
                  <ParticipantCategoryTrendChart
                    title="Beendigung aller Maßnahmen — letzte 13 Monate"
                    group={overviewGroup}
                    data={overview.months}
                    showNrwComparison={isJvaReport}
                  />
                </div>
                <div data-pdf-block>
                  <ParticipantCategoryTrendChart
                    title="Beendigung aller Maßnahmen — letzte 11 Jahre"
                    group={overviewGroup}
                    data={overview.years}
                    showNrwComparison={isJvaReport}
                  />
                </div>

                {reasonCharts.map((chart) => (
                  <div data-pdf-block key={chart.key}>
                    <ParticipantCategoryTrendChart
                      title={chart.title}
                      group={chart.group}
                      data={chart.data}
                      height={chart.height}
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
                  <BeendigungsgruendeQuarterTable
                    title={`Beendigungen – ${ageGroup.label} (Quartalsdaten)`}
                    rows={quarterTable.rows}
                    labels={quarterTable.labels}
                    showNrwComparison={isJvaReport}
                    showWeiblich={showWeiblich}
                    showMaennlich={showMaennlich}
                  />
                </div>

                {yearTable && (
                  <div
                    data-pdf-block
                    data-pdf-landscape
                    data-pdf-multipage
                    data-pdf-capture-width={tableCaptureWidth}
                  >
                    <BeendigungsgruendeYearTable
                      title={`Beendigungen – ${ageGroup.label} (Jahresdaten)`}
                      rows={yearTable.rows}
                      labels={yearTable.labels}
                      showNrwComparison={isJvaReport}
                      showWeiblich={showWeiblich}
                      showMaennlich={showMaennlich}
                    />
                  </div>
                )}
              </section>
            ),
          )}

          {completedYear != null && (
            <section data-pdf-block className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-[#1a3352]">
                Freitextgründe im aktuellen Jahr ({completedYear})
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Nennungen aus Freitextfeldern (z. B. disziplinarische oder sonstige Gründe)
              </p>
              {freeTextEntries.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Keine Freitexte im ausgewählten Jahr erfasst.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {freeTextEntries.map((entry) => (
                    <li key={`${entry.reasonKey}-${entry.text}`}>
                      <span className="font-medium text-[#1a3352]">{entry.reasonLabel}:</span> {entry.text}
                      <span className="text-slate-500"> ({entry.count})</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
