import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

export interface ExcelNativeChartSeries {
  col: number;
  color: string;
  dashed?: boolean;
}

export interface ExcelNativeChart {
  title: string;
  type: 'line' | 'col';
  headerRow: number;
  firstDataRow: number;
  lastDataRow: number;
  categoryCol: number;
  series: ExcelNativeChartSeries[];
  from: { col: number; row: number };
  to: { col: number; row: number };
}

export interface ExcelChartSheetBinding {
  sheetName: string;
  charts: ExcelNativeChart[];
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeXml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function colLetter(index: number): string {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function a1(col: number, row: number): string {
  return `$${colLetter(col)}$${row + 1}`;
}

function sheetFormula(sheetName: string, range: string): string {
  const quoted = `'${sheetName.replace(/'/g, "''")}'`;
  return `${quoted}!${range}`;
}

function rgb(color: string): string {
  return color.replace('#', '').toUpperCase();
}

function parseRelationships(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of xml.matchAll(/<Relationship\b[^>]*>/g)) {
    const tag = match[0];
    const id = tag.match(/\bId="([^"]+)"/)?.[1];
    const target = tag.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) map.set(id, target);
  }
  return map;
}

function workbookSheets(files: Record<string, Uint8Array>): Array<{ name: string; path: string }> {
  const workbook = strFromU8(files['xl/workbook.xml'] ?? strToU8(''));
  const rels = strFromU8(files['xl/_rels/workbook.xml.rels'] ?? strToU8(''));
  const relMap = parseRelationships(rels);
  const sheets: Array<{ name: string; path: string }> = [];
  for (const match of workbook.matchAll(/<sheet\b[^>]*>/g)) {
    const tag = match[0];
    const name = tag.match(/\bname="([^"]+)"/)?.[1];
    const rId = tag.match(/\br:id="([^"]+)"/)?.[1];
    if (!name || !rId) continue;
    const target = relMap.get(rId);
    if (!target) continue;
    sheets.push({ name: decodeXml(name), path: `xl/${target.replace(/^\.\//, '')}` });
  }
  return sheets;
}

function seriesXml(
  sheetName: string,
  chart: ExcelNativeChart,
  series: ExcelNativeChartSeries,
  index: number,
): string {
  const color = rgb(series.color);
  const header = a1(series.col, chart.headerRow);
  const values = `${a1(series.col, chart.firstDataRow)}:${a1(series.col, chart.lastDataRow)}`;
  const cats = `${a1(chart.categoryCol, chart.firstDataRow)}:${a1(chart.categoryCol, chart.lastDataRow)}`;
  const dash = series.dashed ? '<a:prstDash val="dash"/>' : '';
  const lineWidth = series.dashed ? 19050 : 25400;
  const marker =
    chart.type === 'line' && !series.dashed
      ? `<c:marker><c:symbol val="circle"/><c:size val="7"/><c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></c:spPr></c:marker>`
      : chart.type === 'line'
        ? '<c:marker><c:symbol val="none"/></c:marker>'
        : '';
  const shape =
    chart.type === 'line'
      ? `<c:spPr><a:ln w="${lineWidth}"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill>${dash}</a:ln></c:spPr>`
      : `<c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr>`;
  return `<c:ser>
      <c:idx val="${index}"/>
      <c:order val="${index}"/>
      <c:tx><c:strRef><c:f>${xmlEscape(sheetFormula(sheetName, header))}</c:f></c:strRef></c:tx>
      ${shape}
      ${marker}
      <c:cat><c:strRef><c:f>${xmlEscape(sheetFormula(sheetName, cats))}</c:f></c:strRef></c:cat>
      <c:val><c:numRef><c:f>${xmlEscape(sheetFormula(sheetName, values))}</c:f></c:numRef></c:val>
    </c:ser>`;
}

function chartXml(sheetName: string, chart: ExcelNativeChart): string {
  const series = chart.series
    .filter((item) => item.col >= 0)
    .map((item, index) => seriesXml(sheetName, chart, item, index))
    .join('');
  const plot =
    chart.type === 'col'
      ? `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/>${series}<c:gapWidth val="70"/><c:axId val="1"/><c:axId val="2"/></c:barChart>`
      : `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series}<c:marker val="1"/><c:axId val="1"/><c:axId val="2"/></c:lineChart>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    <c:title>
      <c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1100" b="1"/></a:pPr><a:r><a:rPr lang="de-DE" sz="1100" b="1"/><a:t>${xmlEscape(chart.title)}</a:t></a:r></a:p></c:rich></c:tx>
      <c:overlay val="0"/>
    </c:title>
    <c:plotArea>
      <c:layout/>
      ${plot}
      <c:catAx>
        <c:axId val="1"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="b"/>
        <c:crossAx val="2"/>
        <c:tickLblPos val="nextTo"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="2"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="l"/>
        <c:majorGridlines/>
        <c:crossAx val="1"/>
        <c:tickLblPos val="nextTo"/>
      </c:valAx>
    </c:plotArea>
    <c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>
    <c:plotVisOnly val="1"/>
  </c:chart>
</c:chartSpace>`;
}

