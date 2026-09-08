import { JVAS } from '../data/jvas';
import { TERMINATION_REASON_BY_KEY, terminationReasons } from '../data/catalog';
import type { EducationMeasureRecord, TerminationLevel1 } from '../types/domain';
import {
  filterRecordsByJva,
  NRW_JVA_COUNT,
  NRW_SERIES_SUFFIX,
  type CategoryChartGroup,
  type CategoryTrendPoint,
  type SchulteilnehmendeAltersgruppe,
  type SchulteilnehmendeGeschlecht,
} from './schulteilnehmende';
import {
  formatMonthShort,
  formatQuarterShort,
  generateMonthsEnding,
  generateQuartersEnding,
  getAllQuartersInCalendarYear,
  getCompletedYearAsOf,
  getYearFromPeriod,
  monthToQuarterKey,
  MONTH_UTILIZATION_FACTORS,
  shiftQuarter,
} from './periods';

export const PREMATURE_LEVEL: TerminationLevel1 = 'vorzeitige Beendigung';
export const REGULAR_LEVEL: TerminationLevel1 = 'reguläre Beendigung';

export const PREMATURE_REASONS = terminationReasons.filter((reason) => reason.level1 === PREMATURE_LEVEL);
export const REGULAR_REASONS = terminationReasons.filter((reason) => reason.level1 === REGULAR_LEVEL);

const CHART_SHORT_LABELS: Record<string, string> = {
  'RB-01': 'Zielerreichung ohne Regelabschluss',
  'RB-02': 'Erfolgreicher Abschluss',
  'RB-03': 'Beendigung ohne Abschluss/Zielerreichung',
  'VB-01': 'Disziplinarische Gründe',
  'VB-02': 'Freiwilliges Ausscheiden',
  'VB-03': 'Unzureichende Fähigkeiten / gesundh. Einschr.',
  'VB-04': 'Sicherungsmaßnahmen / Tätertrennung',
  'VB-05': 'Entlassung oder Verlegung',
  'VB-06': 'Maßnahmenwechsel',
  'VB-07': 'Entweichung oder Nichtrückkehr',
  'VB-08': 'Sonstige sicherheits-/vollstreckungsrel. Gründe',
};

type CountIndex = Map<string, number>;

const countIndexCache = new WeakMap<EducationMeasureRecord[], CountIndex>();

function indexKey(
  altersgruppe: string,
  geschlecht: string,
  reasonKey: string,
  period: string,
): string {
  return `${altersgruppe}|${geschlecht}|${reasonKey}|${period}`;
}

function attributedCount(record: EducationMeasureRecord): number {
  const reason = record.terminationReasonKey
    ? TERMINATION_REASON_BY_KEY[record.terminationReasonKey]
    : undefined;
  if (!reason) return 0;
  if (reason.level1 === PREMATURE_LEVEL) {
    return record.vorzeitigeBeendigungen ?? 0;
  }
  return record.regulaereBeendigungen ?? 0;
}

function getCountIndex(records: EducationMeasureRecord[]): CountIndex {
  const cached = countIndexCache.get(records);
  if (cached) return cached;

  const index: CountIndex = new Map();
  for (const record of records) {
    if (!record.altersgruppe || !record.geschlecht || !record.terminationReasonKey) continue;
    const count = attributedCount(record);
    if (count <= 0) continue;
    const key = indexKey(
      record.altersgruppe,
      record.geschlecht,
      record.terminationReasonKey,
      record.reportingPeriod,
    );
    index.set(key, (index.get(key) ?? 0) + count);
  }
  countIndexCache.set(records, index);
  return index;
}

function sumCounts(
  records: EducationMeasureRecord[],
  options: {
    altersgruppe: SchulteilnehmendeAltersgruppe;
    geschlecht?: SchulteilnehmendeGeschlecht;
    reasonKeys?: string[];
    periods: string[];
  },
): number {
  const index = getCountIndex(records);
  const keys = options.reasonKeys ?? terminationReasons.map((reason) => reason.key);
  const genders: SchulteilnehmendeGeschlecht[] = options.geschlecht
    ? [options.geschlecht]
    : ['männlich', 'weiblich'];
  let total = 0;
  for (const geschlecht of genders) {
    for (const reasonKey of keys) {
      for (const period of options.periods) {
        total += index.get(indexKey(options.altersgruppe, geschlecht, reasonKey, period)) ?? 0;
      }
    }
  }
  return total;
}

