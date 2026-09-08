import {
  completionTypes,
  courseCategories,
  courseTypes,
  getHaftartLabel,
  getTerminationLevelLabel,
  terminationReasons,
} from "../data/catalog";
import { formatJvaFilterSummary } from "./filters";
import type { DashboardFilters } from "../types/domain";
import { formatReportingPeriodLabel, formatTimeGranularityLabel } from "./format";

export interface FilterSummaryItem {
  label: string;
  value: string;
  isActive: boolean;
}

export interface FilterSummaryOptions {
  variant?: "default" | "free-places";
  hideJva?: boolean;
}

function formatAlleFilter(value: string, alleLabel = "Alle"): string {
  return value === "alle" ? alleLabel : value.charAt(0).toUpperCase() + value.slice(1);
}

function lookupCatalogLabel(
  items: { key: string; label: string }[],
  key: string | null,
  alleLabel = "Alle",
): string {
  if (!key) return alleLabel;
  return items.find((item) => item.key === key)?.label ?? key;
}

function createSummaryItem(label: string, value: string, isActive: boolean): FilterSummaryItem {
  return { label, value, isActive };
}

const INACTIVE_VALUES = new Set([
  "Alle",
  "Alle Haftarten",
  "Nicht ausgewählt",
  "Bitte zuerst Art wählen",
]);

function isActiveFilterValue(value: string): boolean {
  return !INACTIVE_VALUES.has(value);
}

export function buildFilterSummary(
  filters: DashboardFilters,
  options: FilterSummaryOptions = {},
): FilterSummaryItem[] {
  const { variant = "default", hideJva = false } = options;
  const items: FilterSummaryItem[] = [];

  if (variant !== "free-places") {
    const zeitraum = formatTimeGranularityLabel(filters.timeGranularity);
    const berichtszeitraum = formatReportingPeriodLabel(filters.reportingPeriod);
    items.push(createSummaryItem("Zeitraum", zeitraum, isActiveFilterValue(zeitraum)));
    items.push(
      createSummaryItem("Berichtszeitraum", berichtszeitraum, isActiveFilterValue(berichtszeitraum)),
    );

    if (!hideJva) {
      const jva = formatJvaFilterSummary(filters.jvaIds);
      items.push(createSummaryItem("JVA", jva, isActiveFilterValue(jva)));
    }
  }

  const geschlecht = formatAlleFilter(filters.geschlecht);
  const haftform = formatAlleFilter(filters.haftform);
  const altersgruppe = filters.altersgruppe === "alle" ? "Alle" : filters.altersgruppe;
  items.push(createSummaryItem("Geschlecht", geschlecht, isActiveFilterValue(geschlecht)));
  items.push(createSummaryItem("Haftform", haftform, isActiveFilterValue(haftform)));
  items.push(createSummaryItem("Altersgruppe", altersgruppe, isActiveFilterValue(altersgruppe)));

  if (variant !== "free-places") {
    const haftart = filters.haftart === "alle" ? "Alle Haftarten" : getHaftartLabel(filters.haftart);
    items.push(createSummaryItem("Haftart", haftart, isActiveFilterValue(haftart)));
  }

  const hauptkategorie = lookupCatalogLabel(courseCategories, filters.courseCategoryKey);
  const massnahmenkategorie = lookupCatalogLabel(courseTypes, filters.courseTypeKey);
  items.push(createSummaryItem("Hauptkategorie", hauptkategorie, isActiveFilterValue(hauptkategorie)));
  items.push(
    createSummaryItem("Maßnahmenkategorie", massnahmenkategorie, isActiveFilterValue(massnahmenkategorie)),
  );

  if (variant !== "free-places") {
    const beendigungsart = filters.terminationLevel1
      ? getTerminationLevelLabel(filters.terminationLevel1)
      : "Alle";
    const beendigungsgrund = !filters.terminationLevel1
      ? "Bitte zuerst Art wählen"
      : lookupCatalogLabel(terminationReasons, filters.terminationReasonKey);
    const abschlussart = lookupCatalogLabel(completionTypes, filters.completionType);
    items.push(
      createSummaryItem("Beendigungsart", beendigungsart, isActiveFilterValue(beendigungsart)),
    );
    items.push(
      createSummaryItem("Beendigungsgrund", beendigungsgrund, isActiveFilterValue(beendigungsgrund)),
    );
    items.push(createSummaryItem("Abschlussart", abschlussart, isActiveFilterValue(abschlussart)));
  }

  return items;
}
