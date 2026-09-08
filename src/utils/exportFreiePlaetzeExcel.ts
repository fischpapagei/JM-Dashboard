import XLSX from 'xlsx-js-style';
import type { AreaWithFreiePlaetze } from '../data/dashboardAreas';
import { JVAS } from '../data/jvas';
import type { DashboardFilters, FreeCapacityRow } from '../types/domain';
import { buildFilterSummary } from './filterSummary';
import {
  buildFreePlacesPivotValues,
  resolveFreePlacesExportColumns,
  type FreePlacesPivotColumn,
} from './freePlacesPivot';

export interface FreiePlaetzeExcelInput {
  areaKey: AreaWithFreiePlaetze;
  areaTitle: string;
  filters: DashboardFilters;
  rows: FreeCapacityRow[];
  filename?: string;
}

function buildFilename(areaTitle: string): string {
  const stamp = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\./g, '-');
  const safeArea = areaTitle.replace(/[^\wäöüÄÖÜß-]+/g, '-').replace(/-+/g, '-');
  return `Freie_Plaetze_${safeArea}_${stamp}.xlsx`;
}

function buildCreatedAtLabel(): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
}

function buildHeaderRows(
  columns: FreePlacesPivotColumn[],
  headerRowIndex: number,
): {
  row1: string[];
  row2: string[];
  merges: XLSX.Range[];
} {
  const row1: string[] = ['JVA'];
  const row2: string[] = [''];
  const merges: XLSX.Range[] = [];

  let index = 0;
  while (index < columns.length) {
    const category = columns[index].courseCategory;
    let end = index;
    while (end < columns.length && columns[end].courseCategory === category) {
      end += 1;
    }

    row1.push(category);
    for (let fill = index + 1; fill < end; fill += 1) {
      row1.push('');
    }

    for (let columnIndex = index; columnIndex < end; columnIndex += 1) {
      row2.push(columns[columnIndex].courseType);
    }

    const startCol = index + 1;
    const endCol = end;
    if (endCol - startCol > 1) {
      merges.push({
        s: { r: headerRowIndex, c: startCol },
        e: { r: headerRowIndex, c: endCol - 1 },
      });
    }

    index = end;
  }

  const totalCol = columns.length + 1;
  row1.push('Gesamt');
  row2.push('');
  merges.push({
    s: { r: headerRowIndex, c: 0 },
    e: { r: headerRowIndex + 1, c: 0 },
  });
  merges.push({
    s: { r: headerRowIndex, c: totalCol },
    e: { r: headerRowIndex + 1, c: totalCol },
  });

  return { row1, row2, merges };
}

const BOLD_CELL_STYLE = {
  font: { bold: true },
} as const;

function setRowBold(worksheet: XLSX.WorkSheet, rowIndex: number, columnCount: number): void {
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
    const cell = worksheet[address];
    if (!cell) continue;
    cell.s = { ...BOLD_CELL_STYLE, ...(cell.s ?? {}) };
  }
}

export function exportFreiePlaetzeExcel(input: FreiePlaetzeExcelInput): void {
  const columns = resolveFreePlacesExportColumns(input.areaKey, input.filters);
  const pivotValues = buildFreePlacesPivotValues(input.rows);
  const filterSummary = buildFilterSummary(input.filters, {
    variant: 'free-places',
    hideJva: true,
  });

  const sheetData: (string | number)[][] = [
    ['Landesweit freie Plätze', input.areaTitle],
    ['Erstellt am', buildCreatedAtLabel()],
    ['Datenquelle', 'BASIS-Web'],
    [],
    ['Angewendete Filter'],
  ];

  for (const item of filterSummary) {
    sheetData.push([item.label, item.value]);
  }

  sheetData.push([]);

  const headerRowIndex = sheetData.length;
  const { row1, row2, merges } = buildHeaderRows(columns, headerRowIndex);
  sheetData.push(row1, row2);

  const sortedJvas = [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de-DE'));
  const columnTotals = new Array<number>(columns.length).fill(0);

  for (const jva of sortedJvas) {
    const jvaValues = pivotValues.get(jva.id);
    const rowValues = columns.map((column, columnIndex) => {
      const value = jvaValues?.get(column.courseTypeKey) ?? 0;
      columnTotals[columnIndex] += value;
      return value;
    });
    const rowTotal = rowValues.reduce((sum, value) => sum + value, 0);
    sheetData.push([jva.name, ...rowValues, rowTotal]);
  }

  const grandTotal = columnTotals.reduce((sum, value) => sum + value, 0);
  sheetData.push(['Gesamt', ...columnTotals, grandTotal]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!merges'] = merges;

  const columnCount = columns.length + 2;
  const totalRowIndex = sheetData.length - 1;
  setRowBold(worksheet, headerRowIndex, columnCount);
  setRowBold(worksheet, headerRowIndex + 1, columnCount);
  setRowBold(worksheet, totalRowIndex, columnCount);

  const columnWidths = sheetData[headerRowIndex].map((_, columnIndex) => {
    const maxLength = sheetData.reduce((max, row) => {
      const cell = row[columnIndex];
      const length = cell == null ? 0 : String(cell).length;
      return Math.max(max, length);
    }, 0);
    return { wch: Math.min(Math.max(maxLength + 2, 10), 42) };
  });
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Freie Plätze');
  XLSX.writeFile(workbook, input.filename ?? buildFilename(input.areaTitle));
}