function drawingXml(startChartIndex: number, charts: ExcelNativeChart[]): string {
  const anchors = charts
    .map((chart, index) => {
      const rId = `rId${index + 1}`;
      const cNvId = startChartIndex + index + 2;
      return `<xdr:twoCellAnchor>
    <xdr:from><xdr:col>${chart.from.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.from.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>${chart.to.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${chart.to.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="${cNvId}" name="Diagramm ${index + 1}"/>
        <xdr:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></xdr:cNvGraphicFramePr>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${rId}"/>
        </a:graphicData>
      </a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${anchors}</xdr:wsDr>`;
}

function drawingRels(chartPaths: string[]): string {
  const relationships = chartPaths
    .map(
      (path, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="${path}"/>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`;
}

function worksheetRels(drawingPath: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="${drawingPath}"/>
</Relationships>`;
}

function insertDrawing(sheetXml: string): string {
  if (sheetXml.includes('<drawing ')) return sheetXml;
  const drawing = '<drawing r:id="rId1"/>';
  if (sheetXml.includes('</worksheet>')) {
    return sheetXml.replace('</worksheet>', `${drawing}</worksheet>`);
  }
  return `${sheetXml}${drawing}`;
}

function addContentTypes(xml: string, partName: string, contentType: string): string {
  if (xml.includes(`PartName="${partName}"`)) return xml;
  return xml.replace(
    '</Types>',
    `<Override PartName="${partName}" ContentType="${contentType}"/></Types>`,
  );
}

export function injectNativeExcelCharts(
  xlsxBytes: Uint8Array,
  bindings: ExcelChartSheetBinding[],
): Uint8Array {
  if (bindings.length === 0) return xlsxBytes;
  const files = unzipSync(xlsxBytes);
  const sheets = workbookSheets(files);
  let chartIndex = 1;
  let drawingIndex = 1;
  let contentTypes = strFromU8(files['[Content_Types].xml'] ?? strToU8(''));

  for (const binding of bindings) {
    if (binding.charts.length === 0) continue;
    const sheet = sheets.find((item) => item.name === binding.sheetName);
    if (!sheet) continue;
    const sheetXml = files[sheet.path];
    if (!sheetXml) continue;

    const drawingFile = `xl/drawings/drawing${drawingIndex}.xml`;
    const drawingRelsFile = `xl/drawings/_rels/drawing${drawingIndex}.xml.rels`;
    const sheetDir = sheet.path.replace(/\/[^/]+$/, '');
    const sheetName = sheet.path.split('/').pop() ?? 'sheet1.xml';
    const sheetRelsFile = `${sheetDir}/_rels/${sheetName}.rels`;
    const drawingTarget = `../drawings/drawing${drawingIndex}.xml`;
    const chartPaths: string[] = [];
    const startChartIndex = chartIndex;

    for (const chart of binding.charts) {
      const chartFile = `xl/charts/chart${chartIndex}.xml`;
      files[chartFile] = strToU8(chartXml(binding.sheetName, chart));
      contentTypes = addContentTypes(
        contentTypes,
        `/${chartFile}`,
        'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
      );
      chartPaths.push(`../charts/chart${chartIndex}.xml`);
      chartIndex += 1;
    }

    files[drawingFile] = strToU8(drawingXml(startChartIndex, binding.charts));
    files[drawingRelsFile] = strToU8(drawingRels(chartPaths));
    files[sheetRelsFile] = strToU8(worksheetRels(drawingTarget));
    files[sheet.path] = strToU8(insertDrawing(strFromU8(sheetXml)));
    contentTypes = addContentTypes(
      contentTypes,
      `/${drawingFile}`,
      'application/vnd.openxmlformats-officedocument.drawing+xml',
    );
    drawingIndex += 1;
  }

  files['[Content_Types].xml'] = strToU8(contentTypes);

  const ordered: Record<string, Uint8Array> = {};
  for (const first of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml']) {
    if (files[first]) ordered[first] = files[first];
  }
  for (const [name, content] of Object.entries(files)) {
    if (!(name in ordered)) ordered[name] = content;
  }
  return zipSync(ordered, { level: 6 });
}
