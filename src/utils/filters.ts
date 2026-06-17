import type { DashboardFilters, EducationMeasureRecord } from '../types/domain';
import type { UserRole } from '../types/auth';
import { resolveToDataPeriods } from './periods';

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  timeGranularity: 'quarter',
  reportingPeriod: null,
  organizationLevel: 'nrw',
  jvaId: null,
  geschlecht: 'alle',
  haftform: 'alle',
  altersgruppe: 'alle',
  haftart: 'alle',
  courseCategoryKey: null,
  courseTypeKey: null,
  terminationReasonKey: null,
  completionType: null,
};

function matchesDimension(
  recordValue: string | undefined,
  filterValue: string,
): boolean {
  if (filterValue === 'alle') {
    return true;
  }
  if (!recordValue) {
    return true;
  }
  return recordValue === filterValue;
}

export function recordMatchesFilters(
  record: EducationMeasureRecord,
  filters: DashboardFilters,
): boolean {
  if (filters.reportingPeriod) {
    const periods = resolveToDataPeriods(filters.reportingPeriod);
    if (!periods.includes(record.reportingPeriod)) {
      return false;
    }
  }
  if (filters.organizationLevel === 'jva' && filters.jvaId && record.jvaId !== filters.jvaId) {
    return false;
  }
  if (filters.jvaId && record.jvaId !== filters.jvaId) {
    return false;
  }
  if (filters.courseCategoryKey && record.courseCategoryKey !== filters.courseCategoryKey) {
    return false;
  }
  if (filters.courseTypeKey && record.courseTypeKey !== filters.courseTypeKey) {
    return false;
  }
  if (
    filters.terminationReasonKey &&
    record.terminationReasonKey !== filters.terminationReasonKey
  ) {
    return false;
  }
  if (filters.completionType && record.completionType !== filters.completionType) {
    return false;
  }
  if (!matchesDimension(record.geschlecht, filters.geschlecht)) {
    return false;
  }
  if (!matchesDimension(record.haftform, filters.haftform)) {
    return false;
  }
  if (!matchesDimension(record.altersgruppe, filters.altersgruppe)) {
    return false;
  }
  if (!matchesDimension(record.haftart, filters.haftart)) {
    return false;
  }
  return true;
}

export function filterEducationRecords(
  records: EducationMeasureRecord[],
  filters: DashboardFilters,
): EducationMeasureRecord[] {
  return records.filter((record) => recordMatchesFilters(record, filters));
}

export function withOrganizationLevel(
  filters: DashboardFilters,
  level: DashboardFilters['organizationLevel'],
  jvaId: string | null = null,
): DashboardFilters {
  return {
    ...filters,
    organizationLevel: level,
    jvaId: level === 'jva' ? jvaId : null,
  };
}

export function resetDashboardFilters(options?: {
  role?: UserRole;
  lockJvaId?: string | null;
}): DashboardFilters {
  const base = { ...DEFAULT_DASHBOARD_FILTERS };
  if (options?.role === 'jva' && options.lockJvaId) {
    return withOrganizationLevel(base, 'jva', options.lockJvaId);
  }
  return base;
}
