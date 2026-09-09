import type {
  UtilizationQuarterLabels,
  UtilizationQuarterRow,
  UtilizationYearLabels,
  UtilizationYearRow,
} from './auslastungsquote';
import type {
  TerminationFreeTextEntry,
  TerminationQuarterLabels,
  TerminationQuarterRow,
  TerminationYearLabels,
  TerminationYearRow,
} from './beendigungsgruende';
import type { KursangebotJvaSection } from './kursangebote';
import type { SchulabschlussYearLabels, SchulabschlussYearRow } from './schulabschluesse';
import type { SchulraumTable } from './schulraeume';
import type {
  CategoryChartGroup,
  CategoryTrendPoint,
  GenderTrendPoint,
  QuarterMetric,
  QuarterTableColumnLabels,
  SchulteilnehmendeQuarterRow,
  SchulteilnehmendeYearRow,
  YearMetric,
  YearTableColumnLabels,
} from './schulteilnehmende';
import { NRW_SERIES_SUFFIX } from './schulteilnehmende';
import type { SollplatzVeraenderungTable } from './sollplatzVeraenderung';
import type { StellenTable } from './stellen';
import {
  buildCreatedAtLabel,
  buildExcelFilename,
  buildGroupedHeader,
  buildNativeChartSheet,
  C,
  compactChartBlocks,
  mergeCells,
  writeStyledWorkbook,
  type ExcelChartBlock,
  type ExcelSheet,
  type ExcelTheme,
  type StyledCell,
} from './excelWorkbook';
import { formatReportingPeriodDisplay } from './periods';

export interface ReportExcelMeta {
  reportLabel: string;
  title: string;
  berichtszeitpunkt: string;
  jvaName?: string | null;
  extra?: string | null;
  filenameBase: string;
}

function periodLabel(berichtszeitpunkt: string): string {
  return formatReportingPeriodDisplay(berichtszeitpunkt);
}