function nrwAverageCounts(
  records: EducationMeasureRecord[],
  options: Parameters<typeof sumCounts>[1],
): number {
  if (NRW_JVA_COUNT <= 0) return 0;
  return Math.round(sumCounts(records, options) / NRW_JVA_COUNT);
}

export interface TerminationReportOptions {
  reasonKeys?: string[];
  genders?: SchulteilnehmendeGeschlecht[];
  nrwRecords?: EducationMeasureRecord[];
}

export function scopeJvaTerminationRecords(
  records: EducationMeasureRecord[],
  jvaId: string,
): EducationMeasureRecord[] {
  const byJva = filterRecordsByJva(records, jvaId);
  const jva = JVAS.find((item) => item.id === jvaId);
  if (!jva) return byJva;
  return byJva.filter((record) => {
    if (jva.geschlecht !== 'gemischt' && record.geschlecht !== jva.geschlecht) return false;
    if (jva.altersgruppe !== 'beides' && record.altersgruppe !== jva.altersgruppe) return false;
    return true;
  });
}

export function getPresentTerminationAspects(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
): {
  genders: SchulteilnehmendeGeschlecht[];
  reasonKeys: string[];
  levels: TerminationLevel1[];
} {
  const genderSet = new Set<SchulteilnehmendeGeschlecht>();
  const reasonSet = new Set<string>();
  for (const record of records) {
    if (record.altersgruppe !== altersgruppe) continue;
    if (attributedCount(record) <= 0 || !record.terminationReasonKey) continue;
    if (record.geschlecht === 'männlich' || record.geschlecht === 'weiblich') {
      genderSet.add(record.geschlecht);
    }
    reasonSet.add(record.terminationReasonKey);
  }
  const reasonKeys = terminationReasons.map((reason) => reason.key).filter((key) => reasonSet.has(key));
  const levels: TerminationLevel1[] = [];
  if (reasonKeys.some((key) => PREMATURE_REASONS.some((reason) => reason.key === key))) {
    levels.push(PREMATURE_LEVEL);
  }
  if (reasonKeys.some((key) => REGULAR_REASONS.some((reason) => reason.key === key))) {
    levels.push(REGULAR_LEVEL);
  }
  return {
    genders: (['weiblich', 'männlich'] as const).filter((gender) => genderSet.has(gender)),
    reasonKeys,
    levels,
  };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function interpolateCount(quarterTotal: number, monthKey: string): number {
  const monthInQuarter = (parseInt(monthKey.slice(5, 7), 10) - 1) % 3;
  const factor = MONTH_UTILIZATION_FACTORS[monthInQuarter] ?? 1;
  return Math.round(quarterTotal * factor);
}

function completedEndYear(berichtszeitpunkt: string): number {
  return (
    getCompletedYearAsOf(berichtszeitpunkt) ??
    (/^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? getYearFromPeriod(berichtszeitpunkt)
      : parseInt(berichtszeitpunkt, 10))
  );
}

const OVERVIEW_SERIES = [
  { key: 'vorzeitig_w', label: 'Vorzeitig weiblich', isSumme: false },
  { key: 'vorzeitig_m', label: 'Vorzeitig männlich', isSumme: false },
  { key: 'vorzeitig_s', label: 'Vorzeitig Summe', isSumme: false },
  { key: 'regulaer_w', label: 'Regulär weiblich', isSumme: false },
  { key: 'regulaer_m', label: 'Regulär männlich', isSumme: false },
  { key: 'regulaer_s', label: 'Regulär Summe', isSumme: false },
] as const;

export function buildTerminationOverviewGroup(
  options: { genders?: SchulteilnehmendeGeschlecht[]; levels?: TerminationLevel1[] } = {},
): CategoryChartGroup {
  const genders = options.genders ?? ['weiblich', 'männlich'];
  const levels = options.levels ?? [PREMATURE_LEVEL, REGULAR_LEVEL];
  const showBothGenders = genders.includes('weiblich') && genders.includes('männlich');
  return {
    id: 'beendigung-uebersicht',
    title: 'Beendigung aller Maßnahmen',
    categoryKeys: [],
    series: OVERVIEW_SERIES.filter((series) => {
      const isPremature = series.key.startsWith('vorzeitig');
      const isRegular = series.key.startsWith('regulaer');
      if (isPremature && !levels.includes(PREMATURE_LEVEL)) return false;
      if (isRegular && !levels.includes(REGULAR_LEVEL)) return false;
      if (series.key.endsWith('_w') && !genders.includes('weiblich')) return false;
      if (series.key.endsWith('_m') && !genders.includes('männlich')) return false;
      if (series.key.endsWith('_s') && !showBothGenders) return false;
      return true;
    }).map((series) => ({ ...series })),
  };
}

export function buildTerminationReasonGroup(
  level: TerminationLevel1,
  reasonKeys?: string[],
): CategoryChartGroup {
  const allowed = reasonKeys ? new Set(reasonKeys) : null;
  const reasons = (level === PREMATURE_LEVEL ? PREMATURE_REASONS : REGULAR_REASONS).filter(
    (reason) => !allowed || allowed.has(reason.key),
  );
  return {
    id: `beendigung-${level}`,
    title: level === PREMATURE_LEVEL ? 'Vorzeitige Beendigungsgründe' : 'Reguläre Beendigungsgründe',
    categoryKeys: [],
    series: reasons.map((reason) => ({
      key: reason.key,
      label: CHART_SHORT_LABELS[reason.key] ?? reason.label,
      isSumme: false,
    })),
  };
}

function overviewPoint(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  periods: string[],
  key: string,
  label: string,
  interpolateMonth?: string,
  nrwRecords?: EducationMeasureRecord[],
): CategoryTrendPoint {
  const value = (
    source: EducationMeasureRecord[],
    geschlecht: SchulteilnehmendeGeschlecht | undefined,
    reasonKeys: string[],
    average: boolean,
  ) => {
    const count = average
      ? nrwAverageCounts(source, { altersgruppe, geschlecht, reasonKeys, periods })
      : sumCounts(source, { altersgruppe, geschlecht, reasonKeys, periods });
    return interpolateMonth ? interpolateCount(count, interpolateMonth) : count;
  };
  const prematureKeys = PREMATURE_REASONS.map((reason) => reason.key);
  const regularKeys = REGULAR_REASONS.map((reason) => reason.key);
  const point: CategoryTrendPoint = {
    key,
    label,
    vorzeitig_w: value(records, 'weiblich', prematureKeys, false),
    vorzeitig_m: value(records, 'männlich', prematureKeys, false),
    vorzeitig_s: value(records, undefined, prematureKeys, false),
    regulaer_w: value(records, 'weiblich', regularKeys, false),
    regulaer_m: value(records, 'männlich', regularKeys, false),
    regulaer_s: value(records, undefined, regularKeys, false),
  };
  if (!nrwRecords) return point;
  point[`vorzeitig_w${NRW_SERIES_SUFFIX}`] = value(nrwRecords, 'weiblich', prematureKeys, true);
  point[`vorzeitig_m${NRW_SERIES_SUFFIX}`] = value(nrwRecords, 'männlich', prematureKeys, true);
  point[`vorzeitig_s${NRW_SERIES_SUFFIX}`] = value(nrwRecords, undefined, prematureKeys, true);
  point[`regulaer_w${NRW_SERIES_SUFFIX}`] = value(nrwRecords, 'weiblich', regularKeys, true);
  point[`regulaer_m${NRW_SERIES_SUFFIX}`] = value(nrwRecords, 'männlich', regularKeys, true);
  point[`regulaer_s${NRW_SERIES_SUFFIX}`] = value(nrwRecords, undefined, regularKeys, true);
  return point;
}

export function buildTerminationOverviewTrend(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  range: 'last-5-quarters' | 'last-13-months' | 'last-11-years',
  berichtszeitpunkt: string,
  options: TerminationReportOptions = {},
): CategoryTrendPoint[] {
  const nrwRecords = options.nrwRecords;
  if (range === 'last-5-quarters') {
    return generateQuartersEnding(berichtszeitpunkt, 5).map((quarter) =>
      overviewPoint(records, altersgruppe, [quarter], quarter, formatQuarterShort(quarter), undefined, nrwRecords),
    );
  }

  if (range === 'last-13-months') {
    const endMonth = /^\d{4}-Q[1-4]$/.test(berichtszeitpunkt)
      ? `${berichtszeitpunkt.slice(0, 4)}-${String(parseInt(berichtszeitpunkt.slice(-1), 10) * 3).padStart(2, '0')}`
      : berichtszeitpunkt;
    return generateMonthsEnding(endMonth, 13).map((monthKey) =>
      overviewPoint(
        records,
        altersgruppe,
        [monthToQuarterKey(monthKey)],
        monthKey,
        formatMonthShort(monthKey),
        monthKey,
        nrwRecords,
      ),
    );
  }

  const endYear = completedEndYear(berichtszeitpunkt);
  const startYear = endYear - 10;
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    return overviewPoint(
      records,
      altersgruppe,
      getAllQuartersInCalendarYear(year),
      String(year),
      String(year),
      undefined,
      nrwRecords,
    );
  });
}

