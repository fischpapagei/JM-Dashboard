import { domToCanvas } from 'modern-screenshot';
import { jsPDF } from 'jspdf';

const MUTED: [number, number, number] = [100, 116, 139];
/** 120 dpi — lesbar in Druck und Bildschirm, ohne PNG-Riesenauflösung. */
const CAPTURE_SCALE = 1.25;
const JPEG_QUALITY = 0.72;
const BLOCK_GAP_MM = 4;
const MARGIN_MM = 8;
const FOOTER_SPACE_MM = 6;
/** CSS-Pixel der Querformat-Tabellen vor dem Skalieren — reicht für A4-quer. */
const LANDSCAPE_TABLE_CAPTURE_WIDTH_PX = 1600;
/** Obere Grenze für eingebettete Pixelbreite (A4-quer ~150 dpi). */
const MAX_EMBED_WIDTH_PX = 1600;
const MAX_CAPTURE_WIDTH_PX = 1600;

export interface KurzberichtCaptureInput {
  root: HTMLElement;
  filename?: string;
}

type PageOrientation = 'portrait' | 'landscape';

interface CaptureOptions {
  width?: number;
}

function buildFilename(suffix = 'Schulische-Bildung'): string {
  const stamp = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\./g, '-');
  return `Kurzbericht_${suffix}_${stamp}.pdf`;
}

function isLandscapeBlock(block: HTMLElement): boolean {
  return block.hasAttribute('data-pdf-landscape');
}

function isMultipageBlock(block: HTMLElement): boolean {
  return block.hasAttribute('data-pdf-multipage');
}

function isTableBlock(block: HTMLElement): boolean {
  return Boolean(block.querySelector('table'));
}

function isNewPageBlock(block: HTMLElement): boolean {
  return block.hasAttribute('data-pdf-new-page');
}

function capCaptureWidth(width: number): number {
  return Math.min(width, MAX_CAPTURE_WIDTH_PX);
}

function getCaptureOptions(block: HTMLElement): CaptureOptions {
  const widthAttr = block.getAttribute('data-pdf-capture-width');
  if (widthAttr) {
    const width = Number.parseInt(widthAttr, 10);
    if (Number.isFinite(width)) return { width: capCaptureWidth(width) };
  }
  if (isLandscapeBlock(block) && isTableBlock(block)) {
    return { width: LANDSCAPE_TABLE_CAPTURE_WIDTH_PX };
  }
  return {};
}

function canvasToJpegDataUrl(canvas: HTMLCanvasElement): string {
  const source = downsampleCanvas(canvas, MAX_EMBED_WIDTH_PX);
  return source.toDataURL('image/jpeg', JPEG_QUALITY);
}

function downsampleCanvas(canvas: HTMLCanvasElement, maxWidth: number): HTMLCanvasElement {
  const scale = canvas.width > maxWidth ? maxWidth / canvas.width : 1;
  if (scale === 1) {
    return canvas;
  }

  const output = document.createElement('canvas');
  output.width = Math.round(canvas.width * scale);
  output.height = Math.round(canvas.height * scale);
  const ctx = output.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas-Kontext nicht verfügbar');
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, output.width, output.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, output.width, output.height);
  return output;
}

function addJpegImage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  widthMm: number,
  heightMm: number,
): void {
  pdf.addImage(canvasToJpegDataUrl(canvas), 'JPEG', x, y, widthMm, heightMm, undefined, 'FAST');
}

function clearOverflowConstraints(el: HTMLElement): void {
  const computed = window.getComputedStyle(el);
  if (['hidden', 'auto', 'scroll', 'clip'].includes(computed.overflow)) {
    el.style.overflow = 'visible';
  }
  if (['hidden', 'auto', 'scroll', 'clip'].includes(computed.overflowY)) {
    el.style.overflowY = 'visible';
  }
  if (['hidden', 'auto', 'scroll', 'clip'].includes(computed.overflowX)) {
    el.style.overflowX = 'visible';
  }
  if (computed.maxHeight !== 'none') {
    el.style.maxHeight = 'none';
  }
  if (computed.maxWidth !== 'none') {
    el.style.maxWidth = 'none';
  }
  if (computed.position === 'sticky') {
    el.style.position = 'static';
  }
}

