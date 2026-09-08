import { courseCategories, courseTypes } from '../data/catalog';
import { AREA_COURSE_CATEGORY_KEYS, type AreaWithFreiePlaetze } from '../data/dashboardAreas';
import type { DashboardFilters, FreeCapacityRow } from '../types/domain';

export interface FreePlacesPivotColumn {
  courseCategoryKey: string;
  courseCategory: string;
  courseTypeKey: string;
  courseType: string;
}

export function buildFreePlacesPivotColumns(areaKey: AreaWithFreiePlaetze): FreePlacesPivotColumn[] {
  const categoryKeys = AREA_COURSE_CATEGORY_KEYS[areaKey];

  return courseTypes
    .filter((courseType) => categoryKeys.includes(courseType.categoryKey))
    .map((courseType) => ({
      courseCategoryKey: courseType.categoryKey,
      courseCategory:
        courseCategories.find((category) => category.key === courseType.categoryKey)?.label ??
        courseType.categoryKey,
      courseTypeKey: courseType.key,
      courseType: courseType.shortLabel ?? courseType.label,
    }));
}

export function resolveFreePlacesExportColumns(
  areaKey: AreaWithFreiePlaetze,
  filters: DashboardFilters,
): FreePlacesPivotColumn[] {
  let columns = buildFreePlacesPivotColumns(areaKey);

  if (filters.courseTypeKey) {
    columns = columns.filter((column) => column.courseTypeKey === filters.courseTypeKey);
  } else if (filters.courseCategoryKey) {
    columns = columns.filter((column) => column.courseCategoryKey === filters.courseCategoryKey);
  }

  return columns;
}

export function buildFreePlacesPivotValues(
  rows: FreeCapacityRow[],
): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();

  for (const row of rows) {
    if (row.freePlaces == null) continue;

    if (!matrix.has(row.jvaId)) {
      matrix.set(row.jvaId, new Map());
    }

    const jvaValues = matrix.get(row.jvaId)!;
    jvaValues.set(row.courseTypeKey, (jvaValues.get(row.courseTypeKey) ?? 0) + row.freePlaces);
  }

  return matrix;
}