export function buildTerminationReasonTrend(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  geschlecht: SchulteilnehmendeGeschlecht,
  level: TerminationLevel1,
  berichtszeitpunkt: string,
  options: TerminationReportOptions = {},
): CategoryTrendPoint[] {
  const allowed = options.reasonKeys ? new Set(options.reasonKeys) : null;
  const reasons = (level === PREMATURE_LEVEL ? PREMATURE_REASONS : REGULAR_REASONS).filter(
    (reason) => !allowed || allowed.has(reason.key),
  );
  const endYear = completedEndYear(berichtszeitpunkt);
  const startYear = endYear - 10;
  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    const periods = getAllQuartersInCalendarYear(year);
    const point: CategoryTrendPoint = {
      key: String(year),
      label: String(year),
    };
    for (const reason of reasons) {
      point[reason.key] = sumCounts(records, {
        altersgruppe,
        geschlecht,
        reasonKeys: [reason.key],
        periods,
      });
      if (options.nrwRecords) {
        point[`${reason.key}${NRW_SERIES_SUFFIX}`] = nrwAverageCounts(options.nrwRecords, {
          altersgruppe,
          geschlecht,
          reasonKeys: [reason.key],
          periods,
        });
      }
    }
    return point;
  });
}

export interface TerminationQuarterLabels {
  current: string;
  previous: string;
  yearAgo: string;
}