function stretchTablesToCaptureWidth(root: HTMLElement, targetWidth: number): void {
  root.style.width = `${targetWidth}px`;
  root.style.minWidth = `${targetWidth}px`;
  root.style.maxWidth = `${targetWidth}px`;
  root.style.boxSizing = 'border-box';

  const tables = root.querySelectorAll<HTMLTableElement>('table');
  for (const table of tables) {
    table.style.width = '100%';
    table.style.minWidth = '100%';
    table.style.maxWidth = '100%';
    table.style.tableLayout = 'auto';
    table.style.boxSizing = 'border-box';

    for (const cell of table.querySelectorAll<HTMLElement>('th, td')) {
      cell.style.overflowWrap = 'anywhere';
      cell.style.wordBreak = 'break-word';
      cell.style.whiteSpace = 'normal';
      cell.style.overflow = 'hidden';
      cell.style.minWidth = '0';
      cell.style.maxWidth = 'none';
    }

    let parent: HTMLElement | null = table.parentElement;
    while (parent && parent !== root.parentElement) {
      parent.style.width = '100%';
      parent.style.maxWidth = '100%';
      parent.style.boxSizing = 'border-box';
      if (parent === root) break;
      parent = parent.parentElement;
    }
  }
}

function prepareCloneForCapture(cloned: Node): void {
  if (!(cloned instanceof HTMLElement)) return;
  clearOverflowConstraints(cloned);
}

function prepareCloneRoot(cloned: Node, targetWidth?: number): void {
  if (!(cloned instanceof HTMLElement)) return;
  clearOverflowConstraints(cloned);
  const elements = cloned.querySelectorAll<HTMLElement>('*');
  for (const el of elements) {
    clearOverflowConstraints(el);
  }
  if (targetWidth) {
    stretchTablesToCaptureWidth(cloned, targetWidth);
  }
}

async function captureElementAsCanvas(
  element: HTMLElement,
  options: CaptureOptions = {},
): Promise<HTMLCanvasElement> {
  const targetWidth = options.width;
  return domToCanvas(element, {
    scale: CAPTURE_SCALE,
    backgroundColor: '#f3f6f5',
    timeout: 60_000,
    maximumCanvasSize: 16_384,
    features: {
      restoreScrollPosition: true,
    },
    onCloneEachNode: prepareCloneForCapture,
    onCloneNode: (cloned) => prepareCloneRoot(cloned, targetWidth),
    ...(targetWidth
      ? {
          width: targetWidth,
          style: {
            width: `${targetWidth}px`,
            minWidth: `${targetWidth}px`,
            maxWidth: `${targetWidth}px`,
            boxSizing: 'border-box',
          },
        }
      : {}),
  });
}

function getContentSize(pdf: jsPDF): { contentWidth: number; contentHeight: number } {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  return {
    contentWidth: pageWidth - 2 * MARGIN_MM,
    contentHeight: pageHeight - 2 * MARGIN_MM - FOOTER_SPACE_MM,
  };
}

function toJsPdfOrientation(orientation: PageOrientation): 'p' | 'l' {
  return orientation === 'landscape' ? 'l' : 'p';
}

