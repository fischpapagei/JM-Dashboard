import type { DashboardFilters, EducationMeasureRecord } from '../types/domain';
import type { UserRole } from '../types/auth';
import { TERMINATION_REASON_BY_KEY } from '../data/catalog';
import { getJvaById } from '../data/jvas';
import { resolveToDataPeriods } from './periods';

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  timeGranularity: 'quarter',
  reportingPeriod: null,
  organizationLevel: 'nrw',
  jvaIds: [],
  geschlecht: 'alle',
  haftform: 'alle',
  altersgruppe: 'alle',
  haftart: 'alle',
  courseCategoryKey: null,
  courseTypeKey: null,
  terminationLevel1: null,
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

export function getActiveFilterJvaIds(
  filters: DashboardFilters,
  forcedJvaId?: string,
): string[] | null {
  if (forcedJvaId) return [forcedJvaId];
  if (filters.jvaIds.length > 0) return filters.jvaIds;
  return null;
}

export function formatJvaFilterSummary(jvaIds: string[]): string {
  if (jvaIds.length === 0) return 'Alle';
  const names = jvaIds.map((id) => getJvaById(id)?.name ?? id);
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} weitere`;
}

export function recordMatchesFilters(
  record: EducationMeasureRecord,
  filters: DashboardFilters,
  forcedJvaId?: string,
): boolean {
  if (filters.reportingPeriod) {
    const periods = resolveToDataPeriods(filters.reportingPeriod);
    if (!periods.includes(record.reportingPeriod)) {
      return false;
    }
  }

  const activeJvaIds = getActiveFilterJvaIds(filters, forcedJvaId);
  if (activeJvaIds && !activeJvaIds.includes(record.jvaId)) {
    return false;
  }

  if (filters.courseCategoryKey && record.courseCategoryKey !== filters.courseCategoryKey) {
    return false;
  }
  if (filters.courseTypeKey && record.courseTypeKey !== filters.courseTypeKey) {
    return false;
  }
  if (filters.terminationReasonKey) {
    if (record.terminationReasonKey !== filters.terminationReasonKey) {
      return false;
    }
  } else if (filters.terminationLevel1) {
    const recordReason = record.terminationReasonKey
      ? TERMINATION_REASON_BY_KEY[record.terminationReasonKey]
      : null;
    if (!recordReason || recordReason.level1 !== filters.terminationLevel1) {
      return false;
    }
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
  forcedJvaId?: string,
): EducationMeasureRecord[] {
  return records.filter((record) => recordMatchesFilters(record, filters, forcedJvaId));
}

export function withOrganizationLevel(
  filters: DashboardFilters,
  level: DashboardFilters['organizationLevel'],
  jvaIds: string[] = [],
): DashboardFilters {
  return {
    ...filters,
    organizationLevel: level,
    jvaIds: level === 'jva' ? jvaIds : [],
  };
}

export function resetDashboardFilters(options?: {
  role?: UserRole;
  lockJvaIds?: string[];
}): DashboardFilters {
  const base = { ...DEFAULT_DASHBOARD_FILTERS };
  if (options?.role === 'jva' && options.lockJvaIds && options.lockJvaIds.length > 0) {
    return withOrganizationLevel(base, 'jva', options.lockJvaIds);
  }
  return base;
}