export interface TerminationYearLabels {
  current: string;
  previous: string;
}

export interface TerminationGenderQuarter {
  current: number;
  previous: number;
  yearAgo: number;
  changePrev: number | null;
  changeYearAgo: number | null;
  nrwCurrent?: number;
  vsNrw?: number | null;
}

export interface TerminationGenderYear {
  current: number;
  previous: number;
  changePrev: number;
  nrwCurrent?: number;
  vsNrw?: number | null;
}

export interface TerminationQuarterRow {
  levelKey: TerminationLevel1 | '__summe__';
  levelLabel: string;
  reasonKey: string | null;
  reasonLabel: string;
  isLevelSum: boolean;
  both: number;
  bothNrw?: number;
  bothVsNrw?: number | null;
  weiblich: TerminationGenderQuarter;
  maennlich: TerminationGenderQuarter;
}

export interface TerminationYearRow {
  levelKey: TerminationLevel1 | '__summe__';
  levelLabel: string;
  reasonKey: string | null;
  reasonLabel: string;
  isLevelSum: boolean;
  both: number;
  bothNrw?: number;
  bothVsNrw?: number | null;
  weiblich: TerminationGenderYear;
  maennlich: TerminationGenderYear;
}

function withNrwMetric<T extends { current: number }>(metric: T, nrwCurrent?: number): T {
  if (nrwCurrent == null) return metric;
  return {
    ...metric,
    nrwCurrent,
    vsNrw: percentChange(metric.current, nrwCurrent),
  };
}

function bothGeschlecht(genders?: SchulteilnehmendeGeschlecht[]): SchulteilnehmendeGeschlecht | undefined {
  if (!genders || genders.length !== 1) return undefined;
  return genders[0];
}

function genderQuarter(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  geschlecht: SchulteilnehmendeGeschlecht,
  reasonKeys: string[],
  current: string[],
  previous: string[],
  yearAgo: string[],
  nrwRecords?: EducationMeasureRecord[],
): TerminationGenderQuarter {
  const cur = sumCounts(records, { altersgruppe, geschlecht, reasonKeys, periods: current });
  const prev = sumCounts(records, { altersgruppe, geschlecht, reasonKeys, periods: previous });
  const ago = sumCounts(records, { altersgruppe, geschlecht, reasonKeys, periods: yearAgo });
  return withNrwMetric(
    {
      current: cur,
      previous: prev,
      yearAgo: ago,
      changePrev: percentChange(cur, prev),
      changeYearAgo: percentChange(cur, ago),
    },
    nrwRecords
      ? nrwAverageCounts(nrwRecords, { altersgruppe, geschlecht, reasonKeys, periods: current })
      : undefined,
  );
}

