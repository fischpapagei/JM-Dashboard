import { useMemo, useState } from "react";
import type { DashboardFilters, Massnahmenbeginn } from "../types/domain";
import { useDashboardData } from "../hooks/useDashboardData";
import { getJvaById } from "../data/jvas";
import { EMPTY_VALUE_LABEL, formatDate, formatNumber, formatPercent, formatKursleitung } from "../utils/format";
import { ChartShell } from "./ChartShell";
import { CourseUtilizationBarChart } from "./CourseUtilizationBarChart";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { KpiCard } from "./KpiCard";
import { OperationalSummaryPanels } from "./OperationalSummaryPanels";
import { PeriodContextHeading } from "./PeriodContextHeading";
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
  schulischeBildungContext?: boolean;
}

export function JvaDetail({
  jvaId,
  filters,
  onFiltersChange,
  demoMode,
  isJvaRole = false,
  schulischeBildungContext = false,
}: JvaDetailProps) {
  const jva = getJvaById(jvaId);
  const data = useDashboardData(filters, demoMode, jvaId);
  const { kpis, previousKpis, previousPeriodLabel, nrwKpis, nrwAverageKpis, terminationChart, courseRows, courseUtilizationChart, utilizationTrend, trendRecords, schoolRoomSummaries, hasData } = data;

  const demoBadge = demoMode ? "Demo-Daten" : undefined;
  const emptyChartMsg = "Keine Daten für aktuelle Filterauswahl.";
  const [schoolRoomsOpen, setSchoolRoomsOpen] = useState(false);
  const schoolRoomsClick = demoMode ? () => setSchoolRoomsOpen(true) : undefined;
  const schoolRoomModalRows = useMemo(() => schoolRoomSummaries, [schoolRoomSummaries]);

  if (!jva) {
    return <EmptyState title="JVA nicht gefunden" description="Bitte eine gültige JVA auswählen." />;
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-[#1a3352]">{jva.name}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {jva.region ? `Region ${jva.region} · ` : ""}
          Geschlecht: {jva.geschlecht} · Haftform: {jva.haftform} · Altersgruppe: {jva.altersgruppe}
        </p>
      </section>

      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        role={isJvaRole ? "jva" : "ministry"}
        showJvaFilter={!isJvaRole && !schulischeBildungContext}
        showOrganizationLevel={!schulischeBildungContext}
      />

      <PeriodContextHeading filters={filters} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
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
        <KpiCard title="Beschäftigungsquote gesamt" value={kpis.beschaeftigungsquote} isPercent previousValue={previousKpis.beschaeftigungsquote} previousPeriodLabel={previousPeriodLabel} nrwComparison={nrwKpis.beschaeftigungsquote} badge={demoBadge} showNotLoadedBadge={!demoMode} />
        <KpiCard title="Beschäftigungsquote schulische Bildung" value={kpis.schulischeBildung} isPercent previousValue={previousKpis.schulischeBildung} previousPeriodLabel={previousPeriodLabel} nrwComparison={nrwKpis.schulischeBildung} badge={demoBadge} showNotLoadedBadge={!demoMode} />
        <KpiCard title="Auslastungsquote" value={kpis.auslastung} isPercent previousValue={previousKpis.auslastung} previousPeriodLabel={previousPeriodLabel} nrwComparison={nrwKpis.auslastung} badge={demoBadge} showNotLoadedBadge={!demoMode} />
        <KpiCard
          title="Erreichte Schulabschlüsse"
          value={kpis.abschluesse}
          previousValue={previousKpis.abschluesse}
          previousPeriodLabel={previousPeriodLabel}
          nrwComparison={nrwAverageKpis.abschluesse}
          nrwComparisonIsAverage
          badge={demoBadge}
          showNotLoadedBadge={!demoMode}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartShell
          title="Auslastung nach Kurs"
          subtitle="BASIS-Kursgrundbezeichnungen"
          hasData={courseUtilizationChart.length > 0}
          emptyDescription={hasData ? undefined : emptyChartMsg}
          expandable
          expandedChart={(height) => <CourseUtilizationBarChart data={courseUtilizationChart} height={height} />}
        />
        <ChartShell
          title="Entwicklung Auslastungsquote"
          subtitle="Zeitverlauf nach gewählter Granularität"
          hasData={utilizationTrend.some((d) => d.value > 0)}
          emptyDescription={hasData ? undefined : emptyChartMsg}
          expandable
          interactiveChart
          expandedChart={(height) => (
            <UtilizationTrendChart
              records={trendRecords}
              filters={filters}
              forcedJvaId={jvaId}
              height={height}
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[252px] lg:grid-cols-1 xl:w-[272px]">
        <KpiCard
          compact
          title="Zielerreichungen"
          value={kpis.zielerreichungen}
          previousValue={previousKpis.zielerreichungen}
          previousPeriodLabel={previousPeriodLabel}
          nrwComparison={nrwAverageKpis.zielerreichungen}
          nrwComparisonIsAverage
          badge={demoBadge}
          showNotLoadedBadge={!demoMode}
        />
        <KpiCard
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
        <ChartShell
          title="Beendigungsgründe (JVA)"
          hasData={terminationChart.length > 0}
          emptyDescription={hasData ? undefined : emptyChartMsg}
          expandable
          previewHeight={280}
          className="min-w-0 flex-1"
          expandedChart={(height) => <TerminationBarChart data={terminationChart} height={height} />}
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1a3352]">Kursangebot der JVA</h3>
          <p className="text-xs text-slate-500 mt-0.5">Soll-Plätze gemäß BASIS-Katalog (Mindest-Soll Erwachsene)</p>
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Überkategorie</th>
                <th className="px-3 py-2 text-left">Kursgrundbezeichnung</th>
                <th className="px-3 py-2 text-left">Kursleitung</th>
                <th className="px-3 py-2 text-left normal-case">Maßnahmenbeginn</th>
                <th className="px-3 py-2 text-left">Dauer</th>
                <th className="px-3 py-2 text-left">Teilnehmende</th>
                <th className="px-3 py-2 text-left">Soll-Plätze</th>
                <th className="px-3 py-2 text-left">Auslastung</th>
                <th className="px-3 py-2 text-left normal-case">Reguläre Beendigung</th>
                <th className="px-3 py-2 text-left normal-case">Vorzeitige Beendigung</th>
              </tr>
            </thead>
            <tbody>
              {courseRows.length > 0 ? (
                courseRows.map((row) => (
                  <tr key={row.courseTypeKey} className="border-t border-slate-100">
                    <td className="px-3 py-2">{row.courseCategory}</td>
                    <td className="px-3 py-2">{row.courseType}</td>
                    <td className="px-3 py-2">{formatKursleitung(row.kursleitung)}</td>
                    <td className="px-3 py-2 text-slate-600">
                      <MassnahmenbeginnCell value={row.massnahmenbeginn} />
                    </td>
                    <td className="px-3 py-2 text-slate-500">{row.duration ?? "—"}</td>
                    <td className="px-3 py-2">{formatNumber(row.participants)}</td>
                    <td className="px-3 py-2">{formatNumber(row.targetPlaces)}</td>
                    <td className="px-3 py-2">{formatPercent(row.utilization)}</td>
                    <td className="px-3 py-2">{formatNumber(row.regulaereBeendigungen)}</td>
                    <td className="px-3 py-2">{formatNumber(row.vorzeitigeBeendigungen)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-4">
                    <EmptyState description={demoMode ? "Keine Maßnahmen für aktuelle Filterauswahl." : "Kursangebote werden aus BASIS-Web geladen."} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="space-y-4">
        <OperationalSummaryPanels
          kpis={kpis}
          demoMode={demoMode}
          onSchulraeumeClick={schoolRoomsClick}
        />
        <section className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1a3352]">Datenqualität / offene Klärungen</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
            <li>Soll-Plätze aus BASIS-Katalog (Mindest-Soll Erwachsene)</li>
            <li>Beendigungsgründe RB-01–VB-07 nach Excel-Katalog</li>
            <li>Datenstand wird aus BASIS-Web übernommen</li>
          </ul>
        </section>
      </div>

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
