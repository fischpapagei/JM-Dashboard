import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { FreeCapacityRow } from "../types/domain";
import { EmptyState } from "./EmptyState";
import { formatValue } from "../utils/format";

interface FreePlacesGroupedDetailModalProps {
  open: boolean;
  title: string;
  rows: FreeCapacityRow[];
  onClose: () => void;
}

interface CourseTypeGroup {
  courseTypeKey: string;
  courseType: string;
  items: FreeCapacityRow[];
  total: number;
}

interface CategoryGroup {
  categoryKey: string;
  categoryLabel: string;
  courseTypes: CourseTypeGroup[];
  total: number;
}

function buildHierarchy(rows: FreeCapacityRow[]): CategoryGroup[] {
  const categoryMap = new Map<string, CategoryGroup>();

  for (const row of rows) {
    let category = categoryMap.get(row.courseCategoryKey);
    if (!category) {
      category = {
        categoryKey: row.courseCategoryKey,
        categoryLabel: row.courseCategory,
        courseTypes: [],
        total: 0,
      };
      categoryMap.set(row.courseCategoryKey, category);
    }

    let courseType = category.courseTypes.find((item) => item.courseTypeKey === row.courseTypeKey);
    if (!courseType) {
      courseType = {
        courseTypeKey: row.courseTypeKey,
        courseType: row.courseType,
        items: [],
        total: 0,
      };
      category.courseTypes.push(courseType);
    }

    courseType.items.push(row);
    courseType.total += row.freePlaces ?? 0;
    category.total += row.freePlaces ?? 0;
  }

  return [...categoryMap.values()]
    .map((category) => ({
      ...category,
      courseTypes: category.courseTypes
        .slice()
        .sort(
          (a, b) =>
            b.total - a.total || a.courseType.localeCompare(b.courseType, "de-DE"),
        ),
    }))
    .sort(
      (a, b) =>
        b.total - a.total || a.categoryLabel.localeCompare(b.categoryLabel, "de-DE"),
    );
}

function AccordionRow({
  label,
  meta,
  total,
  isOpen,
  onToggle,
  level,
  children,
}: {
  label: string;
  meta?: string;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  level: 1 | 2;
  children?: ReactNode;
}) {
  const padding = level === 1 ? "pl-4" : "pl-8";

  return (
    <section className={level === 1 ? "overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm" : ""}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={[
          "flex w-full items-center justify-between gap-3 py-3 pr-4 text-left hover:bg-slate-50/80",
          padding,
          level === 2 ? "border-t border-slate-100 bg-slate-50/30" : "",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <p className={level === 1 ? "text-sm font-semibold text-slate-800" : "text-sm font-medium text-slate-700"}>
            {label}
          </p>
          {meta && <p className="mt-0.5 text-xs text-slate-500">{meta}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold text-[#1a3352]">{formatValue(total)} freie Plätze</span>
          <ChevronDown
            className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </div>
      </button>
      {isOpen && children}
    </section>
  );
}

export function FreePlacesGroupedDetailModal({
  open,
  title,
  rows,
  onClose,
}: FreePlacesGroupedDetailModalProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const hierarchy = useMemo(() => buildHierarchy(rows), [rows]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setExpanded(new Set());
  }, [open]);

  const toggle = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const categoryKey = (key: string) => `cat:${key}`;
  const courseTypeKey = (category: string, type: string) => `type:${category}:${type}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />

      <div className="relative mx-auto mt-16 w-full max-w-4xl rounded-xl bg-white shadow-xl border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#1a3352]">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Kurs-Überkategorie → Kursart → JVA — jeweils aufklappbar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Schließen
          </button>
        </div>

        <div className="px-5 py-4 max-h-[70vh] overflow-auto">
          {rows.length === 0 ? (
            <EmptyState message="Keine freien Plätze für die aktuelle Filterauswahl." />
          ) : (
            <div className="space-y-2">
              {hierarchy.map((category) => {
                const catOpen = expanded.has(categoryKey(category.categoryKey));
                return (
                  <AccordionRow
                    key={category.categoryKey}
                    label={category.categoryLabel}
                    meta={`${category.courseTypes.length} Kursarten`}
                    total={category.total}
                    isOpen={catOpen}
                    onToggle={() => toggle(categoryKey(category.categoryKey))}
                    level={1}
                  >
                    {catOpen &&
                      category.courseTypes.map((course) => {
                        const typeOpen = expanded.has(
                          courseTypeKey(category.categoryKey, course.courseTypeKey),
                        );
                        return (
                          <AccordionRow
                            key={course.courseTypeKey}
                            label={course.courseType}
                            meta={`${course.items.length} ${course.items.length === 1 ? "JVA" : "JVAen"}`}
                            total={course.total}
                            isOpen={typeOpen}
                            onToggle={() =>
                              toggle(courseTypeKey(category.categoryKey, course.courseTypeKey))
                            }
                            level={2}
                          >
                            {typeOpen && (
                              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 pl-12">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                                      <th className="py-2 pr-3">JVA</th>
                                      <th className="py-2 text-right">Freie Plätze</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {course.items
                                      .slice()
                                      .sort((a, b) => a.jvaName.localeCompare(b.jvaName, "de-DE"))
                                      .map((row) => (
                                        <tr
                                          key={`${row.jvaId}-${row.courseTypeKey}`}
                                          className="border-b border-slate-100 last:border-0"
                                        >
                                          <td className="py-2 pr-3 font-medium text-slate-700">
                                            {row.jvaName}
                                          </td>
                                          <td className="py-2 text-right">
                                            {formatValue(row.freePlaces)}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </AccordionRow>
                        );
                      })}
                  </AccordionRow>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
