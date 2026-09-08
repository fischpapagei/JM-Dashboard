import {
  courseCategories,
  courseTypes,
  terminationReasons,
  COMPLETION_TYPES,
  COURSE_TYPE_BY_KEY,
  TERMINATION_REASON_BY_KEY,
  getHaftartLabel,
} from '../data/catalog';
import type {
  DashboardFilters,
  EducationMeasureRecord,
  FreeCapacityRow,
  JvaSchoolRoomSummary,
  JvaTableRow,
  Kursleitung,
  Massnahmenbeginn,
  SchoolCompletionTypeRow,
  SchoolRoom,
} from '../types/domain';
import { JVAS, getJvaById } from '../data/jvas';
import {
  calculateFreePlaces,
  calculateTerminationRate,
  calculateUtilization,
  calculateUtilizationLastMonth,
  sumNullable,
} from './calculations';
import { filterEducationRecords, getActiveFilterJvaIds } from './filters';
import {
  formatZielgruppeAltersgruppe,
  formatZielgruppeGeschlecht,
} from './format';
import {
  getPreviousPeriodLabel,
  getPreviousPeriodsForComparison,
  getTrendTimeline,
  LATEST_PERIOD,
  resolveToDataPeriods,
  type TrendGranularity,
  type TrendTimelineSlot,
} from './periods';

export interface SchulischeBildungKpis {
  beschaeftigungsquote: number | null;
  bruttobelegung: number | null;
  schulischeBildung: number | null;
  auslastung: number | null;
  teilnehmende: number | null;
  sollPlaetze: number | null;
  freiePlaetze: number | null;
  regulaereBeendigungen: number | null;
  vorzeitigeBeendigungen: number | null;
  anteilRegulaereBeendigung: number | null;
  anteilVorzeitigeBeendigung: number | null;
  abbruchquote: number | null;
  abschluesse: number | null;
  zielerreichungen: number | null;
  paedStellen: number | null;
  paedBesetzt: number | null;
  paedExtern: number | null;
  elisLernplaetze: number | null;
  elisMandantschaften: number | null;
  elisDigitaleSozialraeume: number | null;
  elisHaftraeume: number | null;
  schulraeume: number | null;
  elisSchulraeume: number | null;
}