function addPageFooters(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Kennzahlensystem Schulische Bildung NRW · Seite ${page} von ${pageCount}`,
      MARGIN_MM,
      pageHeight - 5,
    );
    doc.text('Datenquelle: BASIS-Web', pageWidth - MARGIN_MM, pageHeight - 5, { align: 'right' });
  }
}

function getDrawSize(
  canvas: HTMLCanvasElement,
  contentWidthMm: number,
  contentHeightMm: number,
): { widthMm: number; heightMm: number } {
  const aspect = canvas.height / canvas.width;
  let widthMm = contentWidthMm;
  let heightMm = widthMm * aspect;

  if (heightMm > contentHeightMm) {
    const scale = contentHeightMm / heightMm;
    widthMm *= scale;
    heightMm = contentHeightMm;
  }

  return { widthMm, heightMm };
}

function drawCanvasMultipage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  startCursorY: number,
  addPage: () => void,
): number {
  const { contentWidth, contentHeight } = getContentSize(pdf);
  const widthMm = contentWidth;
  const pxPerMm = canvas.width / widthMm;
  const maxSliceHeightPx = Math.floor(contentHeight * pxPerMm);

  let sourceY = 0;
  let cursorY = startCursorY;

  while (sourceY < canvas.height) {
    const remainingMmOnPage = MARGIN_MM + contentHeight - cursorY;
    if (remainingMmOnPage < 12) {
      addPage();
      cursorY = MARGIN_MM;
    }

    const availableMm = MARGIN_MM + contentHeight - cursorY;
    const availablePx = Math.floor(availableMm * pxPerMm);
    const sliceHeightPx = Math.min(maxSliceHeightPx, availablePx, canvas.height - sourceY);

    if (sliceHeightPx <= 0) {
      addPage();
      cursorY = MARGIN_MM;
      continue;
    }

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas-Kontext nicht verfügbar');
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    const sliceHeightMm = sliceHeightPx / pxPerMm;
    addJpegImage(pdf, sliceCanvas, MARGIN_MM, cursorY, widthMm, sliceHeightMm);

    sourceY += sliceHeightPx;
    cursorY += sliceHeightMm;

    if (sourceY < canvas.height) {
      addPage();
      cursorY = MARGIN_MM;
    }
  }

  return cursorY + BLOCK_GAP_MM;
}

export async function generateKurzberichtPdf(input: KurzberichtCaptureInput): Promise<void> {
  const blocks = Array.from(input.root.querySelectorAll<HTMLElement>('[data-pdf-block]'));
  if (blocks.length === 0) {
    throw new Error('Keine PDF-Abschnitte gefunden.');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

  let cursorY = MARGIN_MM;
  let pageStarted = false;
  let currentOrientation: PageOrientation = 'portrait';

  for (const block of blocks) {
    const targetOrientation: PageOrientation = isLandscapeBlock(block) ? 'landscape' : 'portrait';
    const canvas = await captureElementAsCanvas(block, getCaptureOptions(block));
    if (canvas.width === 0 || canvas.height === 0) continue;

    if (!pageStarted) {
      if (targetOrientation === 'landscape') {
        pdf.addPage('a4', 'l');
        pdf.deletePage(1);
        currentOrientation = 'landscape';
      }
      pageStarted = true;
      cursorY = MARGIN_MM;
    } else if (targetOrientation !== currentOrientation || isNewPageBlock(block)) {
      pdf.addPage('a4', toJsPdfOrientation(targetOrientation));
      currentOrientation = targetOrientation;
      cursorY = MARGIN_MM;
    }

    const { contentWidth, contentHeight } = getContentSize(pdf);
    const fillLandscapeWidth = isLandscapeBlock(block) && isTableBlock(block);

    if (isMultipageBlock(block) || fillLandscapeWidth) {
      const estimatedHeightMm = (canvas.height / canvas.width) * contentWidth;
      if (pageStarted && cursorY > MARGIN_MM && cursorY + estimatedHeightMm > MARGIN_MM + contentHeight) {
        pdf.addPage('a4', toJsPdfOrientation(currentOrientation));
        cursorY = MARGIN_MM;
      }

      cursorY = drawCanvasMultipage(pdf, canvas, cursorY, () => {
        pdf.addPage('a4', toJsPdfOrientation(currentOrientation));
      });
      continue;
    }

    const { widthMm, heightMm } = getDrawSize(canvas, contentWidth, contentHeight);

    if (pageStarted && cursorY > MARGIN_MM && cursorY + heightMm > MARGIN_MM + contentHeight) {
      pdf.addPage('a4', toJsPdfOrientation(currentOrientation));
      cursorY = MARGIN_MM;
    }

    const x = MARGIN_MM + (contentWidth - widthMm) / 2;
    addJpegImage(pdf, canvas, x, cursorY, widthMm, heightMm);
    cursorY += heightMm + BLOCK_GAP_MM;
  }

  addPageFooters(pdf);
  pdf.save(input.filename ?? buildFilename());
}