function bannerRows(meta: ReportExcelMeta, tableTitle: string, columnCount: number): {
  rows: StyledCell[][];
  merges: ReturnType<typeof mergeCells>[];
} {
  const subtitle = [
    meta.reportLabel,
    meta.jvaName,
    `Berichtszeitpunkt ${periodLabel(meta.berichtszeitpunkt)}`,
    meta.extra,
    `Erstellt am ${buildCreatedAtLabel()}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const titleRow = [C.title(meta.title), ...Array.from({ length: Math.max(columnCount - 1, 0) }, () => C.empty())];
  const subtitleRow = [C.subtitle(subtitle), ...Array.from({ length: Math.max(columnCount - 1, 0) }, () => C.empty())];
  const headingRow = [C.subtitle(tableTitle), ...Array.from({ length: Math.max(columnCount - 1, 0) }, () => C.empty())];
  const merges = [
    mergeCells(0, 0, 0, Math.max(columnCount - 1, 0)),
    mergeCells(1, 0, 1, Math.max(columnCount - 1, 0)),
    mergeCells(3, 0, 3, Math.max(columnCount - 1, 0)),
  ];
  return { rows: [titleRow, subtitleRow, [C.empty()], headingRow, [C.empty()]], merges };
}

function overviewSheet(meta: ReportExcelMeta, notes: string[]): ExcelSheet {
  const rows: StyledCell[][] = [
    [C.title(meta.title)],
    [C.subtitle(meta.reportLabel)],
    [C.empty()],
    [C.metaLabel('Bericht'), C.metaValue(meta.reportLabel)],
    [C.metaLabel('Berichtszeitpunkt'), C.metaValue(periodLabel(meta.berichtszeitpunkt))],
  ];
  if (meta.jvaName) {
    rows.push([C.metaLabel('Anstalt'), C.metaValue(meta.jvaName)]);
  }
  if (meta.extra) {
    rows.push([C.metaLabel('Hinweis'), C.metaValue(meta.extra)]);
  }
  rows.push(
    [C.metaLabel('Erstellt am'), C.metaValue(buildCreatedAtLabel())],
    [C.metaLabel('Datenquelle'), C.metaValue('Demo-Daten / BASIS-Web')],
    [C.empty()],
  );
  for (const note of notes) {
    rows.push([C.note(note)]);
  }
  return {
    name: 'Übersicht',
    rows,
    merges: [mergeCells(0, 0, 0, 1), mergeCells(1, 0, 1, 1)],
  };
}

function finishSheet(
  name: string,
  meta: ReportExcelMeta,
  tableTitle: string,
  headerRows: StyledCell[][],
  headerMerges: ReturnType<typeof mergeCells>[],
  body: StyledCell[][],
  extraMerges: ReturnType<typeof mergeCells>[] = [],
  freezeCols = 2,
): ExcelSheet {
  const columnCount = Math.max(
    ...headerRows.map((row) => row.length),
    ...body.map((row) => row.length),
    2,
  );
  const banner = bannerRows(meta, tableTitle, columnCount);
  const headerStart = banner.rows.length;
  const shiftedMerges = headerMerges.map((range) => ({
    s: { r: range.s.r + headerStart, c: range.s.c },
    e: { r: range.e.r + headerStart, c: range.e.c },
  }));
  return {
    name,
    rows: [...banner.rows, ...headerRows, ...body],
    merges: [...banner.merges, ...shiftedMerges, ...extraMerges],
    freezeRows: headerStart + headerRows.length,
    freezeCols,
  };
}

const GENDER_CHART_COLORS = {
  weiblich: '4F81BD',
  maennlich: 'F79646',
  summe: '7F7F7F',
} as const;

const CATEGORY_CHART_COLORS = [
  'C0504D',
  '9BBB59',
  '8064A2',
  '4BACC6',
  'F79646',
  '1F497D',
  'C3D69B',
  '948A54',
  'E46C0A',
  '4F81BD',
];

function pushChartSheet(
  sheets: ExcelSheet[],
  name: string,
  blocks: Array<ExcelChartBlock | null | undefined>,
): void {
  const sheet = buildNativeChartSheet(name, compactChartBlocks(blocks));
  if (sheet) sheets.push(sheet);
}

function genderTrendChart(
  title: string,
  points: GenderTrendPoint[],
  femaleLabel: string,
  maleLabel: string,
  options: {
    showNrw?: boolean;
    showWeiblich?: boolean;
    showMaennlich?: boolean;
    percent?: boolean;
  } = {},
): ExcelChartBlock | null {
  if (points.length === 0) return null;
  const showWeiblich = options.showWeiblich ?? true;
  const showMaennlich = options.showMaennlich ?? true;
  const showSumme = showWeiblich && showMaennlich;
  const series: ExcelChartBlock['series'] = [];
  if (showWeiblich) {
    series.push({
      name: femaleLabel,
      values: points.map((point) => point.weiblich),
      color: GENDER_CHART_COLORS.weiblich,
    });
  }
  if (showMaennlich) {
    series.push({
      name: maleLabel,
      values: points.map((point) => point.maennlich),
      color: GENDER_CHART_COLORS.maennlich,
    });
  }
  if (showSumme) {
    series.push({
      name: 'Summe',
      values: points.map((point) => point.summe),
      color: GENDER_CHART_COLORS.summe,
    });
  }
  if (options.showNrw) {
    if (showWeiblich) {
      series.push({
        name: `${femaleLabel} (NRW-Ø)`,
        values: points.map((point) => point.weiblichNrw ?? 0),
        color: GENDER_CHART_COLORS.weiblich,
        dashed: true,
      });
    }
    if (showMaennlich) {
      series.push({
        name: `${maleLabel} (NRW-Ø)`,
        values: points.map((point) => point.maennlichNrw ?? 0),
        color: GENDER_CHART_COLORS.maennlich,
        dashed: true,
      });
    }
    if (showSumme) {
      series.push({
        name: 'Summe (NRW-Ø)',
        values: points.map((point) => point.summeNrw ?? 0),
        color: GENDER_CHART_COLORS.summe,
        dashed: true,
      });
    }
  }
  return {
    title,
    type: 'line',
    categories: points.map((point) => point.label),
    series,
    percent: options.percent,
  };
}

function categoryTrendChart(
  title: string,
  group: CategoryChartGroup,
  data: CategoryTrendPoint[],
  showNrw: boolean,
  percent = false,
): ExcelChartBlock | null {
  if (data.length === 0 || group.series.length === 0) return null;
  const hasLeadingSumme = group.series[0]?.isSumme === true;
  const series: ExcelChartBlock['series'] = [];
  group.series.forEach((item, index) => {
    const color = item.isSumme
      ? GENDER_CHART_COLORS.weiblich
      : (CATEGORY_CHART_COLORS[hasLeadingSumme ? index - 1 : index] ?? '64748B');
    series.push({
      name: item.label,
      values: data.map((point) => Number(point[item.key] ?? 0)),
      color,
    });
  });
  if (showNrw) {
    group.series.forEach((item, index) => {
      const color = item.isSumme
        ? GENDER_CHART_COLORS.weiblich
        : (CATEGORY_CHART_COLORS[hasLeadingSumme ? index - 1 : index] ?? '64748B');
      series.push({
        name: `${item.label} (NRW-Ø)`,
        values: data.map((point) => Number(point[`${item.key}${NRW_SERIES_SUFFIX}`] ?? 0)),
        color,
        dashed: true,
      });
    });
  }
  return {
    title,
    type: 'line',
    categories: data.map((point) => point.label),
    series,
    percent,
  };
}

function genderQuarterHeaders(labels: { current: string; previous: string; yearAgo: string }, showNrw: boolean): string[] {
  return [
    `Aktuelles Quartal (${labels.current})`,
    `Letztes Quartal (${labels.previous})`,
    `Vorjahresquartal (${labels.yearAgo})`,
    '% zum letzten Q.',
    '% zum Vorjahres-Q.',
    ...(showNrw ? [`NRW-Ø (${labels.current})`, '% zu NRW-Ø'] : []),
  ];
}

function genderYearHeaders(labels: { current: string; previous: string }, showNrw: boolean, shareLabel: string): string[] {
  return [
    `Aktuelles Jahr (${labels.current})`,
    `Vorjahr (${labels.previous})`,
    shareLabel,
    '% zum Vorjahr',
    ...(showNrw ? [`NRW-Ø (${labels.current})`, '% zu NRW-Ø'] : []),
  ];
}

function quarterMetricCells(metric: QuarterMetric, showNrw: boolean, theme: ExcelTheme, sum: boolean): StyledCell[] {
  return [
    C.int(metric.current, { theme, sum }),
    C.int(metric.previous, { theme, sum }),
    C.int(metric.yearAgo, { theme, sum }),
    C.pct(metric.changePrev, { theme, sum }),
    C.pct(metric.changeYearAgo, { theme, sum }),
    ...(showNrw ? [C.int(metric.nrwCurrent, { theme, sum }), C.pct(metric.vsNrw ?? null, { theme, sum })] : []),
  ];
}

function yearMetricCells(metric: YearMetric, showNrw: boolean, theme: ExcelTheme, sum: boolean): StyledCell[] {
  return [
    C.int(metric.current, { theme, sum }),
    C.int(metric.previous, { theme, sum }),
    C.pct(metric.share, { theme, sum }),
    C.pct(metric.changePrev, { theme, sum }),
    ...(showNrw ? [C.int(metric.nrwCurrent, { theme, sum }), C.pct(metric.vsNrw ?? null, { theme, sum })] : []),
  ];
}

function bothCurrentCells(
  value: number,
  nrw: number | undefined,
  vsNrw: number | null | undefined,
  showNrw: boolean,
  theme: ExcelTheme,
  sum: boolean,
  asPercent: boolean,
): StyledCell[] {
  const current = asPercent ? C.pct(value, { theme, sum }) : C.int(value, { theme, sum });
  if (!showNrw) return [current];
  return [
    current,
    asPercent ? C.pct(nrw, { theme, sum }) : C.int(nrw, { theme, sum }),
    C.pct(vsNrw ?? null, { theme, sum }),
  ];
}

export function exportSchulteilnehmendeExcel(input: {
  meta: ReportExcelMeta;
  showNrwComparison: boolean;
  sections: Array<{
    ageLabel: string;
    femaleLabel: string;
    maleLabel: string;
    quarter: { rows: SchulteilnehmendeQuarterRow[]; labels: QuarterTableColumnLabels };
    year: { rows: SchulteilnehmendeYearRow[]; labels: YearTableColumnLabels } | null;
    trends: { quarters: GenderTrendPoint[]; months: GenderTrendPoint[]; years: GenderTrendPoint[] };
    categoryCharts: Array<{ title: string; group: CategoryChartGroup; data: CategoryTrendPoint[] }>;
  }>;
}): void {
  const sheets: ExcelSheet[] = [
    overviewSheet(input.meta, [
      'Die Tabellen entsprechen der Berichtsvorschau (Quartal grün/Petrol, Jahr blau/Nachtblau).',
      'Prozentwerte sind Prozentpunkte (z. B. 12,5 %). Negative Veränderungen sind rot markiert.',
      'Native Excel-Diagramme stehen auf den Blättern „Diag …“ (gleiche Zeitreihen wie in der Vorschau).',
      input.showNrwComparison
        ? 'JVA-Bericht: zusätzliche Spalten NRW-Ø und % zu NRW-Ø; gestrichelte Diagrammlinien = NRW-Ø.'
        : 'Landesweite Auswertung ohne NRW-Vergleichsspalten.',
    ]),
  ];

  for (const section of input.sections) {
    pushChartSheet(sheets, `Diag ${section.ageLabel}`, [
      genderTrendChart(
        `Summe Teilnehmende an allen Maßnahmen — letzte 5 Quartale (${section.ageLabel})`,
        section.trends.quarters,
        section.femaleLabel,
        section.maleLabel,
        { showNrw: input.showNrwComparison },
      ),
      genderTrendChart(
        `Summe Teilnehmende an allen Maßnahmen — letzte 13 Monate (${section.ageLabel})`,
        section.trends.months,
        section.femaleLabel,
        section.maleLabel,
        { showNrw: input.showNrwComparison },
      ),
      genderTrendChart(
        `Summe Teilnehmende an allen Maßnahmen — letzte 11 Jahre (${section.ageLabel})`,
        section.trends.years,
        section.femaleLabel,
        section.maleLabel,
        { showNrw: input.showNrwComparison },
      ),
      ...section.categoryCharts.map((chart) =>
        categoryTrendChart(chart.title, chart.group, chart.data, input.showNrwComparison),
      ),
    ]);
  }

  for (const section of input.sections) {
    const quarterTheme: ExcelTheme = 'quarter';
    const quarterHeader = buildGroupedHeader(
      ['Hauptkategorie', 'Maßnahmenkategorie'],
      [
        {
          title: 'Teilnehmende — Weibliche Gefangene',
          columns: genderQuarterHeaders(section.quarter.labels, input.showNrwComparison),
        },
        {
          title: 'Teilnehmende — Männliche Gefangene',
          columns: genderQuarterHeaders(section.quarter.labels, input.showNrwComparison),
        },
      ],
      quarterTheme,
      0,
    );
    sheets.push(
      finishSheet(
        `Q ${section.ageLabel}`,
        input.meta,
        `Teilnehmende – ${section.ageLabel} (Quartalsdaten)`,
        quarterHeader.rows,
        quarterHeader.merges,
        section.quarter.rows.map((row) => [
          C.label(row.categoryLabel, { theme: quarterTheme, sum: row.isCategorySum }),
          C.label(row.courseTypeLabel, { theme: quarterTheme, sum: row.isCategorySum }),
          ...quarterMetricCells(row.weiblich, input.showNrwComparison, quarterTheme, row.isCategorySum),
          ...quarterMetricCells(row.maennlich, input.showNrwComparison, quarterTheme, row.isCategorySum),
        ]),
      ),
    );

    if (!section.year) continue;
    const yearTheme: ExcelTheme = 'year';
    const yearHeader = buildGroupedHeader(
      ['Hauptkategorie', 'Maßnahmenkategorie'],
      [
        {
          title: 'Teilnehmende — Weibliche Gefangene',
          columns: genderYearHeaders(section.year.labels, input.showNrwComparison, `%-Anteil ${section.year.labels.current}`),
        },
        {
          title: 'Teilnehmende — Männliche Gefangene',
          columns: genderYearHeaders(section.year.labels, input.showNrwComparison, `%-Anteil ${section.year.labels.current}`),
        },
      ],
      yearTheme,
      0,
    );
    sheets.push(
      finishSheet(
        `Jahr ${section.ageLabel}`,
        input.meta,
        `Teilnehmende – ${section.ageLabel} (Jahresdaten)`,
        yearHeader.rows,
        yearHeader.merges,
        section.year.rows.map((row) => [
          C.label(row.categoryLabel, { theme: yearTheme, sum: row.isCategorySum }),
          C.label(row.courseTypeLabel, { theme: yearTheme, sum: row.isCategorySum }),
          ...yearMetricCells(row.weiblich, input.showNrwComparison, yearTheme, row.isCategorySum),
          ...yearMetricCells(row.maennlich, input.showNrwComparison, yearTheme, row.isCategorySum),
        ]),
      ),
    );
  }

  writeStyledWorkbook(sheets, buildExcelFilename(input.meta.filenameBase));
}

function utilizationQuarterOccupancyHeaders(
  labels: UtilizationQuarterLabels,
  showNrw: boolean,
): string[] {
  return [
    `Aktuelles Quartal (${labels.current})`,
    `Letztes Quartal (${labels.previous})`,
    `Vorjahresquartal (${labels.yearAgo})`,
    '% zum letzten Q.',
    '% zum Vorjahres-Q.',
    ...(showNrw ? [`NRW-Ø (${labels.current})`, '% zu NRW-Ø'] : []),
  ];
}

export function exportAuslastungsquoteExcel(input: {
  meta: ReportExcelMeta;
  showNrwComparison: boolean;
  sections: Array<{
    ageLabel: string;
    femaleLabel: string;
    maleLabel: string;
    quarter: { rows: UtilizationQuarterRow[]; labels: UtilizationQuarterLabels };
    year: { rows: UtilizationYearRow[]; labels: UtilizationYearLabels } | null;
    trends: { quarters: GenderTrendPoint[]; months: GenderTrendPoint[]; years: GenderTrendPoint[] };
    categoryGroup: CategoryChartGroup;
    categoryCharts: Array<{ title: string; data: CategoryTrendPoint[] }>;
  }>;
}): void {
  const sheets: ExcelSheet[] = [
    overviewSheet(input.meta, [
      'Auslastung = Teilnehmende / Soll-Plätze, ausgewiesen in Prozentpunkten.',
      'Negative Veränderungen (Quote oder Soll-Plätze) sind rot markiert.',
      'Native Excel-Diagramme stehen auf den Blättern „Diag …“ (gleiche Zeitreihen wie in der Vorschau).',
    ]),
  ];

  for (const section of input.sections) {
    pushChartSheet(sheets, `Diag ${section.ageLabel}`, [
      genderTrendChart(
        `Auslastungsquote aller Maßnahmen — letzte 5 Quartale (${section.ageLabel})`,
        section.trends.quarters,
        section.femaleLabel,
        section.maleLabel,
        { showNrw: input.showNrwComparison, percent: true },
      ),
      genderTrendChart(
        `Auslastungsquote aller Maßnahmen — letzte 13 Monate (${section.ageLabel})`,
        section.trends.months,
        section.femaleLabel,
        section.maleLabel,
        { showNrw: input.showNrwComparison, percent: true },
      ),
      genderTrendChart(
        `Auslastungsquote aller Maßnahmen — letzte 11 Jahre (${section.ageLabel})`,
        section.trends.years,
        section.femaleLabel,
        section.maleLabel,
        { showNrw: input.showNrwComparison, percent: true },
      ),
      ...section.categoryCharts.map((chart) =>
        categoryTrendChart(chart.title, section.categoryGroup, chart.data, input.showNrwComparison, true),
      ),
    ]);
  }

  for (const section of input.sections) {
    const quarterTheme: ExcelTheme = 'quarter';
    const bothQuarter = input.showNrwComparison
      ? [
          `Aktuelles Quartal (${section.quarter.labels.current})`,
          `NRW-Ø (${section.quarter.labels.current})`,
          '% zu NRW-Ø',
        ]
      : [`Aktuelles Quartal (${section.quarter.labels.current})`];
    const quarterHeader = buildGroupedHeader(
      ['Hauptkategorie', 'Maßnahmenkategorie'],
      [
        { title: 'Auslastungsquote beide Geschlechter', columns: bothQuarter },
        {
          title: 'Auslastungsquote — Weibliche Gefangene',
          columns: utilizationQuarterOccupancyHeaders(section.quarter.labels, input.showNrwComparison),
        },
        {
          title: 'Soll-Plätze — Weibliche Gefangene',
          columns: [
            `Aktuelles Quartal (${section.quarter.labels.current})`,
            `Vorjahresquartal (${section.quarter.labels.yearAgo})`,
            'Veränderung zum Vorjahres-Q.',
          ],
        },
        {
          title: 'Auslastungsquote — Männliche Gefangene',
          columns: utilizationQuarterOccupancyHeaders(section.quarter.labels, input.showNrwComparison),
        },
        {
          title: 'Soll-Plätze — Männliche Gefangene',
          columns: [
            `Aktuelles Quartal (${section.quarter.labels.current})`,
            `Vorjahresquartal (${section.quarter.labels.yearAgo})`,
            'Veränderung zum Vorjahres-Q.',
          ],
        },
      ],
      quarterTheme,
      0,
    );
    sheets.push(
      finishSheet(
        `Q ${section.ageLabel}`,
        input.meta,
        `Auslastungsquote – ${section.ageLabel} (Quartalsdaten)`,
        quarterHeader.rows,
        quarterHeader.merges,
        section.quarter.rows.map((row) => {
          const sum = row.isCategorySum;
          const genders = [row.weiblich, row.maennlich];
          return [
            C.label(row.categoryLabel, { theme: quarterTheme, sum }),
            C.label(row.courseTypeLabel, { theme: quarterTheme, sum }),
            ...bothCurrentCells(
              row.occupancyBoth,
              row.occupancyBothNrw,
              row.occupancyBothVsNrw,
              input.showNrwComparison,
              quarterTheme,
              sum,
              true,
            ),
            ...genders.flatMap((metric) => [
              C.pct(metric.occupancyCurrent, { theme: quarterTheme, sum }),
              C.pct(metric.occupancyPrevious, { theme: quarterTheme, sum }),
              C.pct(metric.occupancyYearAgo, { theme: quarterTheme, sum }),
              C.pct(metric.occupancyChangePrev, { theme: quarterTheme, sum }),
              C.pct(metric.occupancyChangeYearAgo, { theme: quarterTheme, sum }),
              ...(input.showNrwComparison
                ? [
                    C.pct(metric.occupancyNrw, { theme: quarterTheme, sum }),
                    C.pct(metric.occupancyVsNrw ?? null, { theme: quarterTheme, sum }),
                  ]
                : []),
              C.int(metric.placesCurrent, { theme: quarterTheme, sum }),
              C.int(metric.placesYearAgo, { theme: quarterTheme, sum }),
              C.int(metric.placesChangeYearAgo, { theme: quarterTheme, sum, signed: true }),
            ]),
          ];
        }),
      ),
    );

    if (!section.year) continue;
    const yearTheme: ExcelTheme = 'year';
    const occupancyYearCols = [
      `Aktuelles Jahr (${section.year.labels.current})`,
      `Letztes Jahr (${section.year.labels.previous})`,
      '% zum Vorjahr',
      ...(input.showNrwComparison
        ? [`NRW-Ø (${section.year.labels.current})`, '% zu NRW-Ø']
        : []),
    ];
    const placesYearCols = [
      `Aktuelles Jahr (${section.year.labels.current})`,
      `Letztes Jahr (${section.year.labels.previous})`,
      'Veränderung der Soll-Plätze',
    ];
    const bothYear = input.showNrwComparison
      ? [
          `Aktuelles Jahr (${section.year.labels.current})`,
          `NRW-Ø (${section.year.labels.current})`,
          '% zu NRW-Ø',
        ]
      : [`Auslastungsquote beide Geschlechter im aktuellen Jahr (${section.year.labels.current})`];
    const yearHeader = input.showNrwComparison
      ? buildGroupedHeader(
          ['Hauptkategorie', 'Maßnahmenkategorie'],
          [
            { title: `Auslastungsquote beide Geschlechter im aktuellen Jahr (${section.year.labels.current})`, columns: bothYear },
            { title: 'Auslastungsquote — Weibliche Gefangene', columns: occupancyYearCols },
            { title: 'Soll-Plätze — Weibliche Gefangene', columns: placesYearCols },
            { title: 'Auslastungsquote — Männliche Gefangene', columns: occupancyYearCols },
            { title: 'Soll-Plätze — Männliche Gefangene', columns: placesYearCols },
          ],
          yearTheme,
          0,
        )
      : buildGroupedHeader(
          ['Hauptkategorie', 'Maßnahmenkategorie', bothYear[0]],
          [
            { title: 'Auslastungsquote — Weibliche Gefangene', columns: occupancyYearCols },
            { title: 'Soll-Plätze — Weibliche Gefangene', columns: placesYearCols },
            { title: 'Auslastungsquote — Männliche Gefangene', columns: occupancyYearCols },
            { title: 'Soll-Plätze — Männliche Gefangene', columns: placesYearCols },
          ],
          yearTheme,
          0,
        );
    sheets.push(
      finishSheet(
        `Jahr ${section.ageLabel}`,
        input.meta,
        `Auslastungsquote – ${section.ageLabel} (Jahresdaten)`,
        yearHeader.rows,
        yearHeader.merges,
        section.year.rows.map((row) => {
          const sum = row.isCategorySum;
          const genders = [row.weiblich, row.maennlich];
          return [
            C.label(row.categoryLabel, { theme: yearTheme, sum }),
            C.label(row.courseTypeLabel, { theme: yearTheme, sum }),
            ...bothCurrentCells(
              row.occupancyBoth,
              row.occupancyBothNrw,
              row.occupancyBothVsNrw,
              input.showNrwComparison,
              yearTheme,
              sum,
              true,
            ),
            ...genders.flatMap((metric) => [
              C.pct(metric.occupancyCurrent, { theme: yearTheme, sum }),
              C.pct(metric.occupancyPrevious, { theme: yearTheme, sum }),
              C.pct(metric.occupancyChangePrev, { theme: yearTheme, sum }),
              ...(input.showNrwComparison
                ? [
                    C.pct(metric.occupancyNrw, { theme: yearTheme, sum }),
                    C.pct(metric.occupancyVsNrw ?? null, { theme: yearTheme, sum }),
                  ]
                : []),
              C.int(metric.placesCurrent, { theme: yearTheme, sum }),
              C.int(metric.placesPrevious, { theme: yearTheme, sum }),
              C.int(metric.placesChangePrev, { theme: yearTheme, sum, signed: true }),
            ]),
          ];
        }),
      ),
    );
  }

  writeStyledWorkbook(sheets, buildExcelFilename(input.meta.filenameBase));
}

export function exportBeendigungsgruendeExcel(input: {
  meta: ReportExcelMeta;
  showNrwComparison: boolean;
  freeTextYear: number | null;
  freeTextEntries: TerminationFreeTextEntry[];
  sections: Array<{
    ageLabel: string;
    showWeiblich: boolean;
    showMaennlich: boolean;
    quarter: { rows: TerminationQuarterRow[]; labels: TerminationQuarterLabels };
    year: { rows: TerminationYearRow[]; labels: TerminationYearLabels } | null;
    overviewGroup: CategoryChartGroup;
    overview: { quarters: CategoryTrendPoint[]; months: CategoryTrendPoint[]; years: CategoryTrendPoint[] };
    reasonCharts: Array<{ title: string; group: CategoryChartGroup; data: CategoryTrendPoint[] }>;
  }>;
}): void {
  const sheets: ExcelSheet[] = [
    overviewSheet(input.meta, [
      'Quartalstabellen: relative Veränderungen in Prozentpunkten. Jahrestabellen: absolute Veränderung.',
      'Negative Werte sind rot markiert. Summenzeilen je Beendigungsart sind hervorgehoben.',
      'Native Excel-Diagramme stehen auf den Blättern „Diag …“ (gleiche Zeitreihen wie in der Vorschau).',
    ]),
  ];

  for (const section of input.sections) {
    pushChartSheet(sheets, `Diag ${section.ageLabel}`, [
      categoryTrendChart(
        `Beendigung aller Maßnahmen — letzte 5 Quartale (${section.ageLabel})`,
        section.overviewGroup,
        section.overview.quarters,
        input.showNrwComparison,
      ),
      categoryTrendChart(
        `Beendigung aller Maßnahmen — letzte 13 Monate (${section.ageLabel})`,
        section.overviewGroup,
        section.overview.months,
        input.showNrwComparison,
      ),
      categoryTrendChart(
        `Beendigung aller Maßnahmen — letzte 11 Jahre (${section.ageLabel})`,
        section.overviewGroup,
        section.overview.years,
        input.showNrwComparison,
      ),
      ...section.reasonCharts.map((chart) =>
        categoryTrendChart(chart.title, chart.group, chart.data, input.showNrwComparison),
      ),
    ]);
  }

  for (const section of input.sections) {
    const visibleGenders = [
      ...(section.showWeiblich ? ([['weiblich', 'Weibliche']] as const) : []),
      ...(section.showMaennlich ? ([['männlich', 'Männliche']] as const) : []),
    ];
    const quarterTheme: ExcelTheme = 'quarter';
    const bothQuarter = input.showNrwComparison
      ? [
          `Aktuelles Quartal (${section.quarter.labels.current})`,
          `NRW-Ø (${section.quarter.labels.current})`,
          '% zu NRW-Ø',
        ]
      : [`Beendigungen beide Geschlechter im aktuellen Quartal (${section.quarter.labels.current})`];
    const quarterHeader = input.showNrwComparison
      ? buildGroupedHeader(
          ['Beendigung', 'Beendigungsgrund'],
          [
            {
              title: `Beendigungen beide Geschlechter im aktuellen Quartal (${section.quarter.labels.current})`,
              columns: bothQuarter,
            },
            ...visibleGenders.map(([, label]) => ({
              title: `Beendigungen — ${label} Gefangene`,
              columns: genderQuarterHeaders(section.quarter.labels, input.showNrwComparison),
            })),
          ],
          quarterTheme,
          0,
        )
      : buildGroupedHeader(
          ['Beendigung', 'Beendigungsgrund', bothQuarter[0]],
          visibleGenders.map(([, label]) => ({
            title: `Beendigungen — ${label} Gefangene`,
            columns: genderQuarterHeaders(section.quarter.labels, false),
          })),
          quarterTheme,
          0,
        );
    sheets.push(
      finishSheet(
        `Q ${section.ageLabel}`,
        input.meta,
        `Beendigungen – ${section.ageLabel} (Quartalsdaten)`,
        quarterHeader.rows,
        quarterHeader.merges,
        section.quarter.rows.map((row) => {
          const sum = row.isLevelSum;
          const metrics = [
            ...(section.showWeiblich ? [row.weiblich] : []),
            ...(section.showMaennlich ? [row.maennlich] : []),
          ];
          return [
            C.label(row.levelLabel, { theme: quarterTheme, sum }),
            C.label(row.reasonLabel, { theme: quarterTheme, sum }),
            ...bothCurrentCells(
              row.both,
              row.bothNrw,
              row.bothVsNrw,
              input.showNrwComparison,
              quarterTheme,
              sum,
              false,
            ),
            ...metrics.flatMap((metric) => quarterMetricCells(metric, input.showNrwComparison, quarterTheme, sum)),
          ];
        }),
      ),
    );

    if (!section.year) continue;
    const yearTheme: ExcelTheme = 'year';
    const yearGenderCols = [
      `Aktuelles Jahr (${section.year.labels.current})`,
      `Letztes Jahr (${section.year.labels.previous})`,
      'Veränderung zum letzten Jahr',
      ...(input.showNrwComparison
        ? [`NRW-Ø (${section.year.labels.current})`, '% zu NRW-Ø']
        : []),
    ];
    const bothYear = input.showNrwComparison
      ? [
          `Aktuelles Jahr (${section.year.labels.current})`,
          `NRW-Ø (${section.year.labels.current})`,
          '% zu NRW-Ø',
        ]
      : [`Beendigungen beide Geschlechter im aktuellen Jahr (${section.year.labels.current})`];
    const yearHeader = input.showNrwComparison
      ? buildGroupedHeader(
          ['Beendigung', 'Beendigungsgrund'],
          [
            {
              title: `Beendigungen beide Geschlechter im aktuellen Jahr (${section.year.labels.current})`,
              columns: bothYear,
            },
            ...visibleGenders.map(([, label]) => ({
              title: `Beendigungen — ${label} Gefangene`,
              columns: yearGenderCols,
            })),
          ],
          yearTheme,
          0,
        )
      : buildGroupedHeader(
          ['Beendigung', 'Beendigungsgrund', bothYear[0]],
          visibleGenders.map(([, label]) => ({
            title: `Beendigungen — ${label} Gefangene`,
            columns: yearGenderCols,
          })),
          yearTheme,
          0,
        );
    sheets.push(
      finishSheet(
        `Jahr ${section.ageLabel}`,
        input.meta,
        `Beendigungen – ${section.ageLabel} (Jahresdaten)`,
        yearHeader.rows,
        yearHeader.merges,
        section.year.rows.map((row) => {
          const sum = row.isLevelSum;
          const metrics = [
            ...(section.showWeiblich ? [row.weiblich] : []),
            ...(section.showMaennlich ? [row.maennlich] : []),
          ];
          return [
            C.label(row.levelLabel, { theme: yearTheme, sum }),
            C.label(row.reasonLabel, { theme: yearTheme, sum }),
            ...bothCurrentCells(row.both, row.bothNrw, row.bothVsNrw, input.showNrwComparison, yearTheme, sum, false),
            ...metrics.flatMap((metric) => [
              C.int(metric.current, { theme: yearTheme, sum }),
              C.int(metric.previous, { theme: yearTheme, sum }),
              C.int(metric.changePrev, { theme: yearTheme, sum, signed: true }),
              ...(input.showNrwComparison
                ? [C.int(metric.nrwCurrent, { theme: yearTheme, sum }), C.pct(metric.vsNrw ?? null, { theme: yearTheme, sum })]
                : []),
            ]),
          ];
        }),
      ),
    );
  }

  if (input.freeTextYear != null) {
    const theme: ExcelTheme = 'neutral';
    const header = [[C.header('Beendigungsgrund', theme), C.header('Freitext', theme), C.header('Anzahl', theme)]];
    const body =
      input.freeTextEntries.length === 0
        ? [[C.label('Keine Freitexte im ausgewählten Jahr erfasst.', { theme }), C.text(''), C.text('')]]
        : input.freeTextEntries.map((entry) => [
            C.label(entry.reasonLabel, { theme }),
            C.text(entry.text),
            C.int(entry.count, { theme }),
          ]);
    sheets.push(
      finishSheet(
        'Freitexte',
        input.meta,
        `Freitextgründe im aktuellen Jahr (${input.freeTextYear})`,
        header,
        [],
        body,
        [],
        1,
      ),
    );
  }

  writeStyledWorkbook(sheets, buildExcelFilename(input.meta.filenameBase));
}

export function exportSchulabschluesseExcel(input: {
  meta: ReportExcelMeta;
  showNrwComparison: boolean;
  sections: Array<{
    ageLabel: string;
    femaleLabel: string;
    maleLabel: string;
    showWeiblich: boolean;
    showMaennlich: boolean;
    year: { rows: SchulabschlussYearRow[]; labels: SchulabschlussYearLabels } | null;
    genderTrend: GenderTrendPoint[];
    detailGroup: CategoryChartGroup;
    detailCharts: Array<{ title: string; data: CategoryTrendPoint[] }>;
  }>;
}): void {
  const sheets: ExcelSheet[] = [
    overviewSheet(input.meta, [
      'Jahrestabelle: aktuelles vs. Vorjahr, Anteil am jeweiligen Geschlecht, relative Veränderung.',
      'Negative Veränderungen sind rot markiert.',
      'Native Excel-Diagramme stehen auf den Blättern „Diag …“ (gleiche Zeitreihen wie in der Vorschau).',
    ]),
  ];

  for (const section of input.sections) {
    pushChartSheet(sheets, `Diag ${section.ageLabel}`, [
      genderTrendChart(
        `Erreichte Schulabschlüsse aller Abschlussarten — letzte 11 Jahre (${section.ageLabel})`,
        section.genderTrend,
        section.femaleLabel,
        section.maleLabel,
        {
          showNrw: input.showNrwComparison,
          showWeiblich: section.showWeiblich,
          showMaennlich: section.showMaennlich,
        },
      ),
      ...section.detailCharts.map((chart) =>
        categoryTrendChart(chart.title, section.detailGroup, chart.data, input.showNrwComparison),
      ),
    ]);
  }

  const theme: ExcelTheme = 'year';

  for (const section of input.sections) {
    if (!section.year) continue;
    const visibleGenders = [
      ...(section.showWeiblich ? ([['weiblich', 'Weibliche']] as const) : []),
      ...(section.showMaennlich ? ([['männlich', 'Männliche']] as const) : []),
    ];
    const genderCols = [
      `Aktuelles Jahr (${section.year.labels.current})`,
      `Letztes Jahr (${section.year.labels.previous})`,
      `Prozentualer Anteil ${section.year.labels.current}`,
      'Veränderung zum letzten Jahr',
      ...(input.showNrwComparison
        ? [`NRW-Ø (${section.year.labels.current})`, '% zu NRW-Ø']
        : []),
    ];
    const bothYear = input.showNrwComparison
      ? [
          `Aktuelles Jahr (${section.year.labels.current})`,
          `NRW-Ø (${section.year.labels.current})`,
          '% zu NRW-Ø',
        ]
      : [`Beide Geschlechter im aktuellen Jahr (${section.year.labels.current})`];
    const header = input.showNrwComparison
      ? buildGroupedHeader(
          ['Abschlussart'],
          [
            { title: `Beide Geschlechter im aktuellen Jahr (${section.year.labels.current})`, columns: bothYear },
            ...visibleGenders.map(([, label]) => ({ title: `${label} Gefangene`, columns: genderCols })),
          ],
          theme,
          0,
        )
      : buildGroupedHeader(
          ['Abschlussart', bothYear[0]],
          visibleGenders.map(([, label]) => ({ title: `${label} Gefangene`, columns: genderCols })),
          theme,
          0,
        );
    sheets.push(
      finishSheet(
        `Jahr ${section.ageLabel}`,
        input.meta,
        `Erreichte Schulabschlüsse – ${section.ageLabel} (Jahresdaten)`,
        header.rows,
        header.merges,
        section.year.rows.map((row) => {
          const sum = row.isSum;
          const metrics = [
            ...(section.showWeiblich ? [row.weiblich] : []),
            ...(section.showMaennlich ? [row.maennlich] : []),
          ];
          return [
            C.label(row.groupLabel, { theme, sum }),
            ...bothCurrentCells(row.both, row.bothNrw, row.bothVsNrw, input.showNrwComparison, theme, sum, false),
            ...metrics.flatMap((metric) => [
              C.int(metric.current, { theme, sum }),
              C.int(metric.previous, { theme, sum }),
              C.pct(metric.share, { theme, sum }),
              C.pct(metric.changePrev, { theme, sum }),
              ...(input.showNrwComparison
                ? [C.int(metric.nrwCurrent, { theme, sum }), C.pct(metric.vsNrw ?? null, { theme, sum })]
                : []),
            ]),
          ];
        }),
        [],
        1,
      ),
    );
  }

  if (sheets.length <= 1) {
    throw new Error('Keine Tabellendaten zum Excel-Export.');
  }

  writeStyledWorkbook(sheets, buildExcelFilename(input.meta.filenameBase));
}

export function exportKursangeboteExcel(input: {
  meta: ReportExcelMeta;
  year: number;
  showExternalColumn: boolean;
  sections: KursangebotJvaSection[];
}): void {
  const theme: ExcelTheme = 'neutral';
  const headers = [
    C.header('JVA', theme),
    C.header('Geschlecht', theme),
    C.header('Altersgruppe', theme),
    C.header('Hauptkategorie', theme),
    C.header('Maßnahmenkategorie', theme),
    C.header('Name Kurs', theme),
    C.header('SOLL-Plätze', theme),
    C.header('Dauer der Maßnahme in Monaten', theme),
    C.header('Beginn der Maßnahme', theme),
    C.header('Vorgesehener Abschluss', theme),
    ...(input.showExternalColumn ? [C.header('Durchführung durch externe Kraft', theme)] : []),
  ];
  const body: StyledCell[][] = [];
  for (const section of input.sections) {
    for (const table of section.tables) {
      if (table.rows.length === 0) continue;
      for (const row of table.rows) {
        body.push([
          C.label(section.jvaName, { theme }),
          C.label(table.genderPhrase, { theme }),
          C.label(table.agePhrase, { theme }),
          C.label(row.categoryLabel, { theme }),
          C.label(row.typeLabel, { theme }),
          C.text(row.courseName, { color: 'basis' }),
          C.int(row.targetPlaces, { theme, color: 'basis' }),
          C.int(row.durationMonths, { theme, color: 'web' }),
          C.text(row.startLabel, { color: 'web' }),
          C.text(row.intendedQualification, { color: 'web' }),
          ...(input.showExternalColumn
            ? [
                row.externalStaff
                  ? C.text('X', { color: 'external' })
                  : { v: '', t: 's' as const, role: 'data' as const, color: 'external' as const },
              ]
            : []),
        ]);
      }
    }
  }

  if (body.length === 0) {
    throw new Error('Keine Kursangebote zum Excel-Export.');
  }

  writeStyledWorkbook(
    [
      overviewSheet(input.meta, [
        `Jährliche Übersicht der aktiven schulischen Kursangebote, Stand ${input.year}.`,
        'Blau: BASIS (Kursname, SOLL-Plätze). Grün: jährliche Web-Erfassung (Dauer, Beginn, Abschluss).',
        input.showExternalColumn
          ? 'Spalte „Durchführung durch externe Kraft“ nur für JM, FB Päd. und ZBI.'
          : 'Spalte zur externen Kraft ist in dieser Rolle ausgeblendet.',
        'Native Excel-Diagramme: SOLL-Plätze je Anstalt und je Hauptkategorie.',
      ]),
      ...( () => {
        const categoryTotals = new Map<string, { label: string; value: number }>();
        for (const section of input.sections) {
          for (const table of section.tables) {
            for (const row of table.rows) {
              const current = categoryTotals.get(row.categoryKey) ?? { label: row.categoryLabel, value: 0 };
              current.value += row.targetPlaces ?? 0;
              categoryTotals.set(row.categoryKey, current);
            }
          }
        }
        const categories = [...categoryTotals.values()];
        const sheet = buildNativeChartSheet('Diagramme', [
          {
            title: 'SOLL-Plätze je Anstalt',
            type: 'col',
            categories: input.sections.map((section) => section.jvaName),
            series: [
              {
                name: 'SOLL-Plätze',
                color: '003064',
                values: input.sections.map((section) =>
                  section.tables.reduce(
                    (sum, table) =>
                      sum + table.rows.reduce((rowSum, row) => rowSum + (row.targetPlaces ?? 0), 0),
                    0,
                  ),
                ),
              },
            ],
          },
          {
            title: 'SOLL-Plätze je Hauptkategorie',
            type: 'col',
            categories: categories.map((item) => item.label),
            series: [{ name: 'SOLL-Plätze', color: '175E54', values: categories.map((item) => item.value) }],
          },
        ]);
        return sheet ? [sheet] : [];
      })(),
      finishSheet(
        'Kursangebote',
        input.meta,
        `Schulisches Bildungsangebot · Stand ${input.year}`,
        [headers],
        [],
        body,
        [],
        3,
      ),
    ],
    buildExcelFilename(input.meta.filenameBase),
  );
}

export function exportSollplatzVeraenderungExcel(input: {
  meta: ReportExcelMeta;
  table: SollplatzVeraenderungTable;
}): void {
  const theme: ExcelTheme = 'neutral';
  const headers = [
    [
      C.header('JVA', theme),
      C.header('Hauptkategorie', theme),
      C.header('Maßnahmenkategorie', theme),
      C.header('Name Kurs', theme),
      C.header('Soll-Plätze Vormonat', theme),
      C.header('Soll-Plätze aktueller Monat', theme),
      C.header('Veränderung Soll-Plätze', theme),
      C.header('Kennzeichnung', theme),
    ],
  ];
  const kindLabel = {
    unchanged: 'unverändert',
    changed: 'verändert',
    new: 'neu eingerichtet',
  } as const;
  const kindColor = {
    unchanged: undefined,
    changed: 'changed' as const,
    new: 'new' as const,
  };
  const body = [
    ...input.table.rows.map((row) => {
      const color = kindColor[row.kind];
      return [
        C.label(row.jvaName, { theme }),
        C.text(row.categoryLabel, { color }),
        C.text(row.typeLabel, { color }),
        C.text(row.courseName, { color }),
        C.int(row.previousPlaces, { theme, color }),
        C.int(row.currentPlaces, { theme, color }),
        C.int(row.change, { theme, signed: true, color }),
        C.text(kindLabel[row.kind], { color }),
      ];
    }),
    [
      C.label('Gesamtsumme', { theme, sum: true }),
      C.label('', { theme, sum: true }),
      C.label('', { theme, sum: true }),
      C.label('', { theme, sum: true }),
      C.int(input.table.totals.previousPlaces, { theme, sum: true }),
      C.int(input.table.totals.currentPlaces, { theme, sum: true }),
      C.int(input.table.totals.change, { theme, sum: true, signed: true }),
      C.label('', { theme, sum: true }),
    ],
  ];

  writeStyledWorkbook(
    [
      overviewSheet(input.meta, [
        `Vergleich ${input.table.previousMonthLabel} → ${input.table.currentMonthLabel}.`,
        'Rot: veränderte Soll-Plätze. Grün: neu eingerichteter Kurs. Schwarz: keine Veränderung.',
        'Native Excel-Diagramme: Soll-Plätze und Veränderung je Anstalt.',
      ]),
      ...( () => {
        const byJva = new Map<string, { previous: number; current: number; change: number }>();
        for (const row of input.table.rows) {
          const current = byJva.get(row.jvaName) ?? { previous: 0, current: 0, change: 0 };
          current.previous += row.previousPlaces;
          current.current += row.currentPlaces;
          current.change += row.change;
          byJva.set(row.jvaName, current);
        }
        const names = [...byJva.keys()];
        const sheet = buildNativeChartSheet('Diagramme', [
          {
            title: `Soll-Plätze je Anstalt (${input.table.previousMonthLabel} vs. ${input.table.currentMonthLabel})`,
            type: 'col',
            categories: names,
            series: [
              {
                name: `Vormonat (${input.table.previousMonthLabel})`,
                color: '175E54',
                values: names.map((name) => byJva.get(name)?.previous ?? 0),
              },
              {
                name: `Aktuell (${input.table.currentMonthLabel})`,
                color: '003064',
                values: names.map((name) => byJva.get(name)?.current ?? 0),
              },
            ],
          },
          {
            title: 'Veränderung der Soll-Plätze je Anstalt',
            type: 'col',
            categories: names,
            series: [
              {
                name: 'Veränderung',
                color: 'C40016',
                values: names.map((name) => byJva.get(name)?.change ?? 0),
              },
            ],
          },
        ]);
        return sheet ? [sheet] : [];
      })(),
      finishSheet(
        'Soll-Plätze',
        input.meta,
        `Veränderung der Schulkurse und deren Soll-Plätze (${input.table.previousMonthLabel} → ${input.table.currentMonthLabel})`,
        headers,
        [],
        body,
        [],
        1,
      ),
    ],
    buildExcelFilename(input.meta.filenameBase),
  );
}

export function exportSchulraeumeExcel(input: {
  meta: ReportExcelMeta;
  year: number;
  table: SchulraumTable;
}): void {
  const theme: ExcelTheme = 'neutral';
  const headers = [
    [
      C.header('JVA', theme),
      C.header('Raumbezeichnung', theme),
      C.header('Anzahl Räume', theme),
      C.header('Größe in qm', theme),
      C.header('eLis (1 = ja, 0 = nein)', theme),
      C.header('Anzahl Schulplätze für Gefangene', theme),
    ],
  ];
  const body = input.table.rows.map((row) => {
    const sum = row.kind !== 'room';
    return [
      C.label(row.kind === 'room' ? row.jvaName : '', { theme, sum }),
      C.label(row.designation, { theme, sum }),
      C.int(row.roomCount, { theme, sum }),
      C.decimal(row.squareMeters, { theme, sum }),
      C.int(row.elisFlag, { theme, sum }),
      C.int(row.schoolSeats, { theme, sum }),
    ];
  });

  writeStyledWorkbook(
    [
      overviewSheet(input.meta, [
        `Jährliche Übersicht der Schulräume, Stand ${input.year}.`,
        'Spalte eLis: 1 = ja, 0 = nein. Summenzeilen je JVA und Gesamtsumme sind hervorgehoben.',
        'Native Excel-Diagramme: Schulplätze und Räume je Anstalt.',
      ]),
      ...( () => {
        const sums = input.table.rows.filter((row) => row.kind === 'jva-sum');
        const sheet = buildNativeChartSheet('Diagramme', [
          {
            title: 'Schulplätze für Gefangene je Anstalt',
            type: 'col',
            categories: sums.map((row) => row.jvaName),
            series: [{ name: 'Schulplätze', color: '003064', values: sums.map((row) => row.schoolSeats) }],
          },
          {
            title: 'Anzahl Räume je Anstalt',
            type: 'col',
            categories: sums.map((row) => row.jvaName),
            series: [{ name: 'Räume', color: '175E54', values: sums.map((row) => row.roomCount) }],
          },
        ]);
        return sheet ? [sheet] : [];
      })(),
      finishSheet(
        'Schulräume',
        input.meta,
        'Übersicht der Schulräume',
        headers,
        [],
        body,
        [],
        1,
      ),
    ],
    buildExcelFilename(input.meta.filenameBase),
  );
}

export function exportStellenExcel(input: {
  meta: ReportExcelMeta;
  table: StellenTable;
}): void {
  const theme: ExcelTheme = 'neutral';
  const headers = [
    [C.header('JVA', theme), C.header('Anzahl Stellen', theme), C.header('davon besetzt', theme)],
  ];
  const body = [
    ...input.table.rows.map((row) => [
      C.label(row.jvaName, { theme }),
      C.int(row.stellen, { theme }),
      C.int(row.besetzt, { theme }),
    ]),
    [
      C.label('Summe', { theme, sum: true }),
      C.int(input.table.totals.stellen, { theme, sum: true }),
      C.int(input.table.totals.besetzt, { theme, sum: true }),
    ],
  ];

  writeStyledWorkbook(
    [
      overviewSheet(input.meta, [
        'Übersicht der Stellen im pädagogischen Dienst je Anstalt.',
        `Datenstand ${periodLabel(input.table.period)}.`,
        'Native Excel-Diagramm: Stellen und Besetzung je Anstalt.',
      ]),
      ...( () => {
        const sheet = buildNativeChartSheet('Diagramme', [
          {
            title: 'Stellen pädagogischer Dienst je Anstalt',
            type: 'col',
            categories: input.table.rows.map((row) => row.jvaName),
            series: [
              { name: 'Anzahl Stellen', color: '003064', values: input.table.rows.map((row) => row.stellen) },
              { name: 'davon besetzt', color: '007A2E', values: input.table.rows.map((row) => row.besetzt) },
            ],
          },
        ]);
        return sheet ? [sheet] : [];
      })(),
      finishSheet(
        'Stellen',
        input.meta,
        'Stellen pädagogischer Dienst',
        headers,
        [],
        body,
        [],
        1,
      ),
    ],
    buildExcelFilename(input.meta.filenameBase),
  );
}
