import type { LandesweitReportVariant } from "../types/app";
import type { EntwicklungZeitraum } from "../utils/periods";
import type { DashboardAreaKey, DashboardFilters } from "../types/domain";
import { getDashboardArea } from "../data/dashboardAreas";
import { FilterBar } from "./FilterBar";
import { NrwOverview } from "./NrwOverview";
import { KernAlert } from "../ui/kern";

interface AreaNrwDashboardProps {
  areaKey: DashboardAreaKey;
  filters: DashboardFilters;
  onFiltersChange: (f: DashboardFilters) => void;
  demoMode: boolean;
  onNavigateDashboard?: (dashboard: DashboardAreaKey) => void;
  landesweitReportVariant?: LandesweitReportVariant;
  entwicklungZeitraum?: EntwicklungZeitraum | null;
  berichtszeitpunkt?: string | null;
}

export function AreaNrwDashboard({
  areaKey,
  filters,
  onFiltersChange,
  demoMode,
  onNavigateDashboard,
  landesweitReportVariant = "entwicklung",
  entwicklungZeitraum = null,
  berichtszeitpunkt = null,
}: AreaNrwDashboardProps) {
  if (areaKey === "schulische-bildung") {
    return (
      <NrwOverview
        filters={filters}
        onFiltersChange={onFiltersChange}
        demoMode={demoMode}
        onNavigateDashboard={onNavigateDashboard}
        reportVariant={landesweitReportVariant}
        entwicklungZeitraum={entwicklungZeitraum ?? undefined}
        berichtszeitpunkt={berichtszeitpunkt ?? undefined}
      />
    );
  }

  const area = getDashboardArea(areaKey);

  return (
    <>
      <FilterBar filters={filters} onChange={onFiltersChange} role="ministry" />
      <KernAlert title={area.title} variant="info">
        Das Landesdashboard für {area.sidebarLabel} wird vorbereitet. Wählen Sie im Menü
        „JVA-Stammdatenblatt“ für anstaltsbezogene Auswertungen.
      </KernAlert>
    </>
  );
}
