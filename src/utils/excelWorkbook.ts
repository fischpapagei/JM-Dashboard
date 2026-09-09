import XLSX from 'xlsx-js-style';
import { injectNativeExcelCharts, type ExcelNativeChart } from './excelCharts';

const FONT = 'Calibri';
const NACHTBLAU = '003064';
const PETROL = '175E54';
const SLATE = '334155';
const MUTED = '94A3B8';
const WHITE = 'FFFFFF';
const INK = '0F172A';
const RED = 'E2001A';
const GREEN = '009036';
const SKY = '0369A1';
const VIOLET = '5B21B6';
const QUARTER_SUM = 'ECFDF5';
const YEAR_SUM = 'F0F9FF';
const NEUTRAL_SUM = 'E2E8F0';
const STRIPE = 'F8FAFC';
const EXTERNAL_FILL = 'EDE9FE';
const BORDER = 'CBD5E1';

export type ExcelTheme = 'quarter' | 'year' | 'neutral';

export type ExcelCellColor =
  | 'negative'
  | 'positive'
  | 'changed'
  | 'new'
  | 'basis'
  | 'web'
  | 'external'
  | 'muted';

export interface StyledCell {
  v: string | number | null;
  t?: 's' | 'n';
  z?: string;
  role?: 'title' | 'subtitle' | 'metaLabel' | 'metaValue' | 'header' | 'headerGroup' | 'label' | 'data' | 'sum' | 'note';
  theme?: ExcelTheme;
  color?: ExcelCellColor;
  wrap?: boolean;
}

export interface ExcelSheet {
  name: string;
  rows: StyledCell[][];
  merges?: XLSX.Range[];
  freezeRows?: number;
  freezeCols?: number;
  charts?: ExcelNativeChart[];
}

export interface ExcelChartSeriesValues {
  name: string;
  values: Array<number | null | undefined>;
  color: string;
  dashed?: boolean;
}

export interface ExcelChartBlock {
  title: string;
  type: 'line' | 'col';
  categories: string[];
  series: ExcelChartSeriesValues[];
  percent?: boolean;
}

type CellStyle = {
  font?: { name?: string; bold?: boolean; sz?: number; color?: { rgb: string } };
  fill?: { patternType: 'solid'; fgColor: { rgb: string } };
  alignment?: { horizontal?: 'left' | 'center' | 'right'; vertical?: 'center'; wrapText?: boolean };
  border?: Record<'top' | 'bottom' | 'left' | 'right', { style: 'thin'; color: { rgb: string } }>;
  numFmt?: string;
};

const THIN_BORDER = {
  top: { style: 'thin' as const, color: { rgb: BORDER } },
  bottom: { style: 'thin' as const, color: { rgb: BORDER } },
  left: { style: 'thin' as const, color: { rgb: BORDER } },
  right: { style: 'thin' as const, color: { rgb: BORDER } },
};

function headerFill(theme: ExcelTheme): string {
  if (theme === 'quarter') return PETROL;
  if (theme === 'year') return NACHTBLAU;
  return NACHTBLAU;
}

function sumFill(theme: ExcelTheme): string {
  if (theme === 'quarter') return QUARTER_SUM;
  if (theme === 'year') return YEAR_SUM;
  return NEUTRAL_SUM;
}

function fontColor(cell: StyledCell): string {
  if (cell.role === 'title') return NACHTBLAU;
  if (cell.role === 'subtitle' || cell.role === 'note') return SLATE;
  if (cell.role === 'header' || cell.role === 'headerGroup') return WHITE;
  if (cell.color === 'negative' || cell.color === 'changed') return RED;
  if (cell.color === 'positive' || cell.color === 'new') return GREEN;
  if (cell.color === 'basis') return SKY;
  if (cell.color === 'web') return PETROL;
  if (cell.color === 'external') return VIOLET;
  if (cell.color === 'muted') return MUTED;
  return INK;
}

