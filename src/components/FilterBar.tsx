import { ChevronDown, Filter, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import {
  completionTypes,
  courseCategories,
  courseTypes,
  getTerminationReasonsByLevel,
  HAFTARTEN,
  TERMINATION_LEVEL_OPTIONS,
  terminationReasons,
} from "../data/catalog";
import { jvas } from "../data/jvas";
import type { DashboardFilters, TerminationReason } from "../types/domain";
import type { UserRole } from "../types/auth";
import { KernButton } from "../ui/kern";
import { formatJvaFilterSummary, resetDashboardFilters } from "../utils/filters";
import {
  getReportingPeriodSelectOptions,
  isReportingPeriodCompatible,
} from "../utils/periods";

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  role?: UserRole;
  showJvaFilter?: boolean;
  variant?: "default" | "free-places";
}

function FilterCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="kern-form-input min-w-0 flex-1 basis-[9.75rem] sm:basis-[10.5rem]">
      <label className="kern-label">{label}</label>
      {children}
    </div>
  );
}

function FilterSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <div className="kern-form-input__select-wrapper">
      <select className={["kern-form-input__select", className].filter(Boolean).join(" ")} {...rest} />
    </div>
  );
}

function FilterRow({
  children,
  layout = "flex",
}: {
  children: ReactNode;
  layout?: "flex" | "grid";
}) {
  if (layout === "grid") {
    return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{children}</div>;
  }
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

const selectTriggerClass =
  "kern-form-input__select flex w-full items-center justify-between gap-2 text-left";

function JvaMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (jvaIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const allSelected = value.length === 0;
  const displayLabel = formatJvaFilterSummary(value);

  const toggleJva = (id: string) => {
    if (allSelected) {
      onChange([id]);
      return;
    }
    if (value.includes(id)) {
      const next = value.filter((item) => item !== id);
      onChange(next);
      return;
    }
    onChange([...value, id]);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <div className="kern-form-input__select-wrapper">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={selectTriggerClass}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-(--color-ink) transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded border-2 border-(--color-border) bg-white p-2 text-sm text-(--color-ink) shadow-lg"
        >
          <label className="kern-form-check mb-1">
            <input
              type="checkbox"
              className="kern-form-check__checkbox"
              checked={allSelected}
              onChange={() => onChange([])}
            />
            <span className="kern-label">Alle</span>
          </label>
          {jvas.map((jva) => (
            <label key={jva.id} className="kern-form-check mb-1">
              <input
                type="checkbox"
                className="kern-form-check__checkbox"
                checked={!allSelected && value.includes(jva.id)}
                onChange={() => toggleJva(jva.id)}
              />
              <span className="kern-label leading-snug">{jva.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function TerminationReasonInfoTooltip({
  description,
}: {
  description: string | string[];
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const tooltipWidth = 320;
    const margin = 12;
    const estimatedHeight = Array.isArray(description) ? description.length * 56 + 40 : 96;
    const preferredLeft = rect.right + margin;
    const left = Math.max(
      margin,
      Math.min(
        preferredLeft + tooltipWidth > window.innerWidth - margin
          ? rect.left - tooltipWidth - margin
          : preferredLeft,
        window.innerWidth - tooltipWidth - margin,
      ),
    );
    const centeredTop = rect.top + rect.height / 2 - estimatedHeight / 2;
    const top = Math.max(
      margin,
      Math.min(centeredTop, window.innerHeight - estimatedHeight - margin),
    );

    setPosition({ top, left });
  };

  const handleOpen = () => {
    clearCloseTimeout();
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimeout(), []);

  const tooltip = open ? (
    <div
      role="tooltip"
      style={{ top: position.top, left: position.left }}
      className="fixed z-[100] w-80 max-w-[calc(100vw-1.5rem)] rounded border-2 border-(--color-border) bg-white p-3 text-sm leading-relaxed text-(--color-ink) shadow-xl"
      onMouseEnter={handleOpen}
      onMouseLeave={scheduleClose}
    >
      {Array.isArray(description) ? (
        <ul className="list-disc space-y-1.5 pl-4">
          {description.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p>{description}</p>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        tabIndex={-1}
        aria-label="Erklärung anzeigen"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-(--color-border) bg-white text-(--color-accent) hover:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onMouseEnter={handleOpen}
        onMouseLeave={scheduleClose}
      >
        <Info className="h-3 w-3" aria-hidden />
      </button>
      {tooltip && createPortal(tooltip, document.body)}
    </>
  );
}

function TerminationReasonSelect({
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
}: {
  value: string | null;
  options: TerminationReason[];
  placeholder: string;
  disabled?: boolean;
  onChange: (reasonKey: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((reason) => reason.key === value);
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <div className="kern-form-input__select-wrapper">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={`${selectTriggerClass} disabled:cursor-not-allowed`}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-(--color-ink) transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 z-20 mt-1 max-h-60 w-max min-w-full max-w-sm overflow-y-auto overflow-x-visible rounded border-2 border-(--color-border) bg-white p-2 text-sm text-(--color-ink) shadow-lg"
        >
          <div
            role="option"
            aria-selected={!value}
            tabIndex={0}
            className={`flex w-full cursor-pointer items-center rounded px-2 py-1.5 hover:bg-[#dceae6] ${
              !value ? "bg-[#dceae6] font-semibold" : ""
            }`}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChange(null);
                setOpen(false);
              }
            }}
          >
            Alle
          </div>
          {options.map((reason) => (
            <div
              key={reason.key}
              role="option"
              aria-selected={value === reason.key}
              tabIndex={0}
              className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-[#dceae6] ${
                value === reason.key ? "bg-[#dceae6] font-semibold" : ""
              }`}
              onClick={() => {
                onChange(reason.key);
                setOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(reason.key);
                  setOpen(false);
                }
              }}
            >
              <span className="min-w-0 flex-1 leading-snug">{reason.label}</span>
              {reason.filterDescription && (
                <TerminationReasonInfoTooltip description={reason.filterDescription} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  filters,
  onChange,
  role,
  showJvaFilter = true,
  variant = "default",
}: FilterBarProps) {
  const hideJva = role === "jva" || !showJvaFilter;
  const isFreePlaces = variant === "free-places";

  const set = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    const next = { ...filters, [key]: value };
    if (key === "courseCategoryKey" && value !== filters.courseCategoryKey) {
      next.courseTypeKey = null;
    }
    if (key === "terminationLevel1") {
      next.terminationReasonKey = null;
    }
    if (key === "terminationReasonKey" && value) {
      const reason = terminationReasons.find((item) => item.key === value);
      if (reason) {
        next.terminationLevel1 = reason.level1;
      }
    }
    if (key === "jvaIds") {
      next.organizationLevel = (value as string[]).length > 0 ? "jva" : "nrw";
    }
    if (key === "timeGranularity" && !isReportingPeriodCompatible(filters.reportingPeriod, value as DashboardFilters["timeGranularity"])) {
      next.reportingPeriod = null;
    }
    onChange(next);
  };

  const filteredCourseTypes = useMemo(() => {
    if (!filters.courseCategoryKey) return courseTypes;
    return courseTypes.filter((c) => c.categoryKey === filters.courseCategoryKey);
  }, [filters.courseCategoryKey]);

  const groupedCourseTypes = useMemo(
    () =>
      courseCategories
        .map((category) => ({
          category,
          types: filteredCourseTypes.filter((type) => type.categoryKey === category.key),
        }))
        .filter((group) => group.types.length > 0),
    [filteredCourseTypes],
  );

  const filteredTerminationReasons = useMemo(
    () =>
      filters.terminationLevel1
        ? getTerminationReasonsByLevel(filters.terminationLevel1)
        : [],
    [filters.terminationLevel1],
  );

  const terminationReasonPlaceholder = !filters.terminationLevel1
    ? "Bitte zuerst Art wählen"
    : "Alle";

  const reportingPeriodOptions = useMemo(() => getReportingPeriodSelectOptions(), []);

  const reportingPeriodPlaceholder = !filters.timeGranularity
    ? "Bitte zuerst Zeitraum wählen"
    : "Nicht ausgewählt";

  const handleReset = () => {
    onChange(
      resetDashboardFilters({
        role,
        lockJvaIds: role === "jva" ? filters.jvaIds : undefined,
      }),
    );
  };

  return (
    <section className="kern-card kern-card--hug dashboard-panel">
      <div className="kern-card__container w-full space-y-4">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 text-(--color-ink)">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" aria-hidden />
          <h2 className="kern-heading-small">Auswertungsfilter</h2>
        </div>
        <KernButton type="button" variant="secondary" label="Filter zurücksetzen" onClick={handleReset} />
      </div>

      {/* Ebene 1: Zeit & Organisation */}
      {!isFreePlaces && (
        <FilterRow>
          <FilterCard label="Zeitraum">
          <FilterSelect
            value={filters.timeGranularity ?? ""}
            onChange={(e) => set("timeGranularity", (e.target.value || null) as DashboardFilters["timeGranularity"])}
          >
            <option value="">Nicht ausgewählt</option>
            <option value="month">Monat</option>
            <option value="quarter">Quartal</option>
            <option value="year">Jahr</option>
          </FilterSelect>
        </FilterCard>

        <FilterCard label="Berichtszeitraum">
          <FilterSelect
            value={filters.reportingPeriod ?? ""}
            disabled={!filters.timeGranularity}
            onChange={(e) => set("reportingPeriod", e.target.value || null)}
          >
            <option value="">{reportingPeriodPlaceholder}</option>
            {filters.timeGranularity === "quarter" &&
              reportingPeriodOptions.quarters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            {filters.timeGranularity === "year" &&
              reportingPeriodOptions.years.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            {filters.timeGranularity === "month" &&
              reportingPeriodOptions.monthsByYear.map(({ year, months }) => (
                <optgroup key={year} label={`Monate ${year}`}>
                  {months.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
          </FilterSelect>
        </FilterCard>

        {!hideJva && (
          <FilterCard label="JVA">
            <JvaMultiSelect value={filters.jvaIds} onChange={(jvaIds) => set("jvaIds", jvaIds)} />
          </FilterCard>
        )}
      </FilterRow>
      )}

      {/* Ebene 2: Personenmerkmale */}
      <FilterRow>
        <FilterCard label="Geschlecht">
          <FilterSelect
            value={filters.geschlecht}
            onChange={(e) => set("geschlecht", e.target.value as DashboardFilters["geschlecht"])}
          >
            <option value="alle">Alle</option>
            <option value="männlich">Männlich</option>
            <option value="weiblich">Weiblich</option>
          </FilterSelect>
        </FilterCard>

        <FilterCard label="Haftform">
          <FilterSelect
            value={filters.haftform}
            onChange={(e) => set("haftform", e.target.value as DashboardFilters["haftform"])}
          >
            <option value="alle">Alle</option>
            <option value="offen">Offen</option>
            <option value="geschlossen">Geschlossen</option>
          </FilterSelect>
        </FilterCard>

        <FilterCard label="Altersgruppe">
          <FilterSelect
            value={filters.altersgruppe}
            onChange={(e) => set("altersgruppe", e.target.value as DashboardFilters["altersgruppe"])}
          >
            <option value="alle">Alle</option>
            <option value="Erwachsenenvollzug">Erwachsenenvollzug</option>
            <option value="Jugendvollzug">Jugendvollzug</option>
          </FilterSelect>
        </FilterCard>

        {!isFreePlaces && (
          <FilterCard label="Haftart">
            <FilterSelect
              value={filters.haftart}
              onChange={(e) => set("haftart", e.target.value as DashboardFilters["haftart"])}
            >
              <option value="alle">Alle Haftarten</option>
              {HAFTARTEN.map((h) => (
                <option key={h.key} value={h.key}>
                  {h.label}
                </option>
              ))}
            </FilterSelect>
          </FilterCard>
        )}
      </FilterRow>

      {/* Ebene 3: Kurs & Beendigung */}
      <FilterRow layout="grid">
        <FilterCard label="Hauptkategorie">
          <FilterSelect
            value={filters.courseCategoryKey ?? ""}
            onChange={(e) => set("courseCategoryKey", e.target.value || null)}
          >
            <option value="">Alle</option>
            {courseCategories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </FilterSelect>
        </FilterCard>

        <FilterCard label="Maßnahmenkategorie">
          <FilterSelect
            value={filters.courseTypeKey ?? ""}
            onChange={(e) => set("courseTypeKey", e.target.value || null)}
          >
            <option value="">Alle</option>
            {groupedCourseTypes.map(({ category, types }) => (
              <optgroup key={category.key} label={category.label}>
                {types.map((courseType) => (
                  <option key={courseType.key} value={courseType.key}>
                    {courseType.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </FilterSelect>
        </FilterCard>

        {!isFreePlaces && (
          <>
            <FilterCard label="Beendigungsart">
              <FilterSelect
                value={filters.terminationLevel1 ?? ""}
                onChange={(e) =>
                  set(
                    "terminationLevel1",
                    (e.target.value || null) as DashboardFilters["terminationLevel1"],
                  )
                }
              >
                <option value="">Alle</option>
                {TERMINATION_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FilterSelect>
            </FilterCard>

            <FilterCard label="Beendigungsgrund">
              <TerminationReasonSelect
                value={filters.terminationReasonKey}
                options={filteredTerminationReasons}
                placeholder={terminationReasonPlaceholder}
                disabled={!filters.terminationLevel1}
                onChange={(reasonKey) => set("terminationReasonKey", reasonKey)}
              />
            </FilterCard>

            <FilterCard label="Abschlussart">
              <FilterSelect
                value={filters.completionType ?? ""}
                onChange={(e) => set("completionType", e.target.value || null)}
              >
                <option value="">Alle</option>
                {completionTypes.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </FilterSelect>
            </FilterCard>
          </>
        )}
      </FilterRow>
      </div>
    </section>
  );
}
