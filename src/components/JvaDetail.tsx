import { useCallback, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { DashboardAreaKey, DashboardFilters, Massnahmenbeginn } from "../types/domain";
import { useDashboardData } from "../hooks/useDashboardData";
import { generateKurzberichtPdf } from "../utils/generateKurzberichtPdf";
import { getJvaById, JVAS } from "../data/jvas";
import { EMPTY_VALUE_LABEL, formatDate, formatNumber, formatPercent, formatKursleitung } from "../utils/format";
import { ChartShell } from "./ChartShell";
import { CourseUtilizationBarChart } from "./CourseUtilizationBarChart";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { KurzberichtButton } from "./KurzberichtButton";
import { KpiCard } from "./KpiCard";
import { OperationalSummaryPanels } from "./OperationalSummaryPanels";
import { PeriodContextHeading } from "./PeriodContextHeading";
import { RegulaereTerminationReasonsCard } from "./RegulaereTerminationReasonsCard";
import { PaedPersonalDetailModal } from "./PaedPersonalDetailModal";
import { SchoolCompletionsDetailModal } from "./SchoolCompletionsDetailModal";
import { SchoolRoomsDetailModal } from "./SchoolRoomsDetailModal";
import { TerminationBarChart } from "./TerminationBarChart";
import { UtilizationTrendChart } from "./UtilizationTrendChart";

function MassnahmenbeginnCell({ value }: { value: Massnahmenbeginn | null }) {
  if (!value) return <>{EMPTY_VALUE_LABEL}</>;
  if (value.type === "fortlaufend") return <>Fortlaufend</>;

  const dates = value.dates.map((date) => formatDate(date)).filter((date) => date !== EMPTY_VALUE_LABEL);
  if (dates.length === 0) return <>{EMPTY_VALUE_LABEL}</>;

  if (dates.length === 1) return <>{dates[0]}</>;

  return (
    <ul className="list-none space-y-0.5">
      {dates.map((date) => (
        <li key={date}>{date}</li>
      ))}
    </ul>
  );
}

interface JvaDetailProps {
  jvaId: string;
  filters: DashboardFilters;
  onFiltersChange: (f: DashboardFilters) => void;
  demoMode: boolean;
  isJvaRole?: boolean;
  dashboardAreaContext?: DashboardAreaKey | null;
  onJvaChange?: (jvaId: string) => void;
}

export function JvaDetail({
  jvaId,
  filters,
  onFiltersChange,
  demoMode,
  isJvaRole = false,
  dashboardAreaContext = null,
  onJvaChange,
}: JvaDetailProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [pdfExportMode, setPdfExportMode] = useState(false);

  const jva = getJvaById(jvaId);
  const data = useDashboardData(filters, demoMode, jvaId);
  const { kpis, previousKpis, previousPeriodLabel, nrwKpis, nrwAverageKpis, terminationChart, regulaereTerminationBreakdown, courseRows, courseUtilizationChart, utilizationTrend, trendRecords, schoolRoomSummaries, schoolCompletionsDetail, jvaOperationalRows, hasData } = data;
  const inDashboardAreaContext = dashboardAreaContext != null;

  const demoBadge = demoMode ? "Demo-Daten" : undefined;
  const emptyChartMsg = "Keine Daten für aktuelle Filterauswahl.";
  const [schoolRoomsOpen, setSchoolRoomsOpen] = useState(false);
  const [completionsOpen, setCompletionsOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const schoolRoomsClick = demoMode ? () => setSchoolRoomsOpen(true) : undefined;
  const completionsClick = demoMode ? () => setCompletionsOpen(true) : undefined;
  const personalClick = demoMode ? () => setPersonalOpen(true) : undefined;
  const schoolRoomModalRows = useMemo(() => schoolRoomSummaries, [schoolRoomSummaries]);
  const jvaOptions = useMemo(
    () => [...JVAS].sort((a, b) => a.name.localeCompare(b.name, "de-DE")),
    [],
  );
  const pdfBlockClass = pdfExportMode
    ? "rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
    : "";

  const handleKurzbericht = useCallback(async () => {
    if (!jva) return;

    const scrollY = window.scrollY;
    const safeName = jva.name.replace(/[^\wäöüÄÖÜß-]+/g, "-").replace(/-+/g, "-");

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
      const stamp = new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(new Date())
        .replace(/\./g, "-");
      await generateKurzberichtPdf({
        root: exportRef.current,
        filename: `Kurzbericht_JVA_${safeName}_${stamp}.pdf`,
      });
    } finally {
      flushSync(() => {
        setPdfExportMode(false);
      });
      window.scrollTo(0, scrollY);
    }
  }, [jva]);

  if (!jva) {
    return <EmptyState title="JVA nicht gefunden" description="Bitte eine gültige JVA auswählen." />;
  }

  return (
    <>
      <div className="flex justify-end">
        <KurzberichtButton onGenerate={handleKurzbericht} />
      </div>

      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        role={isJvaRole ? "jva" : "ministry"}
        showJvaFilter={!isJvaRole && !inDashboardAreaContext}
      />

      <div ref={exportRef} data-kurzbericht-root className="space-y-6">
        <div data-pdf-block>
          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {pdfExportMode || isJvaRole ? (
                  <h2 className="text-base font-semibold text-(--color-ink)">{jva.name}</h2>
                ) : (
                  <div className="max-w-md">
                    <label htmlFor="jva-stammdaten-select" className="text-xs font-medium text-slate-500">
                      JVA auswählen
                    </label>
                    <select
                      id="jva-stammdaten-select"
                      value={jvaId}
                      onChange={(event) => onJvaChange?.(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-(--color-ink) shadow-sm focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/30"
                    >
                      {jvaOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="mt-2 text-sm text-slate-600">
                  {jva.region ? `Region ${jva.region} · ` : ""}
                  Geschlecht: {jva.geschlecht} · Haftform: {jva.haftform} · Altersgruppe: {jva.altersgruppe}
                </p>
              </div>
              {!isJvaRole && !pdfExportMode && (
                <p className="text-xs text-slate-500">Ansicht aus Sicht der ausgewählten JVA</p>
              )}
            </div>
          </section>
        </div>

        <div data-pdf-block>
          <PeriodContextHeading
            filters={filters}
            hideJva={!isJvaRole && inDashboardAreaContext}
          />
        </div>

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
              title="Freie Plätze"
              value={kpis.freiePlaetze}
              previousValue={previousKpis.freiePlaetze}
              previousPeriodLabel={previousPeriodLabel}
              nrwComparison={nrwAverageKpis.freiePlaetze}
              nrwComparisonIsAverage
              badge={demoBadge}
              showNotLoadedBadge={!demoMode}
            />
            <KpiCard
              exportMode={pdfExportMode}
              title="Teilnehmende / Soll-Plätze"
              value={kpis.teilnehmende}
              suffixValue={kpis.sollPlaetze}
              previousValue={previousKpis.teilnehmende}
              previousSuffixValue={previousKpis.sollPlaetze}
              previousPeriodLabel={previousPeriodLabel}
              nrwComparison={nrwAverageKpis.teilnehmende}
              nrwComparisonSuffixValue={nrwAverageKpis.sollPlaetze}
              nrwComparisonIsAverage
              badge={demoBadge}
              showNotLoadedBadge={!demoMode}
            />
            <KpiCard
              exportMode={pdfExportMode}
              accent="purple"
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
              nrwComparison={nrwKpis.beschaeftigungsquote}
              badge={demoBadge}
              showNotLoadedBadge={!demoMode}
            />
            <KpiCard exportMode={pdfExportMode} title="Beschäftigungsquote schulische Bildung" value={kpis.schulischeBildung} isPercent previousValue={previousKpis.schulischeBildung} previousPeriodLabel={previousPeriodLabel} nrwComparison={nrwKpis.schulischeBildung} badge={demoBadge} showNotLoadedBadge={!demoMode} />
            <KpiCard exportMode={pdfExportMode} title="Auslastungsquote" value={kpis.auslastung} isPercent previousValue={previousKpis.auslastung} previousPeriodLabel={previousPeriodLabel} nrwComparison={nrwKpis.auslastung} badge={demoBadge} showNotLoadedBadge={!demoMode} />
            <KpiCard
              exportMode={pdfExportMode}
              title="Erreichte Schulabschlüsse"
              value={kpis.abschluesse}
              previousValue={previousKpis.abschluesse}
              previousPeriodLabel={previousPeriodLabel}
              nrwComparison={nrwAverageKpis.abschluesse}
              nrwComparisonIsAverage
              badge={demoBadge}
              showNotLoadedBadge={!demoMode}
              onClick={completionsClick}
            />
          </div>
        </div>

        <div className={pdfExportMode ? "space-y-4" : "grid grid-cols-1 gap-4 lg:grid-cols-2"}>
          <div {...(pdfExportMode ? { "data-pdf-block": true } : {})} className={pdfBlockClass}>
            <ChartShell
              pdfExportMode={pdfExportMode}
              title="Auslastung nach Kurs"
              subtitle="BASIS-Kursgrundbezeichnungen"
              hasData={courseUtilizationChart.length > 0}
              emptyDescription={hasData ? undefined : emptyChartMsg}
              expandable
              expandedHeight={pdfExportMode ? 420 : 420}
              expandedChart={(height) => (
                <CourseUtilizationBarChart
                  data={courseUtilizationChart}
                  height={height}
                  pdfExportMode={pdfExportMode}
                />
              )}
            />
          </div>
          <div {...(pdfExportMode ? { "data-pdf-block": true } : {})} className={pdfBlockClass}>
            <ChartShell
              pdfExportMode={pdfExportMode}
              title="Entwicklung Auslastungsquote"
              subtitle="Zeitverlauf nach gewählter Granularität"
              hasData={utilizationTrend.some((d) => d.value > 0)}
              emptyDescription={hasData ? undefined : emptyChartMsg}
              expandable
              interactiveChart
              expandedHeight={pdfExportMode ? 380 : 280}
              expandedChart={(height) => (
                <UtilizationTrendChart
                  records={trendRecords}
                  filters={filters}
                  forcedJvaId={jvaId}
                  height={height}
                  hideControls={pdfExportMode}
                  pdfExportMode={pdfExportMode}
                />
              )}
            />
          </div>
        </div>

        <div className={pdfExportMode ? "space-y-4" : "flex flex-col gap-4 lg:flex-row lg:items-stretch"}>
          <div
            {...(pdfExportMode ? { "data-pdf-block": true } : {})}
            className={pdfExportMode ? pdfBlockClass : "grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[252px] lg:grid-cols-1 xl:w-[272px]"}
          >
            <RegulaereTerminationReasonsCard
              rows={regulaereTerminationBreakdown}
              demoMode={demoMode}
              badge={demoBadge}
            />
            <KpiCard
              exportMode={pdfExportMode}
              compact
              title="Vorzeitige Beendigungen"
              value={kpis.vorzeitigeBeendigungen}
              previousValue={previousKpis.vorzeitigeBeendigungen}
              previousPeriodLabel={previousPeriodLabel}
              nrwComparison={nrwAverageKpis.vorzeitigeBeendigungen}
              nrwComparisonIsAverage
              badge={demoBadge}
              showNotLoadedBadge={!demoMode}
            />
          </div>
          <div {...(pdfExportMode ? { "data-pdf-block": true } : {})} className={pdfExportMode ? pdfBlockClass : "min-w-0 flex-1"}>
            <ChartShell
              pdfExportMode={pdfExportMode}
              title="Beendigungsgründe (JVA)"
              hasData={terminationChart.length > 0}
              emptyDescription={hasData ? undefined : emptyChartMsg}
              expandable
              interactiveChart
              previewHeight={320}
              expandedHeight={520}
              className={pdfExportMode ? undefined : "min-w-0 flex-1"}
              expandedChart={(height) => (
                <TerminationBarChart data={terminationChart} height={height} pdfExportMode={pdfExportMode} />
              )}
            />
          </div>
        </div>

        <div data-pdf-block data-pdf-landscape data-pdf-multipage data-pdf-capture-width="2400">
          <section
            className={
              pdfExportMode
                ? "overflow-visible rounded-xl border border-slate-200/80 bg-white shadow-sm"
                : "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
            }
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-(--color-ink)">Kursangebot der JVA</h3>
              <p className="text-xs text-slate-500 mt-0.5">Soll-Plätze gemäß BASIS-Katalog (Mindest-Soll Erwachsene)</p>
            </div>
            <div className={pdfExportMode ? "overflow-visible px-2 pb-2" : "overflow-x-auto max-h-[320px] overflow-y-auto"}>
              <table
                className={
                  pdfExportMode
                    ? "w-full min-w-[2320px] border-collapse text-[10px] leading-tight"
                    : "min-w-full text-sm"
                }
              >
                <thead
                  className={
                    pdfExportMode
                      ? "bg-slate-50 text-[10px] uppercase text-slate-500"
                      : "sticky top-0 bg-slate-50 text-xs uppercase text-slate-500"
                  }
                >
                  <tr>
                    <th className="px-3 py-2 text-left" rowSpan={2}>
                      Überkategorie
                    </th>
                    <th className="px-3 py-2 text-left" rowSpan={2}>
                      Kursgrundbezeichnung
                    </th>
                    <th
                      className="border-b border-slate-200 px-3 py-2 text-center normal-case"
                      colSpan={2}
                    >
                      Zielgruppe
                    </th>
                    <th className="px-3 py-2 text-left" rowSpan={2}>
                      Kursleitung
                    </th>
                    <th className="px-3 py-2 text-left normal-case" rowSpan={2}>
                      Maßnahmenbeginn
                    </th>
                    <th className="px-3 py-2 text-left" rowSpan={2}>
                      Dauer
                    </th>
                    <th className="px-3 py-2 text-left" rowSpan={2}>
                      Teilnehmende
                    </th>
                    <th className="px-3 py-2 text-left" rowSpan={2}>
                      Soll-Plätze
                    </th>
                    <th className="px-3 py-2 text-left normal-case" rowSpan={2}>
                      Auslastung (letzter Monat)
                    </th>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 text-left normal-case">Geschlecht</th>
                    <th className="px-3 py-2 text-left normal-case">Altersgruppe</th>
                  </tr>
                </thead>
                <tbody>
                  {courseRows.length > 0 ? (
                    courseRows.map((row) => (
                      <tr key={row.courseTypeKey} className="border-t border-slate-100">
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top break-words" : "px-3 py-2"}>{row.courseCategory}</td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top break-words" : "px-3 py-2"}>{row.courseType}</td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top whitespace-nowrap" : "px-3 py-2"}>{row.zielgruppeGeschlecht}</td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top whitespace-nowrap" : "px-3 py-2"}>{row.zielgruppeAltersgruppe}</td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top break-words" : "px-3 py-2"}>{formatKursleitung(row.kursleitung)}</td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top break-words text-slate-600" : "px-3 py-2 text-slate-600"}>
                          <MassnahmenbeginnCell value={row.massnahmenbeginn} />
                        </td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top whitespace-nowrap text-slate-500" : "px-3 py-2 text-slate-500"}>{row.duration ?? "—"}</td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top whitespace-nowrap" : "px-3 py-2"}>{formatNumber(row.participants)}</td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top whitespace-nowrap" : "px-3 py-2"}>{formatNumber(row.targetPlaces)}</td>
                        <td className={pdfExportMode ? "px-2 py-1.5 align-top whitespace-nowrap" : "px-3 py-2"}>{formatPercent(row.utilizationLastMonth)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-4">
                        <EmptyState description={demoMode ? "Keine Maßnahmen für aktuelle Filterauswahl." : "Kursangebote werden aus BASIS-Web geladen."} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {!pdfExportMode && (
        <div className="space-y-4">
          <OperationalSummaryPanels
            kpis={kpis}
            demoMode={demoMode}
            onPersonalClick={personalClick}
            onSchulraeumeClick={schoolRoomsClick}
          />
          <section className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-(--color-ink)">Datenqualität / offene Klärungen</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
              <li>Soll-Plätze aus BASIS-Katalog (Mindest-Soll Erwachsene)</li>
              <li>Beendigungsgründe RB-01–VB-07 nach Excel-Katalog</li>
              <li>Datenstand wird aus BASIS-Web übernommen</li>
            </ul>
          </section>
        </div>
      )}

      <PaedPersonalDetailModal
        open={personalOpen}
        title={`Personal (pädagogischer Dienst) — Detailansicht (${jva.name})`}
        rows={jvaOperationalRows}
        totalStellen={kpis.paedStellen}
        totalBesetzt={kpis.paedBesetzt}
        totalExtern={kpis.paedExtern}
        onClose={() => setPersonalOpen(false)}
      />

      <SchoolCompletionsDetailModal
        open={completionsOpen}
        title={`Erreichte Schulabschlüsse — Detailansicht (${jva.name})`}
        rows={schoolCompletionsDetail}
        total={kpis.abschluesse}
        onClose={() => setCompletionsOpen(false)}
      />

      <SchoolRoomsDetailModal
        open={schoolRoomsOpen}
        title={`Schulräume — Detailansicht (${jva.name})`}
        summaries={schoolRoomModalRows}
        totalSchulraeume={kpis.schulraeume}
        totalElisSchulraeume={kpis.elisSchulraeume}
        onClose={() => setSchoolRoomsOpen(false)}
      />
    </>
  );
}