function genderYear(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  geschlecht: SchulteilnehmendeGeschlecht,
  reasonKeys: string[],
  current: string[],
  previous: string[],
  nrwRecords?: EducationMeasureRecord[],
): TerminationGenderYear {
  const cur = sumCounts(records, { altersgruppe, geschlecht, reasonKeys, periods: current });
  const prev = sumCounts(records, { altersgruppe, geschlecht, reasonKeys, periods: previous });
  return withNrwMetric(
    {
      current: cur,
      previous: prev,
      changePrev: cur - prev,
    },
    nrwRecords
      ? nrwAverageCounts(nrwRecords, { altersgruppe, geschlecht, reasonKeys, periods: current })
      : undefined,
  );
}

const LEVELS: { key: TerminationLevel1; label: string; sumLabel: string; reasons: typeof PREMATURE_REASONS }[] = [
  {
    key: PREMATURE_LEVEL,
    label: 'Vorzeitig',
    sumLabel: 'Summe vorzeitige Beendigung',
    reasons: PREMATURE_REASONS,
  },
  {
    key: REGULAR_LEVEL,
    label: 'Regulär',
    sumLabel: 'Summe reguläre Beendigung',
    reasons: REGULAR_REASONS,
  },
];

export function buildTerminationQuarterTable(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  currentQuarter: string,
  options: TerminationReportOptions = {},
): { rows: TerminationQuarterRow[]; labels: TerminationQuarterLabels } {
  const current = [currentQuarter];
  const previous = [shiftQuarter(currentQuarter, -1)];
  const yearAgo = [shiftQuarter(currentQuarter, -4)];
  const rows: TerminationQuarterRow[] = [];
  const { nrwRecords, genders, reasonKeys } = options;
  const bothGender = bothGeschlecht(genders);

  for (const level of LEVELS) {
    const levelReasons = level.reasons.filter(
      (reason) => !reasonKeys || reasonKeys.includes(reason.key),
    );
    if (levelReasons.length === 0) continue;
    const levelKeys = levelReasons.map((reason) => reason.key);
    for (const reason of levelReasons) {
      const keys = [reason.key];
      const both = sumCounts(records, {
        altersgruppe,
        geschlecht: bothGender,
        reasonKeys: keys,
        periods: current,
      });
      const bothNrw = nrwRecords
        ? nrwAverageCounts(nrwRecords, {
            altersgruppe,
            geschlecht: bothGender,
            reasonKeys: keys,
            periods: current,
          })
        : undefined;
      rows.push({
        levelKey: level.key,
        levelLabel: level.label,
        reasonKey: reason.key,
        reasonLabel: reason.label,
        isLevelSum: false,
        both,
        bothNrw,
        bothVsNrw: bothNrw == null ? undefined : percentChange(both, bothNrw),
        weiblich: genderQuarter(records, altersgruppe, 'weiblich', keys, current, previous, yearAgo, nrwRecords),
        maennlich: genderQuarter(records, altersgruppe, 'männlich', keys, current, previous, yearAgo, nrwRecords),
      });
    }
    const both = sumCounts(records, {
      altersgruppe,
      geschlecht: bothGender,
      reasonKeys: levelKeys,
      periods: current,
    });
    const bothNrw = nrwRecords
      ? nrwAverageCounts(nrwRecords, {
          altersgruppe,
          geschlecht: bothGender,
          reasonKeys: levelKeys,
          periods: current,
        })
      : undefined;
    rows.push({
      levelKey: level.key,
      levelLabel: level.label,
      reasonKey: null,
      reasonLabel: level.sumLabel,
      isLevelSum: true,
      both,
      bothNrw,
      bothVsNrw: bothNrw == null ? undefined : percentChange(both, bothNrw),
      weiblich: genderQuarter(
        records,
        altersgruppe,
        'weiblich',
        levelKeys,
        current,
        previous,
        yearAgo,
        nrwRecords,
      ),
      maennlich: genderQuarter(
        records,
        altersgruppe,
        'männlich',
        levelKeys,
        current,
        previous,
        yearAgo,
        nrwRecords,
      ),
    });
  }

  return {
    rows,
    labels: {
      current: formatQuarterShort(currentQuarter),
      previous: formatQuarterShort(shiftQuarter(currentQuarter, -1)),
      yearAgo: formatQuarterShort(shiftQuarter(currentQuarter, -4)),
    },
  };
}

