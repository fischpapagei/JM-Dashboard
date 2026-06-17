import { useMemo } from 'react';
import type { DashboardFilters } from '../types/domain';
import { demoOperational, demoRecords, demoSchoolRooms } from '../data/demoData';
import { emptyNrwKpis } from '../data/emptyData';
import {
  applyDashboardScope,
  buildCategoryChart,
  buildFreeCapacityRows,
  buildJvaComparisonChart,
  buildJvaCourseRows,
  buildJvaCourseUtilizationChart,
  buildJvaOperationalRows,
  buildJvaSchoolRoomSummaries,
  buildJvaTableRows,
  buildTerminationChart,
  buildUtilizationTrend,
  computeAverageKpisAcrossJvas,
  computeKpis,
  computePreviousPeriodKpis,
  type CategoryChartDatum,
  type SchulischeBildungKpis,
} from '../utils/aggregations';

const EMPTY_KPIS: SchulischeBildungKpis = emptyNrwKpis;

export function useDashboardData(
  filters: DashboardFilters,
  demoMode: boolean,
  forcedJvaId?: string,
) {
  return useMemo(() => {
    if (!demoMode) {
      return {
        kpis: EMPTY_KPIS,
        previousKpis: EMPTY_KPIS,
        previousPeriodLabel: null as string | null,
        nrwKpis: EMPTY_KPIS,
        nrwAverageKpis: EMPTY_KPIS,
        categoryChart: [] as CategoryChartDatum[],
        terminationChart: [] as { name: string; value: number }[],
        jvaComparisonChart: [] as { name: string; value: number }[],
        utilizationTrend: [] as { name: string; value: number; key: string }[],
        trendRecords: [] as typeof demoRecords,
        jvaTableRows: [],
        jvaOperationalRows: [],
        schoolRoomSummaries: [],
        freeCapacityRows: [],
        courseRows: [],
        courseUtilizationChart: [],
        scopedRecords: [] as typeof demoRecords,
        hasData: false,
      };
    }

    const scopedRecords = applyDashboardScope(demoRecords, filters, forcedJvaId);
    const kpis = computeKpis(demoRecords, demoOperational, filters, forcedJvaId);
    const { kpis: previousKpis, label: previousPeriodLabel } = computePreviousPeriodKpis(
      demoRecords,
      demoOperational,
      filters,
      forcedJvaId,
    );
    const nrwKpis = computeKpis(demoRecords, demoOperational, {
      ...filters,
      jvaId: null,
      organizationLevel: 'nrw',
    });
    const nrwAverageKpis = computeAverageKpisAcrossJvas(demoRecords, demoOperational, filters);

    const courseRows = forcedJvaId
      ? buildJvaCourseRows(demoRecords, forcedJvaId, filters)
      : [];

    return {
      kpis,
      previousKpis,
      previousPeriodLabel,
      nrwKpis,
      nrwAverageKpis,
      categoryChart: buildCategoryChart(scopedRecords),
      terminationChart: buildTerminationChart(scopedRecords),
      jvaComparisonChart: buildJvaComparisonChart(
        applyDashboardScope(demoRecords, { ...filters, jvaId: null }),
      ),
      utilizationTrend: buildUtilizationTrend(demoRecords, filters, forcedJvaId, 'month'),
      trendRecords: demoRecords,
      jvaTableRows: buildJvaTableRows(demoRecords, filters),
      jvaOperationalRows: buildJvaOperationalRows(demoOperational, filters),
      schoolRoomSummaries: buildJvaSchoolRoomSummaries(demoSchoolRooms, filters, forcedJvaId),
      freeCapacityRows: buildFreeCapacityRows(scopedRecords),
      courseRows,
      courseUtilizationChart: buildJvaCourseUtilizationChart(courseRows),
      scopedRecords,
      hasData: scopedRecords.length > 0,
    };
  }, [filters, demoMode, forcedJvaId]);
}
