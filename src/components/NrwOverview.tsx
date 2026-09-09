import { useCallback, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BarChart3 } from "lucide-react";
import type { LandesweitReportVariant } from "../types/app";
import { LANDESWEIT_REPORT_VARIANT_LABELS } from "../types/app";
import { formatBerichtszeitpunktLabel, getEntwicklungZeitraumLabel, type EntwicklungZeitraum } from "../utils/periods";
import type { DashboardAreaKey, DashboardFilters } from "../types/domain";
import { useDashboardData } from "../hooks/useDashboardData";
import { generateKurzberichtPdf } from "../utils/generateKurzberichtPdf";
import { CategoryBarChart } from "./CategoryBarChart";
import { ChartShell } from "./ChartShell";
import { FilterBar } from "./FilterBar";
import { KurzberichtButton } from "./KurzberichtButton";
import { KpiCard } from "./KpiCard";
import { OperationalSummaryPanels } from "./OperationalSummaryPanels";
import { PeriodContextHeading } from "./PeriodContextHeading";
import { TerminationBarChart } from "./TerminationBarChart";
import { UtilizationTrendChart } from "./UtilizationTrendChart";
import { PaedPersonalDetailModal } from "./PaedPersonalDetailModal";
import { SchoolCompletionsDetailModal } from "./SchoolCompletionsDetailModal";
import { SchoolRoomsDetailModal } from "./SchoolRoomsDetailModal";

import { NrwJahresberichtView } from "./NrwJahresberichtView";
import { KernAlert } from "../ui/kern";

interface NrwOverviewProps {
  filters: DashboardFilters;
  onFiltersChange: (f: DashboardFilters) => void;
  demoMode: boolean;
  onNavigateDashboard?: (dashboard: DashboardAreaKey) => void;
  reportVariant?: LandesweitReportVariant;
  entwicklungZeitraum?: EntwicklungZeitraum;
  berichtszeitpunkt?: string;
}

