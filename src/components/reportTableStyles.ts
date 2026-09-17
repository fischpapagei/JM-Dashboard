/** Gemeinsame Tabellenklassen für Berichte: Kennzahlen bleiben in der Zelle. */

export const REPORT_TABLE_CLASS =
  'w-max min-w-full table-auto border-collapse text-left';

export const REPORT_LABEL_CELL =
  'box-border border px-1.5 py-1.5 align-top break-words [overflow-wrap:anywhere] min-w-[8.5rem] max-w-[16rem] overflow-hidden';

export const REPORT_DATA_CELL =
  'box-border border border-slate-200 px-1.5 py-1.5 align-middle text-right tabular-nums whitespace-nowrap overflow-hidden min-w-[5.5rem]';

export const REPORT_HEADER_CELL =
  'box-border border px-1.5 py-1.5 align-top break-words [overflow-wrap:anywhere] min-w-[5.5rem] overflow-hidden';

export const REPORT_TEXT_CELL =
  'box-border border px-1.5 py-1.5 align-middle break-words [overflow-wrap:anywhere] min-w-[6.5rem] max-w-[14rem] overflow-hidden';

/** Quartalstabellen: Nachtblau 15/30 %. */
export const REPORT_QUARTER_BANNER =
  'border-b border-nachtblau-30 bg-nachtblau-15 px-4 py-3';
export const REPORT_QUARTER_HEAD_ROW =
  'bg-nachtblau-30 text-[10px] uppercase tracking-wide text-nachtblau';
export const REPORT_QUARTER_SUB_ROW = 'bg-nachtblau-15 leading-tight text-nachtblau';
export const REPORT_QUARTER_HEADER_CELL = `${REPORT_HEADER_CELL} border-nachtblau-30`;
export const REPORT_QUARTER_SUM_ROW = 'bg-nachtblau-15/80 font-medium';

/** Jahrestabellen: Nachtblau 30/50 %. */
export const REPORT_YEAR_BANNER = 'border-b border-nachtblau-50 bg-nachtblau-30 px-4 py-3';
export const REPORT_YEAR_HEAD_ROW =
  'bg-nachtblau-50 text-[10px] uppercase tracking-wide text-nachtblau';
export const REPORT_YEAR_SUB_ROW = 'bg-nachtblau-30 leading-tight text-nachtblau';
export const REPORT_YEAR_HEADER_CELL = `${REPORT_HEADER_CELL} border-nachtblau-50`;
export const REPORT_YEAR_SUM_ROW = 'bg-nachtblau-30/80 font-medium';

export const REPORT_NEUTRAL_BANNER = 'border-b border-nachtblau-30 bg-nachtblau-15 px-4 py-3 text-center';
export const REPORT_NEUTRAL_HEADER_CELL =
  `${REPORT_HEADER_CELL} border-nachtblau-30 bg-nachtblau-15 text-[9px] font-semibold uppercase tracking-wide text-nachtblau`;
export const REPORT_NEGATIVE_VALUE = 'font-medium text-landesrot';