function styleFor(cell: StyledCell, rowIndex: number): CellStyle {
  const theme = cell.theme ?? 'neutral';
  const isHeader = cell.role === 'header' || cell.role === 'headerGroup';
  const isSum = cell.role === 'sum';
  const style: CellStyle = {
    font: {
      name: FONT,
      bold:
        cell.role === 'title' ||
        cell.role === 'metaLabel' ||
        cell.role === 'header' ||
        cell.role === 'headerGroup' ||
        cell.role === 'sum' ||
        (cell.role === 'label' && isSum),
      sz: cell.role === 'title' ? 16 : cell.role === 'headerGroup' ? 10 : 11,
      color: { rgb: fontColor(cell) },
    },
    alignment: {
      horizontal:
        cell.role === 'title' || cell.role === 'header' || cell.role === 'headerGroup'
          ? 'center'
          : cell.t === 'n'
            ? 'right'
            : 'left',
      vertical: 'center',
      wrapText: Boolean(cell.wrap) || isHeader,
    },
  };

  if (isHeader) {
    style.fill = { patternType: 'solid', fgColor: { rgb: headerFill(theme) } };
    style.border = THIN_BORDER;
  } else if (isSum) {
    style.fill = { patternType: 'solid', fgColor: { rgb: sumFill(theme) } };
    style.border = THIN_BORDER;
  } else if (cell.role === 'label' || cell.role === 'data') {
    if (cell.color === 'external') {
      style.fill = { patternType: 'solid', fgColor: { rgb: EXTERNAL_FILL } };
    } else if (rowIndex % 2 === 1) {
      style.fill = { patternType: 'solid', fgColor: { rgb: STRIPE } };
    }
    style.border = THIN_BORDER;
  }

  if (cell.z) style.numFmt = cell.z;
  return style;
}

function cellValue(cell: StyledCell): string | number {
  if (cell.v == null) return '';
  return cell.v;
}

export const C = {
  empty(): StyledCell {
    return { v: null, t: 's' };
  },
  title(value: string): StyledCell {
    return { v: value, t: 's', role: 'title' };
  },
  subtitle(value: string): StyledCell {
    return { v: value, t: 's', role: 'subtitle', wrap: true };
  },
  note(value: string): StyledCell {
    return { v: value, t: 's', role: 'note', wrap: true };
  },
  metaLabel(value: string): StyledCell {
    return { v: value, t: 's', role: 'metaLabel' };
  },
  metaValue(value: string): StyledCell {
    return { v: value, t: 's', role: 'metaValue' };
  },
  header(value: string, theme: ExcelTheme = 'neutral'): StyledCell {
    return { v: value, t: 's', role: 'header', theme, wrap: true };
  },
  headerGroup(value: string, theme: ExcelTheme = 'neutral'): StyledCell {
    return { v: value, t: 's', role: 'headerGroup', theme, wrap: true };
  },
  label(value: string, options?: { sum?: boolean; theme?: ExcelTheme }): StyledCell {
    return {
      v: value,
      t: 's',
      role: options?.sum ? 'sum' : 'label',
      theme: options?.theme,
    };
  },
  text(
    value: string | null | undefined,
    options?: { sum?: boolean; theme?: ExcelTheme; color?: ExcelCellColor },
  ): StyledCell {
    if (value == null || value === '') {
      return {
        v: '—',
        t: 's',
        role: options?.sum ? 'sum' : 'data',
        theme: options?.theme,
        color: 'muted',
      };
    }
    return {
      v: value,
      t: 's',
      role: options?.sum ? 'sum' : 'data',
      theme: options?.theme,
      color: options?.color,
    };
  },
  int(
    value: number | null | undefined,
    options?: { sum?: boolean; theme?: ExcelTheme; signed?: boolean; color?: ExcelCellColor },
  ): StyledCell {
    if (value == null || Number.isNaN(value)) {
      return {
        v: '—',
        t: 's',
        role: options?.sum ? 'sum' : 'data',
        theme: options?.theme,
        color: 'muted',
      };
    }
    const negative = value < 0;
    return {
      v: value,
      t: 'n',
      z: options?.signed ? '+#,##0;-#,##0;0' : '#,##0',
      role: options?.sum ? 'sum' : 'data',
      theme: options?.theme,
      color: options?.color ?? (negative ? 'negative' : undefined),
    };
  },
  decimal(
    value: number | null | undefined,
    options?: { sum?: boolean; theme?: ExcelTheme },
  ): StyledCell {
    if (value == null || Number.isNaN(value)) {
      return {
        v: '—',
        t: 's',
        role: options?.sum ? 'sum' : 'data',
        theme: options?.theme,
        color: 'muted',
      };
    }
    return {
      v: value,
      t: 'n',
      z: '#,##0.0',
      role: options?.sum ? 'sum' : 'data',
      theme: options?.theme,
    };
  },
  pct(
    value: number | null | undefined,
    options?: { sum?: boolean; theme?: ExcelTheme },
  ): StyledCell {
    if (value == null || Number.isNaN(value)) {
      return {
        v: '—',
        t: 's',
        role: options?.sum ? 'sum' : 'data',
        theme: options?.theme,
        color: 'muted',
      };
    }
    return {
      v: value,
      t: 'n',
      z: '0.0" %"',
      role: options?.sum ? 'sum' : 'data',
      theme: options?.theme,
      color: value < 0 ? 'negative' : undefined,
    };
  },
};