export function NrwOverview({
  filters,
  onFiltersChange,
  demoMode,
  onNavigateDashboard,
  reportVariant = "entwicklung",
  entwicklungZeitraum,
  berichtszeitpunkt,
}: NrwOverviewProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [pdfExportMode, setPdfExportMode] = useState(false);

  const data = useDashboardData(filters, demoMode);
  const {
    kpis,
    previousKpis,
    previousPeriodLabel,
    categoryChart,
    terminationChart,
    utilizationTrend,
    trendRecords,
    schoolRoomSummaries,
    schoolCompletionsDetail,
    jvaOperationalRows,
    jvaTableRows,
    hasData,
  } = data;

  const isJahresbericht = reportVariant === "jahresbericht";

  const demoBadge = demoMode ? "Demo-Daten" : undefined;
  const emptyChartMsg = "Keine Daten für aktuelle Filterauswahl. Werte kommen später aus BASIS.";
  const [schoolRoomsOpen, setSchoolRoomsOpen] = useState(false);
  const [completionsOpen, setCompletionsOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const schoolRoomsClick = demoMode ? () => setSchoolRoomsOpen(true) : undefined;
  const completionsClick = demoMode ? () => setCompletionsOpen(true) : undefined;
  const personalClick = demoMode ? () => setPersonalOpen(true) : undefined;

  const schoolRoomModalRows = useMemo(() => schoolRoomSummaries, [schoolRoomSummaries]);
  const pdfBlockClass = pdfExportMode ? "dashboard-kpi p-4" : "";

  const handleKurzbericht = useCallback(async () => {
    const scrollY = window.scrollY;

    flushSync(() => {
      setPdfExportMode(true);
    });

    exportRef.current?.scrollIntoView({ block: "start" });
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      if (!exportRef.current) {
        throw new Error("Export-Bereich nicht gefunden.");
      }
      await generateKurzberichtPdf({ root: exportRef.current });
    } finally {
      flushSync(() => {
        setPdfExportMode(false);
      });
      window.scrollTo(0, scrollY);
    }
  }, []);

  return (
    <>
      <div className="flex justify-end">
        <KurzberichtButton onGenerate={handleKurzbericht} />
      </div>

      <FilterBar filters={filters} onChange={onFiltersChange} role="ministry" />

      {!isJahresbericht && (
        <KernAlert title="Berichtsausgabe" variant="info">
          {LANDESWEIT_REPORT_VARIANT_LABELS[reportVariant]}
          {entwicklungZeitraum ? (
            <>
              {' '}
              · Berichtszeitraum: {getEntwicklungZeitraumLabel(entwicklungZeitraum)}
              {berichtszeitpunkt ? (
                <>
                  {' '}
                  · Berichtszeitpunkt:{' '}
                  {formatBerichtszeitpunktLabel(entwicklungZeitraum, berichtszeitpunkt)}
                </>
              ) : null}
            </>
          ) : null}
        </KernAlert>
      )}

      <div ref={exportRef} data-kurzbericht-root className="space-y-6">
        <div data-pdf-block>
          <PeriodContextHeading filters={filters} />
        </div>

        {isJahresbericht ? (
          <section className="kern-card kern-card--hug dashboard-panel space-y-4 p-4">
            <div data-pdf-block className={pdfBlockClass}>
              <div className="flex items-center gap-2 text-(--color-ink)">
                <BarChart3 className="h-5 w-5" aria-hidden />
                <h2 className="kern-heading-small">Jahresbericht — tabellarische Auswertung</h2>
              </div>
              <div className="mt-4">
                <NrwJahresberichtView kpis={kpis} jvaRows={jvaTableRows} demoMode={demoMode} />
              </div>
            </div>
          </section>
        ) : (
        <>
          <div data-pdf-block className={pdfBlockClass}>
            <div
              className={
                pdfExportMode
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3"
                  : "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
              }
            >
              <KpiCard
                exportMode={pdfExportMode}
                title="Teilnehmende / Soll-Plätze"
                value={kpis.teilnehmende}
                suffixValue={kpis.sollPlaetze}
                previousValue={previousKpis.teilnehmende}
                previousSuffixValue={previousKpis.sollPlaetze}
                previousPeriodLabel={previousPeriodLabel}
                badge={demoBadge}
                showNotLoadedBadge={!demoMode}
              />
              <KpiCard
                accent="purple"
                exportMode={pdfExportMode}
                title="Beschäftigungsquote gesamt"
                value={kpis.beschaeftigungsquote}
                isPercent
                previousValue={previousKpis.beschaeftigungsquote}
                previousPeriodLabel={previousPeriodLabel}
                secondaryMetric={{
                  label: "Auslastungsquote der tatsächlich belegbaren Haftplätze (Bruttobelegung)",
                  value: kpis.bruttobelegung,
                  isPercent: true,
                  previousValue: previousKpis.bruttobelegung,
                }}
                badge={demoBadge}
                showNotLoadedBadge={!demoMode}
                onClick={onNavigateDashboard ? () => onNavigateDashboard("beschaeftigungsquote") : undefined}
              />
              <KpiCard
                exportMode={pdfExportMode}
                title="Beschäftigungsquote schulische Bildung"
                value={kpis.schulischeBildung}
                isPercent
                previousValue={previousKpis.schulischeBildung}
                previousPeriodLabel={previousPeriodLabel}
                badge={demoBadge}
                showNotLoadedBadge={!demoMode}
              />
              <KpiCard
                exportMode={pdfExportMode}
                title="Auslastungsquote schulische Maßnahmen"
                value={kpis.auslastung}
                isPercent
                previousValue={previousKpis.auslastung}
                previousPeriodLabel={previousPeriodLabel}
                badge={demoBadge}
                showNotLoadedBadge={!demoMode}
              />
              <KpiCard
                exportMode={pdfExportMode}
                title="Erreichte Schulabschlüsse"
                value={kpis.abschluesse}
                previousValue={previousKpis.abschluesse}
                previousPeriodLabel={previousPeriodLabel}
                badge={demoBadge}
                showNotLoadedBadge={!demoMode}
                onClick={completionsClick}
              />
              <KpiCard
                exportMode={pdfExportMode}
                title="Beendigungen nach Art"
                valueLabel="Vorzeitige Beendigung"
                value={kpis.anteilVorzeitigeBeendigung}
                isPercent
                previousValue={previousKpis.anteilVorzeitigeBeendigung}
                previousPeriodLabel={previousPeriodLabel}
                secondaryMetric={{
                  label: "Reguläre Beendigung",
                  value: kpis.anteilRegulaereBeendigung,
                  isPercent: true,
                  previousValue: previousKpis.anteilRegulaereBeendigung,
                }}
                badge={demoBadge}
                showNotLoadedBadge={!demoMode}
              />
            </div>
          </div>

          <div className={pdfExportMode ? "space-y-4" : "grid grid-cols-1 gap-4 lg:grid-cols-2"}>
            <div {...(pdfExportMode ? { "data-pdf-block": true } : {})} className={pdfBlockClass}>
              <ChartShell
                pdfExportMode={pdfExportMode}
                title="Kursangebote nach Hauptkategorie"
                subtitle="Teilnehmende nach BASIS-Kurskatalog"
                hasData={categoryChart.length > 0}
                emptyDescription={hasData ? undefined : emptyChartMsg}
                expandable
                expandedHeight={pdfExportMode ? 420 : 420}
                expandedChart={(height, width) => (
                  <CategoryBarChart data={categoryChart} height={height} width={width} pdfExportMode={pdfExportMode} />
                )}
              />
            </div>

            <div {...(pdfExportMode ? { "data-pdf-block": true } : {})} className={pdfBlockClass}>
              <ChartShell
                pdfExportMode={pdfExportMode}
                title="Entwicklung Auslastungsquote der schulischen Maßnahme(n)"
                infoDescription="Die Auslastungsquote = besetzte Plätze durch Soll-Plätze"
                subtitle="Zeitverlauf nach gewählter Granularität"
                hasData={utilizationTrend.some((d) => d.value > 0)}
                emptyDescription={hasData ? undefined : emptyChartMsg}
                expandable
                interactiveChart
                expandedHeight={pdfExportMode ? 380 : 280}
                expandedChart={(height, width) => (
                  <UtilizationTrendChart
                    records={trendRecords}
                    filters={filters}
                    height={height}
                    width={width}
                    hideControls={pdfExportMode || Boolean(entwicklungZeitraum)}
                    entwicklungZeitraum={entwicklungZeitraum}
                    berichtszeitpunkt={berichtszeitpunkt}
                    pdfExportMode={pdfExportMode}
                  />
                )}
              />
            </div>
          </div>

          <div {...(pdfExportMode ? { "data-pdf-block": true } : {})} className={pdfBlockClass}>
            <ChartShell
              pdfExportMode={pdfExportMode}
              title="Beendigungsgründe"
              subtitle="Auswertung nach BASIS-Beendigungsgrund"
              hasData={terminationChart.length > 0}
              emptyDescription={hasData ? undefined : emptyChartMsg}
              expandable
              interactiveChart
              previewHeight={340}
              expandedHeight={520}
              expandedChart={(height, width) => (
                <TerminationBarChart
                  data={terminationChart}
                  height={height}
                  width={width}
                  pdfExportMode={pdfExportMode}
                />
              )}
            />
          </div>
        </>
        )}
      </div>

      {!pdfExportMode && !isJahresbericht && (
        <OperationalSummaryPanels
          kpis={kpis}
          demoMode={demoMode}
          scopeLabel="Landesweit summiert · alle JVAen"
          onPersonalClick={personalClick}
          onSchulraeumeClick={schoolRoomsClick}
        />
      )}

      <PaedPersonalDetailModal
        open={personalOpen}
        title="Personal (pädagogischer Dienst) — Detailansicht"
        rows={jvaOperationalRows}
        totalStellen={kpis.paedStellen}
        totalBesetzt={kpis.paedBesetzt}
        totalExtern={kpis.paedExtern}
        onClose={() => setPersonalOpen(false)}
      />

      <SchoolCompletionsDetailModal
        open={completionsOpen}
        title="Erreichte Schulabschlüsse — Detailansicht"
        rows={schoolCompletionsDetail}
        total={kpis.abschluesse}
        onClose={() => setCompletionsOpen(false)}
      />

      <SchoolRoomsDetailModal
        open={schoolRoomsOpen}
        title="Schulräume — Detailansicht (alle JVAen)"
        summaries={schoolRoomModalRows}
        totalSchulraeume={kpis.schulraeume}
        totalElisSchulraeume={kpis.elisSchulraeume}
        onClose={() => setSchoolRoomsOpen(false)}
      />
    </>
  );
}
