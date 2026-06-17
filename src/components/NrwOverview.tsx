import { useMemo, useState } from "react";
import type { DashboardAreaKey, DashboardFilters } from "../types/domain";
import { useDashboardData } from "../hooks/useDashboardData";
import { CategoryBarChart } from "./CategoryBarChart";
import { ChartShell } from "./ChartShell";
import { FilterBar } from "./FilterBar";
import { KpiCard } from "./KpiCard";
import { OperationalSummaryPanels } from "./OperationalSummaryPanels";
import { PeriodContextHeading } from "./PeriodContextHeading";
import { TerminationBarChart } from "./TerminationBarChart";
import { UtilizationTrendChart } from "./UtilizationTrendChart";
import { FreePlacesGroupedDetailModal } from "./FreePlacesGroupedDetailModal";
import { SchoolRoomsDetailModal } from "./SchoolRoomsDetailModal";

interface NrwOverviewProps {
  filters: DashboardFilters;
  onFiltersChange: (f: DashboardFilters) => void;
  demoMode: boolean;
  onNavigateDashboard?: (dashboard: DashboardAreaKey) => void;
}

export function NrwOverview({ filters, onFiltersChange, demoMode, onNavigateDashboard }: NrwOverviewProps) {
  const data = useDashboardData(filters, demoMode);
  const { kpis, previousKpis, previousPeriodLabel, categoryChart, terminationChart, utilizationTrend, trendRecords, freeCapacityRows, schoolRoomSummaries, hasData } = data;

  const demoBadge = demoMode ? "Demo-Daten" : undefined;
  const emptyChartMsg = "Keine Daten für aktuelle Filterauswahl. Werte kommen später aus BASIS.";
  const [freePlacesOpen, setFreePlacesOpen] = useState(false);
  const [schoolRoomsOpen, setSchoolRoomsOpen] = useState(false);
  const freePlacesClick = demoMode ? () => setFreePlacesOpen(true) : undefined;
  const schoolRoomsClick = demoMode ? () => setSchoolRoomsOpen(true) : undefined;

  const modalRows = useMemo(() => freeCapacityRows, [freeCapacityRows]);
  const schoolRoomModalRows = useMemo(() => schoolRoomSummaries, [schoolRoomSummaries]);

  return (
    <>
      <FilterBar filters={filters} onChange={onFiltersChange} role="ministry" />

      <PeriodContextHeading filters={filters} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          title="Freie Plätze"
          value={kpis.freiePlaetze}
          previousValue={previousKpis.freiePlaetze}
          previousPeriodLabel={previousPeriodLabel}
          badge={demoBadge}
          showNotLoadedBadge={!demoMode}
          onClick={freePlacesClick}
        />
        <KpiCard
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
          title="Beschäftigungsquote gesamt"
          value={kpis.beschaeftigungsquote}
          isPercent
          previousValue={previousKpis.beschaeftigungsquote}
          previousPeriodLabel={previousPeriodLabel}
          badge={demoBadge}
          showNotLoadedBadge={!demoMode}
          onClick={onNavigateDashboard ? () => onNavigateDashboard("beschaeftigungsquote") : undefined}
        />
        <KpiCard title="Beschäftigungsquote schulische Bildung" value={kpis.schulischeBildung} isPercent previousValue={previousKpis.schulischeBildung} previousPeriodLabel={previousPeriodLabel} badge={demoBadge} showNotLoadedBadge={!demoMode} />
        <KpiCard title="Auslastungsquote schulische Maßnahmen" value={kpis.auslastung} isPercent previousValue={previousKpis.auslastung} previousPeriodLabel={previousPeriodLabel} badge={demoBadge} showNotLoadedBadge={!demoMode} />
        <KpiCard title="Erreichte Schulabschlüsse" value={kpis.abschluesse} previousValue={previousKpis.abschluesse} previousPeriodLabel={previousPeriodLabel} badge={demoBadge} showNotLoadedBadge={!demoMode} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartShell
          title="Kursangebote nach Überkategorie"
          subtitle="Teilnehmende nach BASIS-Kurskatalog"
          hasData={categoryChart.length > 0}
          emptyDescription={hasData ? undefined : emptyChartMsg}
          expandable
          expandedChart={(height) => <CategoryBarChart data={categoryChart} height={height} />}
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
              height={height}
            />
          )}
        />

        <ChartShell
          title="Beendigungsgründe"
          subtitle="Auswertung nach BASIS-Beendigungsgrund"
          hasData={terminationChart.length > 0}
          emptyDescription={hasData ? undefined : emptyChartMsg}
          expandable
          expandedChart={(height) => <TerminationBarChart data={terminationChart} height={height} />}
        />
      </div>

      <OperationalSummaryPanels
        kpis={kpis}
        demoMode={demoMode}
        scopeLabel="Landesweit summiert · alle JVAen"
        onSchulraeumeClick={schoolRoomsClick}
      />

      <FreePlacesGroupedDetailModal
        open={freePlacesOpen}
        title="Freie Plätze — Detailansicht (Kursart & JVA)"
        rows={modalRows}
        onClose={() => setFreePlacesOpen(false)}
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