export interface JvaOperationalRecord {
  jvaId: string;
  reportingPeriod: string;
  totalInmates: number;
  employedTotal: number;
  belegbareHaftplaetze: number;
  paedStellen: number;
  paedBesetzt: number;
  paedExtern: number;
  elisLernplaetze: number;
  elisMandantschaften: number;
  elisDigitaleSozialraeume: number;
  elisHaftraeume: number;
  schulraeume: number;
  elisSchulraeume: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function computeTerminationShares(
  regulaereBeendigungen: number | null,
  vorzeitigeBeendigungen: number | null,
): {
  anteilRegulaereBeendigung: number | null;
  anteilVorzeitigeBeendigung: number | null;
} {
  if (regulaereBeendigungen == null || vorzeitigeBeendigungen == null) {
    return { anteilRegulaereBeendigung: null, anteilVorzeitigeBeendigung: null };
  }
  const total = regulaereBeendigungen + vorzeitigeBeendigungen;
  if (total <= 0) {
    return { anteilRegulaereBeendigung: null, anteilVorzeitigeBeendigung: null };
  }
  return {
    anteilVorzeitigeBeendigung: round1((vorzeitigeBeendigungen / total) * 100),
    anteilRegulaereBeendigung: round1((regulaereBeendigungen / total) * 100),
  };
}

export function applyDashboardScope(
  records: EducationMeasureRecord[],
  filters: DashboardFilters,
  forcedJvaId?: string,
): EducationMeasureRecord[] {
  let filtered = filterEducationRecords(records, filters, forcedJvaId);

  const dataPeriods = resolveToDataPeriods(filters.reportingPeriod);
  filtered = filtered.filter((r) => dataPeriods.includes(r.reportingPeriod));

  return filtered;
}

function filterOperational(
  operational: JvaOperationalRecord[],
  filters: DashboardFilters,
  forcedJvaId?: string,
): JvaOperationalRecord[] {
  const activeJvaIds = getActiveFilterJvaIds(filters, forcedJvaId);
  let rows = operational;
  if (activeJvaIds) {
    rows = rows.filter((r) => activeJvaIds.includes(r.jvaId));
  }
  const dataPeriods = resolveToDataPeriods(filters.reportingPeriod);
  rows = rows.filter((r) => dataPeriods.includes(r.reportingPeriod));
  return rows;
}

function averageKpis(kpisList: SchulischeBildungKpis[]): SchulischeBildungKpis {
  if (kpisList.length === 0) {
    return {
      beschaeftigungsquote: null,
      bruttobelegung: null,
      schulischeBildung: null,
      auslastung: null,
      teilnehmende: null,
      sollPlaetze: null,
      freiePlaetze: null,
      regulaereBeendigungen: null,
      vorzeitigeBeendigungen: null,
      anteilRegulaereBeendigung: null,
      anteilVorzeitigeBeendigung: null,
      abbruchquote: null,
      abschluesse: null,
      zielerreichungen: null,
      paedStellen: null,
      paedBesetzt: null,
      paedExtern: null,
      elisLernplaetze: null,
      elisMandantschaften: null,
      elisDigitaleSozialraeume: null,
      elisHaftraeume: null,
      schulraeume: null,
      elisSchulraeume: null,
    };
  }

  const avg = (values: (number | null)[]) => {
    const nums = values.filter((v): v is number => v != null);
    return nums.length > 0 ? round1(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  };

  return {
    beschaeftigungsquote: avg(kpisList.map((k) => k.beschaeftigungsquote)),
    bruttobelegung: avg(kpisList.map((k) => k.bruttobelegung)),
    schulischeBildung: avg(kpisList.map((k) => k.schulischeBildung)),
    auslastung: avg(kpisList.map((k) => k.auslastung)),
    teilnehmende: avg(kpisList.map((k) => k.teilnehmende)),
    sollPlaetze: avg(kpisList.map((k) => k.sollPlaetze)),
    freiePlaetze: avg(kpisList.map((k) => k.freiePlaetze)),
    regulaereBeendigungen: avg(kpisList.map((k) => k.regulaereBeendigungen)),
    vorzeitigeBeendigungen: avg(kpisList.map((k) => k.vorzeitigeBeendigungen)),
    anteilRegulaereBeendigung: avg(kpisList.map((k) => k.anteilRegulaereBeendigung)),
    anteilVorzeitigeBeendigung: avg(kpisList.map((k) => k.anteilVorzeitigeBeendigung)),
    abbruchquote: avg(kpisList.map((k) => k.abbruchquote)),
    abschluesse: avg(kpisList.map((k) => k.abschluesse)),
    zielerreichungen: avg(kpisList.map((k) => k.zielerreichungen)),
    paedStellen: avg(kpisList.map((k) => k.paedStellen)),
    paedBesetzt: avg(kpisList.map((k) => k.paedBesetzt)),
    paedExtern: avg(kpisList.map((k) => k.paedExtern)),
    elisLernplaetze: avg(kpisList.map((k) => k.elisLernplaetze)),
    elisMandantschaften: avg(kpisList.map((k) => k.elisMandantschaften)),
    elisDigitaleSozialraeume: avg(kpisList.map((k) => k.elisDigitaleSozialraeume)),
    elisHaftraeume: avg(kpisList.map((k) => k.elisHaftraeume)),
    schulraeume: avg(kpisList.map((k) => k.schulraeume)),
    elisSchulraeume: avg(kpisList.map((k) => k.elisSchulraeume)),
  };
}

function mergeMultiPeriodKpis(kpisList: SchulischeBildungKpis[]): SchulischeBildungKpis {
  if (kpisList.length === 0) return averageKpis([]);
  if (kpisList.length === 1) return kpisList[0];

  const sum = (values: (number | null)[]) => {
    const nums = values.filter((v): v is number => v != null);
    return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
  };

  const teilnehmende = sum(kpisList.map((k) => k.teilnehmende));
  const sollPlaetze = sum(kpisList.map((k) => k.sollPlaetze));
  const abschluesse = sum(kpisList.map((k) => k.abschluesse));
  const zielerreichungen = sum(kpisList.map((k) => k.zielerreichungen));
  const vorzeitigeBeendigungen = sum(kpisList.map((k) => k.vorzeitigeBeendigungen));
  const regulaereBeendigungen = sum(kpisList.map((k) => k.regulaereBeendigungen));
  const terminationShares = computeTerminationShares(regulaereBeendigungen, vorzeitigeBeendigungen);
  const paedStellen = sum(kpisList.map((k) => k.paedStellen));
  const paedBesetzt = sum(kpisList.map((k) => k.paedBesetzt));
  const paedExtern = sum(kpisList.map((k) => k.paedExtern));
  const elisLernplaetze = sum(kpisList.map((k) => k.elisLernplaetze));
  const elisMandantschaften = sum(kpisList.map((k) => k.elisMandantschaften));
  const elisDigitaleSozialraeume = sum(kpisList.map((k) => k.elisDigitaleSozialraeume));
  const elisHaftraeume = sum(kpisList.map((k) => k.elisHaftraeume));
  const schulraeume = sum(kpisList.map((k) => k.schulraeume));
  const elisSchulraeume = sum(kpisList.map((k) => k.elisSchulraeume));

  const auslastungRaw = calculateUtilization(teilnehmende, sollPlaetze);
  const abbruchquoteRaw = calculateTerminationRate(vorzeitigeBeendigungen, teilnehmende);

  const avg = (values: (number | null)[]) => {
    const nums = values.filter((v): v is number => v != null);
    return nums.length > 0 ? round1(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  };

  return {
    beschaeftigungsquote: avg(kpisList.map((k) => k.beschaeftigungsquote)),
    bruttobelegung: avg(kpisList.map((k) => k.bruttobelegung)),
    schulischeBildung: avg(kpisList.map((k) => k.schulischeBildung)),
    auslastung: auslastungRaw != null ? round1(auslastungRaw) : null,
    teilnehmende,
    sollPlaetze,
    freiePlaetze: calculateFreePlaces(sollPlaetze, teilnehmende),
    regulaereBeendigungen,
    vorzeitigeBeendigungen,
    anteilRegulaereBeendigung: terminationShares.anteilRegulaereBeendigung,
    anteilVorzeitigeBeendigung: terminationShares.anteilVorzeitigeBeendigung,
    abbruchquote: abbruchquoteRaw != null ? round1(abbruchquoteRaw) : null,
    abschluesse,
    zielerreichungen,
    paedStellen,
    paedBesetzt,
    paedExtern,
    elisLernplaetze,
    elisMandantschaften,
    elisDigitaleSozialraeume,
    elisHaftraeume,
    schulraeume,
    elisSchulraeume,
  };
}

export function computeKpisForPeriods(
  records: EducationMeasureRecord[],
  operational: JvaOperationalRecord[],
  filters: DashboardFilters,
  periods: string[],
  forcedJvaId?: string,
): SchulischeBildungKpis {
  if (periods.length === 0) return averageKpis([]);
  const perPeriod = periods.map((period) =>
    computeKpis(records, operational, { ...filters, reportingPeriod: period }, forcedJvaId),
  );
  if (periods.length === 1) return perPeriod[0];
  return mergeMultiPeriodKpis(perPeriod);
}

export function computePreviousPeriodKpis(
  records: EducationMeasureRecord[],
  operational: JvaOperationalRecord[],
  filters: DashboardFilters,
  forcedJvaId?: string,
): { kpis: SchulischeBildungKpis; label: string | null } {
  const periods = getPreviousPeriodsForComparison(
    filters.reportingPeriod,
    filters.timeGranularity,
  );
  if (!periods || !filters.timeGranularity) {
    return { kpis: averageKpis([]), label: null };
  }
  return {
    kpis: computeKpisForPeriods(records, operational, filters, periods, forcedJvaId),
    label: getPreviousPeriodLabel(filters.timeGranularity),
  };
}

export function computeKpis(
  records: EducationMeasureRecord[],
  operational: JvaOperationalRecord[],
  filters: DashboardFilters,
  forcedJvaId?: string,
): SchulischeBildungKpis {
  const dataPeriods = resolveToDataPeriods(filters.reportingPeriod);
  if (dataPeriods.length === 0) return averageKpis([]);
  if (dataPeriods.length > 1) {
    return computeKpisForPeriods(records, operational, filters, dataPeriods, forcedJvaId);
  }

  const effectiveFilters: DashboardFilters = {
    ...filters,
    reportingPeriod: dataPeriods[0] ?? LATEST_PERIOD,
  };
  const filtered = applyDashboardScope(records, effectiveFilters, forcedJvaId);
  const opFiltered = filterOperational(operational, effectiveFilters, forcedJvaId);

  const teilnehmende = sumNullable(filtered.map((r) => r.participants));
  const sollPlaetze = sumNullable(filtered.map((r) => r.targetPlaces));
  const abschluesse = sumNullable(filtered.map((r) => r.completions));
  const zielerreichungen = sumNullable(filtered.map((r) => r.targetAchievements));
  const regulaereBeendigungen = sumNullable(filtered.map((r) => r.regulaereBeendigungen));
  const vorzeitigeBeendigungen = sumNullable(filtered.map((r) => r.vorzeitigeBeendigungen));
  const terminationShares = computeTerminationShares(regulaereBeendigungen, vorzeitigeBeendigungen);

  const totalInmates = sumNullable(opFiltered.map((r) => r.totalInmates));
  const employedTotal = sumNullable(opFiltered.map((r) => r.employedTotal));
  const belegbareHaftplaetze = sumNullable(opFiltered.map((r) => r.belegbareHaftplaetze));

  const schulischeBildung =
    teilnehmende != null && totalInmates != null && totalInmates > 0
      ? round1((teilnehmende / totalInmates) * 100)
      : null;

  const beschaeftigungsquote =
    employedTotal != null && totalInmates != null && totalInmates > 0
      ? round1((employedTotal / totalInmates) * 100)
      : null;

  const bruttobelegung =
    totalInmates != null && belegbareHaftplaetze != null && belegbareHaftplaetze > 0
      ? round1((totalInmates / belegbareHaftplaetze) * 100)
      : null;

  const auslastungRaw = calculateUtilization(teilnehmende, sollPlaetze);
  const auslastung = auslastungRaw != null ? round1(auslastungRaw) : null;
  const abbruchquoteRaw = calculateTerminationRate(vorzeitigeBeendigungen, teilnehmende);
  const abbruchquote = abbruchquoteRaw != null ? round1(abbruchquoteRaw) : null;

  const paedStellen = sumNullable(opFiltered.map((r) => r.paedStellen));
  const paedBesetzt = sumNullable(opFiltered.map((r) => r.paedBesetzt));
  const paedExtern = sumNullable(opFiltered.map((r) => r.paedExtern));
  const elisLernplaetze = sumNullable(opFiltered.map((r) => r.elisLernplaetze));
  const elisMandantschaften = sumNullable(opFiltered.map((r) => r.elisMandantschaften));
  const elisDigitaleSozialraeume = sumNullable(opFiltered.map((r) => r.elisDigitaleSozialraeume));
  const elisHaftraeume = sumNullable(opFiltered.map((r) => r.elisHaftraeume));
  const schulraeume = sumNullable(opFiltered.map((r) => r.schulraeume));
  const elisSchulraeume = sumNullable(opFiltered.map((r) => r.elisSchulraeume));

  return {
    beschaeftigungsquote,
    bruttobelegung,
    schulischeBildung,
    auslastung,
    teilnehmende,
    sollPlaetze,
    freiePlaetze: calculateFreePlaces(sollPlaetze, teilnehmende),
    regulaereBeendigungen,
    vorzeitigeBeendigungen,
    anteilRegulaereBeendigung: terminationShares.anteilRegulaereBeendigung,
    anteilVorzeitigeBeendigung: terminationShares.anteilVorzeitigeBeendigung,
    abbruchquote,
    abschluesse,
    zielerreichungen,
    paedStellen,
    paedBesetzt,
    paedExtern,
    elisLernplaetze,
    elisMandantschaften,
    elisDigitaleSozialraeume,
    elisHaftraeume,
    schulraeume,
    elisSchulraeume,
  };
}

/** Mittelwert je JVA über alle Anstalten — für NRW-Vergleich absoluter Kennzahlen. */
export function computeAverageKpisAcrossJvas(
  records: EducationMeasureRecord[],
  operational: JvaOperationalRecord[],
  filters: DashboardFilters,
): SchulischeBildungKpis {
  const perJva = JVAS.map((jva) =>
    computeKpis(
      records,
      operational,
      { ...filters, organizationLevel: 'jva', jvaIds: [jva.id] },
      jva.id,
    ),
  );
  return averageKpis(perJva);
}

export interface CategoryChartDatum {
  name: string;
  fullName: string;
  value: number;
  offers: number;
}

export function buildCategoryChart(records: EducationMeasureRecord[]): CategoryChartDatum[] {
  return courseCategories
    .map((cat) => {
      const catRecords = records.filter((r) => r.courseCategoryKey === cat.key);
      const participants = sumNullable(catRecords.map((r) => r.participants)) ?? 0;
      return {
        name: cat.label.length > 18 ? `${cat.label.slice(0, 16)}…` : cat.label,
        fullName: cat.label,
        value: participants,
        offers: catRecords.length,
      };
    })
    .filter((d) => d.value > 0 || d.offers > 0);
}

export function buildTerminationChart(records: EducationMeasureRecord[]) {
  return terminationReasons
    .map((reason) => ({
      name: reason.label,
      value: records.filter((r) => r.terminationReasonKey === reason.key).length,
      key: reason.key,
    }))
    .filter((d) => d.value > 0);
}

export interface RegulaereTerminationReasonRow {
  key: string;
  label: string;
  count: number;
}

export function buildRegulaereTerminationBreakdown(
  records: EducationMeasureRecord[],
): RegulaereTerminationReasonRow[] {
  return terminationReasons
    .filter((reason) => reason.level1 === 'reguläre Beendigung')
    .map((reason) => ({
      key: reason.key,
      label: reason.label,
      count: records.filter((record) => record.terminationReasonKey === reason.key).length,
    }));
}

const COMPLETION_TYPE_LABELS = new Map(COMPLETION_TYPES.map((item) => [item.key, item.label]));

function completionTypeLabel(key: string): string {
  return COMPLETION_TYPE_LABELS.get(key) ?? key;
}

export function buildSchoolCompletionsDetail(
  records: EducationMeasureRecord[],
): SchoolCompletionTypeRow[] {
  const withCompletions = records.filter((record) => (record.completions ?? 0) > 0);
  const byType = new Map<string, EducationMeasureRecord[]>();

  for (const record of withCompletions) {
    const key = record.completionType ?? '__unknown__';
    const bucket = byType.get(key);
    if (bucket) bucket.push(record);
    else byType.set(key, [record]);
  }

  return [...byType.entries()]
    .map(([completionTypeKey, typeRecords]) => {
      const jvaTotals = new Map<string, number>();

      for (const record of typeRecords) {
        jvaTotals.set(record.jvaId, (jvaTotals.get(record.jvaId) ?? 0) + (record.completions ?? 0));
      }

      const jvaBreakdown = [...jvaTotals.entries()]
        .map(([jvaId, count]) => ({
          jvaId,
          jvaName: getJvaById(jvaId)?.name ?? jvaId,
          count,
        }))
        .sort((a, b) => a.jvaName.localeCompare(b.jvaName, 'de-DE'));

      return {
        completionTypeKey,
        completionTypeLabel:
          completionTypeKey === '__unknown__' ? 'Ohne Angabe' : completionTypeLabel(completionTypeKey),
        total: sumNullable(typeRecords.map((record) => record.completions)) ?? 0,
        jvaBreakdown,
      };
    })
    .sort(
      (a, b) =>
        b.total - a.total || a.completionTypeLabel.localeCompare(b.completionTypeLabel, 'de-DE'),
    );
}

export function buildJvaComparisonChart(records: EducationMeasureRecord[]) {
  return JVAS.map((jva) => {
    const jvaRecords = records.filter((r) => r.jvaId === jva.id);
    const p = sumNullable(jvaRecords.map((r) => r.participants));
    const t = sumNullable(jvaRecords.map((r) => r.targetPlaces));
    const util = calculateUtilization(p, t);
    const shortName = jva.name.replace(/^JVA\s+/, '').slice(0, 12);
    return { name: shortName, value: util != null ? round1(util) : 0, jvaId: jva.id };
  }).filter((d) => d.value > 0);
}

export function buildUtilizationTrend(
  allRecords: EducationMeasureRecord[],
  filters: DashboardFilters,
  forcedJvaId?: string,
  granularity: TrendGranularity = 'month',
  timeline?: TrendTimelineSlot[],
): { name: string; value: number; key: string }[] {
  const scopedFilters = { ...filters, reportingPeriod: null };
  const monthFactors = [0.96, 1.0, 1.04];
  const weekFactors = [0.92, 0.97, 1.0, 1.05];
  const slots = timeline ?? getTrendTimeline(granularity);

  function utilizationForQuarters(quarterKeys: string[]): number | null {
    const scoped = quarterKeys.flatMap((period) =>
      applyDashboardScope(allRecords, { ...scopedFilters, reportingPeriod: period }, forcedJvaId),
    );
    const participants = sumNullable(scoped.map((r) => r.participants));
    const targetPlaces = sumNullable(scoped.map((r) => r.targetPlaces));
    const util = calculateUtilization(participants, targetPlaces);
    return util != null ? round1(util) : null;
  }

  return slots.map((slot) => {
    const baseUtil = utilizationForQuarters(slot.quarterKeys);
    if (baseUtil == null) {
      return { name: slot.label, value: 0, key: slot.key };
    }

    if (granularity === 'quarter' || granularity === 'year') {
      return { name: slot.label, value: baseUtil, key: slot.key };
    }

    const factors = granularity === 'week' ? weekFactors : monthFactors;
    const factor = factors[slot.variationIndex % slot.variationCount] ?? 1;
    return {
      name: slot.label,
      value: round1(Math.min(100, Math.max(0, baseUtil * factor))),
      key: slot.key,
    };
  });
}

export interface JvaOperationalRow {
  jvaId: string;
  jvaName: string;
  paedStellen: number | null;
  paedBesetzt: number | null;
  paedExtern: number | null;
  elisLernplaetze: number | null;
  elisMandantschaften: number | null;
  elisDigitaleSozialraeume: number | null;
  elisHaftraeume: number | null;
  schulraeume: number | null;
  elisSchulraeume: number | null;
}

export function buildJvaOperationalRows(
  operational: JvaOperationalRecord[],
  filters: DashboardFilters,
): JvaOperationalRow[] {
  const opFiltered = filterOperational(operational, filters);
  const byJva = new Map<string, JvaOperationalRecord[]>();

  for (const row of opFiltered) {
    const list = byJva.get(row.jvaId) ?? [];
    list.push(row);
    byJva.set(row.jvaId, list);
  }

  const jvaIds = getActiveFilterJvaIds(filters) ?? JVAS.map((j) => j.id);

  return jvaIds
    .map((jvaId) => {
      const rows = byJva.get(jvaId);
      if (!rows || rows.length === 0) return null;

      return {
        jvaId,
        jvaName: getJvaById(jvaId)?.name ?? jvaId,
        paedStellen: sumNullable(rows.map((r) => r.paedStellen)),
        paedBesetzt: sumNullable(rows.map((r) => r.paedBesetzt)),
        paedExtern: sumNullable(rows.map((r) => r.paedExtern)),
        elisLernplaetze: sumNullable(rows.map((r) => r.elisLernplaetze)),
        elisMandantschaften: sumNullable(rows.map((r) => r.elisMandantschaften)),
        elisDigitaleSozialraeume: sumNullable(rows.map((r) => r.elisDigitaleSozialraeume)),
        elisHaftraeume: sumNullable(rows.map((r) => r.elisHaftraeume)),
        schulraeume: sumNullable(rows.map((r) => r.schulraeume)),
        elisSchulraeume: sumNullable(rows.map((r) => r.elisSchulraeume)),
      };
    })
    .filter((row): row is JvaOperationalRow => row != null);
}

export function buildJvaSchoolRoomSummaries(
  rooms: SchoolRoom[],
  filters: DashboardFilters,
  forcedJvaId?: string,
): JvaSchoolRoomSummary[] {
  const jvaIds = forcedJvaId ? [forcedJvaId] : getActiveFilterJvaIds(filters) ?? JVAS.map((j) => j.id);

  return jvaIds
    .map((jvaId) => {
      const jvaRooms = rooms
        .filter((room) => room.jvaId === jvaId)
        .slice()
        .sort((a, b) => a.designation.localeCompare(b.designation, 'de-DE'));

      if (jvaRooms.length === 0) return null;

      return {
        jvaId,
        jvaName: getJvaById(jvaId)?.name ?? jvaId,
        schulraeume: jvaRooms.reduce((sum, room) => sum + room.roomCount, 0),
        elisSchulraeume: jvaRooms
          .filter((room) => room.isElis)
          .reduce((sum, room) => sum + room.roomCount, 0),
        rooms: jvaRooms,
      };
    })
    .filter((summary): summary is JvaSchoolRoomSummary => summary != null)
    .sort((a, b) => a.jvaName.localeCompare(b.jvaName, 'de-DE'));
}

export function buildJvaTableRows(
  records: EducationMeasureRecord[],
  filters: DashboardFilters,
): JvaTableRow[] {
  const scoped = applyDashboardScope(records, filters);
  const jvaIds = getActiveFilterJvaIds(filters) ?? JVAS.map((j) => j.id);

  const rows: JvaTableRow[] = [];

  for (const jvaId of jvaIds) {
    const jvaRecords = scoped.filter((r) => r.jvaId === jvaId);
    if (jvaRecords.length === 0) continue;

    const participants = sumNullable(jvaRecords.map((r) => r.participants));
    const targetPlaces = sumNullable(jvaRecords.map((r) => r.targetPlaces));
    const terminations = sumNullable(jvaRecords.map((r) => r.terminations));
    const courseCount = new Set(jvaRecords.map((r) => r.courseCategoryKey)).size;
    const util = calculateUtilization(participants, targetPlaces);

    rows.push({
      jvaId,
      jvaName: getJvaById(jvaId)?.name ?? jvaId,
      courseCategory: `${courseCount} Überkategorien`,
      courseType: `${jvaRecords.length} Maßnahmen`,
      participants,
      targetPlaces,
      utilization: util != null ? round1(util) : null,
      freePlaces: calculateFreePlaces(targetPlaces, participants),
      terminations,
      dataStatus: 'Demo',
    });
  }

  return rows;
}

export function buildFreeCapacityRows(records: EducationMeasureRecord[]): FreeCapacityRow[] {
  const rows: FreeCapacityRow[] = [];

  for (const r of records) {
    const free = calculateFreePlaces(r.targetPlaces, r.participants);
    if (free == null || free <= 0) continue;
    const ct = COURSE_TYPE_BY_KEY[r.courseTypeKey];
    const cat = courseCategories.find((c) => c.key === r.courseCategoryKey);
    rows.push({
      jvaId: r.jvaId,
      jvaName: getJvaById(r.jvaId)?.name ?? r.jvaId,
      courseCategoryKey: r.courseCategoryKey,
      courseCategory: cat?.label ?? r.courseCategoryKey,
      courseTypeKey: r.courseTypeKey,
      courseType: ct?.shortLabel ?? ct?.label ?? r.courseTypeKey,
      geschlecht: r.geschlecht ?? '—',
      haftform: r.haftform ?? '—',
      altersgruppe: r.altersgruppe ?? '—',
      haftart: getHaftartLabel(r.haftart),
      freePlaces: free,
      dataStatus: 'Demo',
    });
  }

  return rows.sort((a, b) => (b.freePlaces ?? 0) - (a.freePlaces ?? 0));
}

export interface JvaCourseRow {
  courseCategoryKey: string;
  courseCategory: string;
  courseTypeKey: string;
  courseType: string;
  zielgruppeGeschlecht: string;
  zielgruppeAltersgruppe: string;
  participants: number | null;
  targetPlaces: number | null;
  utilization: number | null;
  utilizationLastMonth: number | null;
  freePlaces: number | null;
  duration: string | null;
  minimumPlaces: number | null;
  kursleitung: Kursleitung | null;
  massnahmenbeginn: Massnahmenbeginn | null;
}

export function buildJvaCourseRows(
  records: EducationMeasureRecord[],
  jvaId: string,
  filters: DashboardFilters,
): JvaCourseRow[] {
  const scoped = applyDashboardScope(records, filters, jvaId);

  return scoped.map((r) => {
    const ct = COURSE_TYPE_BY_KEY[r.courseTypeKey];
    const cat = courseCategories.find((c) => c.key === r.courseCategoryKey);
    const util = calculateUtilization(r.participants, r.targetPlaces);
    return {
      courseCategoryKey: r.courseCategoryKey,
      courseCategory: cat?.label ?? r.courseCategoryKey,
      courseTypeKey: r.courseTypeKey,
      courseType: ct?.label ?? r.courseTypeKey,
      zielgruppeGeschlecht: formatZielgruppeGeschlecht(r.geschlecht),
      zielgruppeAltersgruppe: formatZielgruppeAltersgruppe(r.altersgruppe),
      participants: r.participants ?? null,
      targetPlaces: r.targetPlaces ?? null,
      utilization: util != null ? round1(util) : null,
      utilizationLastMonth: calculateUtilizationLastMonth(
        r.participants,
        r.targetPlaces,
        r.reportingPeriod,
      ),
      freePlaces: calculateFreePlaces(r.targetPlaces, r.participants),
      duration: ct?.duration ?? null,
      minimumPlaces: ct?.minimumPlacesAdults ?? null,
      kursleitung: r.kursleitung ?? null,
      massnahmenbeginn: r.massnahmenbeginn ?? null,
    };
  });
}

export function buildJvaCourseUtilizationChart(rows: JvaCourseRow[]) {
  return rows
    .map((r) => ({
      name: (COURSE_TYPE_BY_KEY[r.courseTypeKey]?.shortLabel ?? r.courseType).slice(0, 14),
      value: r.utilization ?? 0,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function getTerminationLabel(key: string | null | undefined): string {
  if (!key) return '—';
  return TERMINATION_REASON_BY_KEY[key]?.label ?? key;
}
