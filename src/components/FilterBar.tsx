import { Filter, RotateCcw } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import {
  completionTypes,
  courseCategories,
  courseTypes,
  HAFTARTEN,
  terminationReasons,
} from "../data/catalog";
import { jvas } from "../data/jvas";
import type { DashboardFilters } from "../types/domain";
import type { UserRole } from "../types/auth";
import { resetDashboardFilters } from "../utils/filters";
import { getReportingPeriodSelectOptions } from "../utils/periods";

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  role?: UserRole;
  showJvaFilter?: boolean;
  showOrganizationLevel?: boolean;
}

function FilterCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-100/90 p-3 min-w-[140px] flex-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

const selectCls =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 shadow-sm focus:border-[#2d5a8e] focus:outline-none focus:ring-1 focus:ring-[#2d5a8e]";

export function FilterBar({
  filters,
  onChange,
  role,
  showJvaFilter = true,
  showOrganizationLevel = true,
}: FilterBarProps) {
  const hideJva = role === "jva" || !showJvaFilter;

  const set = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    const next = { ...filters, [key]: value };
    if (key === "courseCategoryKey" && value !== filters.courseCategoryKey) {
      next.courseTypeKey = null;
    }
    if (key === "organizationLevel" && value === "nrw") {
      next.jvaId = null;
    }
    onChange(next);
  };

  const filteredCourseTypes = useMemo(() => {
    if (!filters.courseCategoryKey) return courseTypes;
    return courseTypes.filter((c) => c.categoryKey === filters.courseCategoryKey);
  }, [filters.courseCategoryKey]);

  const reportingPeriodOptions = useMemo(() => getReportingPeriodSelectOptions(), []);

  const handleReset = () => {
    onChange(
      resetDashboardFilters({
        role,
        lockJvaId: role === "jva" ? filters.jvaId : null,
      }),
    );
  };

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[#1a3352]">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" aria-hidden />
          <h2 className="text-sm font-semibold">Auswertungsfilter</h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#2d5a8e] shadow-sm transition-colors hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Filter zurücksetzen
        </button>
      </div>

      {/* Ebene 1: Zeit & Organisation */}
      <FilterRow>
        <FilterCard label="Zeitraum">
          <select
            className={selectCls}
            value={filters.timeGranularity ?? ""}
            onChange={(e) => set("timeGranularity", (e.target.value || null) as DashboardFilters["timeGranularity"])}
          >
            <option value="">Nicht ausgewählt</option>
            <option value="month">Monat</option>
            <option value="quarter">Quartal</option>
            <option value="year">Jahr</option>
          </select>
        </FilterCard>

        <FilterCard label="Berichtszeitraum">
          <select
            className={selectCls}
            value={filters.reportingPeriod ?? ""}
            onChange={(e) => set("reportingPeriod", e.target.value || null)}
          >
            <option value="">Nicht ausgewählt</option>
            <optgroup label="Quartale">
              {reportingPeriodOptions.quarters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Jahre">
              {reportingPeriodOptions.years.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
            {reportingPeriodOptions.monthsByYear.map(({ year, months }) => (
              <optgroup key={year} label={`Monate ${year}`}>
                {months.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </FilterCard>

        {showOrganizationLevel && (
          <FilterCard label="Organisationsebene">
            <select
              className={selectCls}
              value={filters.organizationLevel}
              onChange={(e) =>
                set("organizationLevel", e.target.value as DashboardFilters["organizationLevel"])
              }
            >
              <option value="nrw">NRW gesamt</option>
              <option value="jva">Einzelne JVA</option>
            </select>
          </FilterCard>
        )}

        {!hideJva && (
          <FilterCard label="JVA">
            <select
              className={selectCls}
              value={filters.jvaId ?? ""}
              onChange={(e) => set("jvaId", e.target.value || null)}
            >
              <option value="">Alle</option>
              {jvas.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </FilterCard>
        )}
      </FilterRow>

      {/* Ebene 2: Personenmerkmale */}
      <FilterRow>
        <FilterCard label="Geschlecht">
          <select
            className={selectCls}
            value={filters.geschlecht}
            onChange={(e) => set("geschlecht", e.target.value as DashboardFilters["geschlecht"])}
          >
            <option value="alle">Alle</option>
            <option value="männlich">Männlich</option>
            <option value="weiblich">Weiblich</option>
          </select>
        </FilterCard>

        <FilterCard label="Haftform">
          <select
            className={selectCls}
            value={filters.haftform}
            onChange={(e) => set("haftform", e.target.value as DashboardFilters["haftform"])}
          >
            <option value="alle">Alle</option>
            <option value="offen">Offen</option>
            <option value="geschlossen">Geschlossen</option>
          </select>
        </FilterCard>

        <FilterCard label="Altersgruppe">
          <select
            className={selectCls}
            value={filters.altersgruppe}
            onChange={(e) => set("altersgruppe", e.target.value as DashboardFilters["altersgruppe"])}
          >
            <option value="alle">Alle</option>
            <option value="Erwachsenenvollzug">Erwachsenenvollzug</option>
            <option value="Jugendvollzug">Jugendvollzug</option>
          </select>
        </FilterCard>

        <FilterCard label="Haftart">
          <select
            className={selectCls}
            value={filters.haftart}
            onChange={(e) => set("haftart", e.target.value as DashboardFilters["haftart"])}
          >
            <option value="alle">Alle Haftarten</option>
            {HAFTARTEN.map((h) => (
              <option key={h.key} value={h.key}>
                {h.label}
              </option>
            ))}
          </select>
        </FilterCard>
      </FilterRow>

      {/* Ebene 3: Kurs & Beendigung */}
      <FilterRow>
        <FilterCard label="Kurs-Überkategorie">
          <select
            className={selectCls}
            value={filters.courseCategoryKey ?? ""}
            onChange={(e) => set("courseCategoryKey", e.target.value || null)}
          >
            <option value="">Alle</option>
            {courseCategories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </FilterCard>

        <FilterCard label="Kursgrundbezeichnung">
          <select
            className={selectCls}
            value={filters.courseTypeKey ?? ""}
            onChange={(e) => set("courseTypeKey", e.target.value || null)}
          >
            <option value="">Alle</option>
            {filteredCourseTypes.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </FilterCard>

        <FilterCard label="Beendigungsgrund">
          <select
            className={selectCls}
            value={filters.terminationReasonKey ?? ""}
            onChange={(e) => set("terminationReasonKey", e.target.value || null)}
          >
            <option value="">Alle</option>
            {terminationReasons.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </FilterCard>

        <FilterCard label="Abschlussart">
          <select
            className={selectCls}
            value={filters.completionType ?? ""}
            onChange={(e) => set("completionType", e.target.value || null)}
          >
            <option value="">Alle</option>
            {completionTypes.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </FilterCard>
      </FilterRow>
    </section>
  );
}