export function mergeCells(r1: number, c1: number, r2: number, c2: number): XLSX.Range {
  return { s: { r: r1, c: c1 }, e: { r: r2, c: c2 } };
}

export function buildGroupedHeader(
  left: string[],
  groups: { title: string; columns: string[] }[],
  theme: ExcelTheme,
  startRow: number,
): { rows: StyledCell[][]; merges: XLSX.Range[] } {
  const row1: StyledCell[] = left.map((text) => C.header(text, theme));
  const row2: StyledCell[] = left.map(() => C.header('', theme));
  const merges: XLSX.Range[] = left.map((_, index) => mergeCells(startRow, index, startRow + 1, index));

  let column = left.length;
  for (const group of groups) {
    const start = column;
    group.columns.forEach((text, index) => {
      row1.push(index === 0 ? C.headerGroup(group.title, theme) : C.header('', theme));
      row2.push(C.header(text, theme));
    });
    if (group.columns.length > 1) {
      merges.push(mergeCells(startRow, start, startRow, start + group.columns.length - 1));
    }
    column += group.columns.length;
  }

  return { rows: [row1, row2], merges };
}

export function buildCreatedAtLabel(): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
}

export function buildExcelFilename(base: string): string {
  const stamp = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\./g, '-');
  const safe = base.replace(/[^\wäöüÄÖÜß-]+/g, '-').replace(/-+/g, '-');
  return `${safe}_${stamp}.xlsx`;
}

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 31) || 'Tabelle';
}

function padRow(row: StyledCell[], columnCount: number): StyledCell[] {
  if (row.length >= columnCount) return row;
  return [...row, ...Array.from({ length: columnCount - row.length }, () => C.empty())];
}