export function buildTerminationYearTable(
  records: EducationMeasureRecord[],
  altersgruppe: SchulteilnehmendeAltersgruppe,
  asOfQuarter: string,
  options: TerminationReportOptions = {},
): { rows: TerminationYearRow[]; labels: TerminationYearLabels } | null {
  const currentYear = getCompletedYearAsOf(asOfQuarter);
  if (currentYear == null) return null;
  const previousYear = currentYear - 1;
  const current = getAllQuartersInCalendarYear(currentYear);
  const previous = getAllQuartersInCalendarYear(previousYear);
  const rows: TerminationYearRow[] = [];
  const { nrwRecords, genders, reasonKeys } = options;
  const bothGender = bothGeschlecht(genders);

  for (const level of LEVELS) {
    const levelReasons = level.reasons.filter(
      (reason) => !reasonKeys || reasonKeys.includes(reason.key),
    );
    if (levelReasons.length === 0) continue;
    const levelKeys = levelReasons.map((reason) => reason.key);
    for (const reason of levelReasons) {
      const keys = [reason.key];
      const both = sumCounts(records, {
        altersgruppe,
        geschlecht: bothGender,
        reasonKeys: keys,
        periods: current,
      });
      const bothNrw = nrwRecords
        ? nrwAverageCounts(nrwRecords, {
            altersgruppe,
            geschlecht: bothGender,
            reasonKeys: keys,
            periods: current,
          })
        : undefined;
      rows.push({
        levelKey: level.key,
        levelLabel: level.label,
        reasonKey: reason.key,
        reasonLabel: reason.label,
        isLevelSum: false,
        both,
        bothNrw,
        bothVsNrw: bothNrw == null ? undefined : percentChange(both, bothNrw),
        weiblich: genderYear(records, altersgruppe, 'weiblich', keys, current, previous, nrwRecords),
        maennlich: genderYear(records, altersgruppe, 'männlich', keys, current, previous, nrwRecords),
      });
    }
    const both = sumCounts(records, {
      altersgruppe,
      geschlecht: bothGender,
      reasonKeys: levelKeys,
      periods: current,
    });
    const bothNrw = nrwRecords
      ? nrwAverageCounts(nrwRecords, {
          altersgruppe,
          geschlecht: bothGender,
          reasonKeys: levelKeys,
          periods: current,
        })
      : undefined;
    rows.push({
      levelKey: level.key,
      levelLabel: level.label,
      reasonKey: null,
      reasonLabel: level.sumLabel,
      isLevelSum: true,
      both,
      bothNrw,
      bothVsNrw: bothNrw == null ? undefined : percentChange(both, bothNrw),
      weiblich: genderYear(records, altersgruppe, 'weiblich', levelKeys, current, previous, nrwRecords),
      maennlich: genderYear(records, altersgruppe, 'männlich', levelKeys, current, previous, nrwRecords),
    });
  }

  return {
    rows,
    labels: {
      current: String(currentYear),
      previous: String(previousYear),
    },
  };
}

export interface TerminationFreeTextEntry {
  reasonKey: string;
  reasonLabel: string;
  text: string;
  count: number;
}

export function buildTerminationFreeTextListing(
  records: EducationMeasureRecord[],
  year: number,
): TerminationFreeTextEntry[] {
  const periods = new Set(getAllQuartersInCalendarYear(year));
  const grouped = new Map<string, TerminationFreeTextEntry>();
  for (const record of records) {
    const text = record.terminationFreeText?.trim();
    if (!text || !periods.has(record.reportingPeriod) || !record.terminationReasonKey) continue;
    const count = attributedCount(record);
    if (count <= 0) continue;
    const mapKey = `${record.terminationReasonKey}|${text}`;
    const current = grouped.get(mapKey);
    if (current) {
      current.count += count;
      continue;
    }
    const reason = TERMINATION_REASON_BY_KEY[record.terminationReasonKey];
    grouped.set(mapKey, {
      reasonKey: record.terminationReasonKey,
      reasonLabel: reason?.label ?? record.terminationReasonKey,
      text,
      count,
    });
  }
  return [...grouped.values()].sort(
    (a, b) => b.count - a.count || a.reasonLabel.localeCompare(b.reasonLabel, 'de') || a.text.localeCompare(b.text, 'de'),
  );
}
