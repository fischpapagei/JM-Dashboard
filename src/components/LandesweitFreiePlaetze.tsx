import { useCallback, useMemo } from "react";
import type { DashboardAreaKey, DashboardFilters } from "../types/domain";
import { AREA_COURSE_CATEGORY_KEYS, areaHasFreiePlaetze, getDashboardArea } from "../data/dashboardAreas";
import { useDashboardData } from "../hooks/useDashboardData";
import { exportFreiePlaetzeExcel } from "../utils/exportFreiePlaetzeExcel";
import { ExcelExportButton } from "./ExcelExportButton";
import { FilterBar } from "./FilterBar";
import { FreeCapacityTable } from "./FreeCapacityTable";
import { KpiCard } from "./KpiCard";
import { PeriodContextHeading } from "./PeriodContextHeading";

interface LandesweitFreiePlaetzeProps {
  areaKey: DashboardAreaKey;
  filters: DashboardFilters;
  onFiltersChange: (f: DashboardFilters) => void;
  demoMode: boolean;
}

export function LandesweitFreiePlaetze({
  areaKey,
  filters,
  onFiltersChange,
  demoMode,
}: LandesweitFreiePlaetzeProps) {
  const area = getDashboardArea(areaKey);
  const data = useDashboardData(filters, demoMode);
  const demoBadge = demoMode ? "Demo-Daten" : undefined;

  const rows = useMemo(() => {
    if (!areaHasFreiePlaetze(areaKey)) return [];
    const categoryKeys = AREA_COURSE_CATEGORY_KEYS[areaKey];
    return data.freeCapacityRows.filter((row) => categoryKeys.includes(row.courseCategoryKey));
  }, [areaKey, data.freeCapacityRows]);

  const totalFreePlaces = useMemo(
    () => rows.reduce((sum, row) => sum + (row.freePlaces ?? 0), 0),
    [rows],
  );

  const handleExcelExport = useCallback(() => {
    if (!areaHasFreiePlaetze(areaKey)) {
      throw new Error("Excel-Export ist für diesen Bereich nicht verfügbar.");
    }

    exportFreiePlaetzeExcel({
      areaKey,
      areaTitle: area.sidebarLabel,
      filters,
      rows,
    });
  }, [area.sidebarLabel, areaKey, filters, rows]);

  return (
    <>
      <div className="flex justify-end">
        <ExcelExportButton onExport={handleExcelExport} disabled={!demoMode} />
      </div>

      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        role="ministry"
        variant="free-places"
        showJvaFilter={false}
      />

      <PeriodContextHeading filters={filters} variant="free-places" hideJva />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          title="Freie Plätze gesamt"
          value={demoMode ? totalFreePlaces : null}
          badge={demoBadge}
          showNotLoadedBadge={!demoMode}
        />
      </div>

      <section className="kern-card kern-card--hug dashboard-panel p-4">
        <h2 className="kern-heading-small text-(--color-ink)">Landesweit freie Plätze</h2>
        <p className="mt-1 text-sm text-(--color-muted)">
          Tagesaktuelle freie Plätze für {area.sidebarLabel.toLowerCase()} — Auswertung aus BASIS-Web.
        </p>
      </section>

      <FreeCapacityTable rows={rows} />
    </>
  );
}