function columnCount(rows: StyledCell[][]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

function buildWorksheet(sheet: ExcelSheet): XLSX.WorkSheet {
  const cols = columnCount(sheet.rows);
  const padded = sheet.rows.map((row) => padRow(row, cols));
  const values = padded.map((row) => row.map(cellValue));
  const worksheet = XLSX.utils.aoa_to_sheet(values);
  const headerRowIndexes = new Set<number>();

  padded.forEach((row, rowIndex) => {
    if (row.some((cell) => cell.role === 'header' || cell.role === 'headerGroup')) {
      headerRowIndexes.add(rowIndex);
    }
    row.forEach((cell, columnIndex) => {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const existing = worksheet[address] ?? { t: 's', v: '' };
      existing.t = cell.t ?? (typeof cell.v === 'number' ? 'n' : 's');
      existing.v = cellValue(cell);
      if (cell.z) existing.z = cell.z;
      existing.s = styleFor(cell, rowIndex);
      worksheet[address] = existing;
    });
  });

  worksheet['!merges'] = sheet.merges ?? [];
  worksheet['!cols'] = Array.from({ length: cols }, (_, columnIndex) => {
    const maxLength = padded.reduce((max, row) => {
      const cell = row[columnIndex];
      const length = cell?.v == null ? 0 : String(cell.v).length;
      return Math.max(max, length);
    }, 0);
    return { wch: Math.min(Math.max(maxLength + 2, 12), 42) };
  });
  worksheet['!rows'] = padded.map((_, rowIndex) =>
    headerRowIndexes.has(rowIndex) ? { hpt: 28 } : { hpt: 18 },
  );

  if (sheet.freezeRows != null || sheet.freezeCols != null) {
    worksheet['!views'] = [
      {
        state: 'frozen',
        xSplit: sheet.freezeCols ?? 0,
        ySplit: sheet.freezeRows ?? 0,
        topLeftCell: XLSX.utils.encode_cell({
          r: sheet.freezeRows ?? 0,
          c: sheet.freezeCols ?? 0,
        }),
      },
    ];
  }

  return worksheet;
}

function numericValue(value: number | null | undefined): number {
  return value == null || Number.isNaN(value) ? 0 : value;
}

export function compactChartBlocks(blocks: Array<ExcelChartBlock | null | undefined>): ExcelChartBlock[] {
  return blocks.filter((block): block is ExcelChartBlock => Boolean(block && block.categories.length > 0 && block.series.length > 0));
}

export function buildNativeChartSheet(name: string, blocks: ExcelChartBlock[]): ExcelSheet | null {
  const usable = compactChartBlocks(blocks);
  if (usable.length === 0) return null;

  const rows: StyledCell[][] = [];
  const merges: XLSX.Range[] = [];
  const charts: ExcelNativeChart[] = [];
  let row = 0;

  for (const block of usable) {
    const dataCols = 1 + block.series.length;
    const chartCol = Math.max(dataCols + 1, 8);
    const chartWidth = block.type === 'col' ? 18 : 14;
    const chartHeight = Math.max(16, Math.min(24, block.categories.length + 8));
    const titleRow = row;
    const titleCells = [C.subtitle(block.title), ...Array.from({ length: Math.max(dataCols - 1, 0) }, () => C.empty())];
    rows[row] = titleCells;
    merges.push(mergeCells(row, 0, row, Math.max(dataCols - 1, 0)));
    row += 1;

    const headerRow = row;
    rows[row] = [C.header('Kategorie'), ...block.series.map((series) => C.header(series.name))];
    row += 1;

    const firstDataRow = row;
    for (let index = 0; index < block.categories.length; index += 1) {
      rows[row] = [
        C.label(block.categories[index] ?? ''),
        ...block.series.map((series) =>
          block.percent
            ? C.pct(numericValue(series.values[index]))
            : C.int(numericValue(series.values[index])),
        ),
      ];
      row += 1;
    }
    const lastDataRow = row - 1;

    charts.push({
      title: block.title,
      type: block.type,
      headerRow,
      firstDataRow,
      lastDataRow,
      categoryCol: 0,
      series: block.series.map((series, seriesIndex) => ({
        col: seriesIndex + 1,
        color: series.color,
        dashed: series.dashed,
      })),
      from: { col: chartCol, row: titleRow },
      to: { col: chartCol + chartWidth, row: titleRow + chartHeight },
    });

    const nextRow = Math.max(row + 2, titleRow + chartHeight + 2);
    while (rows.length < nextRow) {
      rows.push([C.empty()]);
    }
    row = nextRow;
  }

  return { name, rows, merges, charts };
}

function downloadXlsx(bytes: Uint8Array, filename: string): void {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function writeStyledWorkbook(sheets: ExcelSheet[], filename: string): void {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  const chartBindings: Array<{ sheetName: string; charts: ExcelNativeChart[] }> = [];

  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;
    let name = sanitizeSheetName(sheet.name);
    let suffix = 2;
    while (usedNames.has(name)) {
      name = sanitizeSheetName(`${sheet.name} ${suffix}`);
      suffix += 1;
    }
    usedNames.add(name);
    XLSX.utils.book_append_sheet(workbook, buildWorksheet(sheet), name);
    if (sheet.charts && sheet.charts.length > 0) {
      chartBindings.push({ sheetName: name, charts: sheet.charts });
    }
  }

  if (workbook.SheetNames.length === 0) {
    throw new Error('Keine Tabellendaten zum Excel-Export.');
  }

  const raw = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer | Uint8Array;
  const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const withCharts = chartBindings.length > 0 ? injectNativeExcelCharts(bytes, chartBindings) : bytes;
  downloadXlsx(withCharts, filename);
}
