import { useMemo, type RefObject } from 'react';
import { demoRecords } from '../data/demoData';
import { JVAS } from '../data/jvas';
import { generateKurzberichtPdf } from '../utils/generateKurzberichtPdf';
import {
  formatReportingPeriodDisplay,
  getCompletedYearAsOf,
} from '../utils/periods';
import {
  buildSchulabschlussDetailGroup,
  buildSchulabschlussDetailTrend,
  buildSchulabschlussGenderTrend,
  buildSchulabschlussYearTable,
  getPresentSchulabschlussAspects,
  scopeJvaSchulabschlussRecords,
} from '../utils/schulabschluesse';
import { SCHULTEILNEHMENDE_ALTERSGRUPPEN } from '../utils/schulteilnehmende';
import { EmptyState } from './EmptyState';
import { KurzberichtButton } from './KurzberichtButton';
import { ParticipantCategoryTrendChart } from './ParticipantCategoryTrendChart';
import { ParticipantGenderTrendChart } from './ParticipantGenderTrendChart';
import { SchulabschluesseYearTable } from './SchulabschluesseTables';

interface SchulabschluesseLandesweitViewProps {
  berichtszeitpunkt: string;
  demoMode: boolean;
  exportRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  jvaId?: string;
}

export function SchulabschluesseLandesweitView({
  berichtszeitpunkt,
  demoMode,
  exportRef,
  onBack,
  jvaId,
}: SchulabschluesseLandesweitViewProps) {
  const isJvaReport = Boolean(jvaId);
  const jvaName = jvaId ? (JVAS.find((jva) => jva.id === jvaId)?.name ?? jvaId) : null;
  const nrwRecords = demoMode ? demoRecords : [];
  const records = demoMode && jvaId ? scopeJvaSchulabschlussRecords(demoRecords, jvaId) : nrwRecords;
  const completedYear = getCompletedYearAsOf(berichtszeitpunkt);

  const ageSections = useMemo(() => {
    if (!demoMode) return [];
    return SCHULTEILNEHMENDE_ALTERSGRUPPEN.flatMap((ageGroup) => {
      const present = isJvaReport ? getPresentSchulabschlussAspects(records, ageGroup.key) : undefined;
      if (isJvaReport && (!present || present.groupKeys.length === 0 || present.genders.length === 0)) {
        return [];
      }
      const reportOptions = {
        groupKeys: present?.groupKeys,
        genders: present?.genders,
        nrwRecords: isJvaReport ? nrwRecords : undefined,
      };
      const femaleLabel = `weibliche ${ageGroup.adjective}`;
      const maleLabel = `männliche ${ageGroup.adjective}`;
      const showWeiblich = !present || present.genders.includes('weiblich');
      const showMaennlich = !present || present.genders.includes('männlich');
      return [
        {
          ageGroup,
          femaleLabel,
          maleLabel,
          showWeiblich,
          showMaennlich,
          detailGroup: buildSchulabschlussDetailGroup(present?.groupKeys),
          genderTrend: buildSchulabschlussGenderTrend(
            records,
            ageGroup.key,
            berichtszeitpunkt,
            reportOptions,
          ),
          detailCharts: (
            [
              ['weiblich', femaleLabel],
              ['männlich', maleLabel],
              ['beide', 'Summe beide Geschlechter'],
            ] as const
          )
            .filter(([geschlecht]) => {
              if (geschlecht === 'weiblich') return showWeiblich;
              if (geschlecht === 'männlich') return showMaennlich;
              return showWeiblich && showMaennlich;
            })
            .map(([geschlecht, genderLabel]) => ({
              key: `${ageGroup.key}-${geschlecht}`,
              title: `Erreichte Schulabschlüsse — ${genderLabel} nach Abschlussart (letzte 11 Jahre)`,
              data: buildSchulabschlussDetailTrend(
                records,
                ageGroup.key,
                geschlecht,
                berichtszeitpunkt,
                reportOptions,
              ),
            })),
          yearTable: buildSchulabschlussYearTable(records, ageGroup.key, berichtszeitpunkt, reportOptions),
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
      filename: `Schulabschluesse_${slug}_${berichtszeitpunkt}.pdf`,
    });
  };

  const title = isJvaReport
    ? `Erreichte Schulabschlüsse (${jvaName})`
    : 'Erreichte Schulabschlüsse (landesweit)';
  const reportLabel = isJvaReport ? 'Bericht 6b' : 'Bericht 6a';
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
          title="Keine Schulabschlüsse in dieser Anstalt"
          description="Für die ausgewählte JVA liegen im Demo-Datensatz keine erreichten Schulabschlüsse vor."
        />
      ) : (
        <div ref={exportRef} data-kurzbericht-root className="space-y-10">
          {ageSections.map(
            ({
              ageGroup,
              femaleLabel,
              maleLabel,
              showWeiblich,
              showMaennlich,
              detailGroup,
              genderTrend,
              detailCharts,
              yearTable,
            }) => (
              <section key={ageGroup.key} className="space-y-5">
                <div data-pdf-block className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#1a3352]">
                    {ageGroup.label} — Erreichte Schulabschlüsse
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isJvaReport
                      ? `${jvaName} · nur vorhandene Abschlussarten · gestrichelte Linien: NRW-Durchschnitt je Anstalt`
                      : 'Landesweite Auswertung · nur abgeschlossene Kalenderjahre'}
                  </p>
                </div>

                <div data-pdf-block>
                  <ParticipantGenderTrendChart
                    title="Erreichte Schulabschlüsse aller Abschlussarten — letzte 11 Jahre"
                    subtitle={`${ageGroup.label} · ${[
                      showWeiblich ? 'weiblich' : null,
                      showMaennlich ? 'männlich' : null,
                      showWeiblich && showMaennlich ? 'Summe' : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}`}
                    data={genderTrend}
                    femaleLabel={femaleLabel}
                    maleLabel={maleLabel}
                    showNrwComparison={isJvaReport}
                    showWeiblich={showWeiblich}
                    showMaennlich={showMaennlich}
                  />
                </div>

                {detailCharts.map((chart) => (
                  <div data-pdf-block key={chart.key}>
                    <ParticipantCategoryTrendChart
                      title={chart.title}
                      group={detailGroup}
                      data={chart.data}
                      height={380}
                      showNrwComparison={isJvaReport}
                    />
                  </div>
                ))}

                {yearTable && (
                  <div
                    data-pdf-block
                    data-pdf-landscape
                    data-pdf-multipage
                    data-pdf-capture-width={tableCaptureWidth}
                  >
                    <SchulabschluesseYearTable
                      title={`Erreichte Schulabschlüsse – ${ageGroup.label} (Jahresdaten)`}
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
        </div>
      )}
    </div>
  );
}
