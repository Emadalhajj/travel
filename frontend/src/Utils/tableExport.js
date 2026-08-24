import pdfMake from "pdfmake-rtl";
import pdfFonts from "pdfmake-rtl/build/vfs_fonts";
import * as XLSX from "xlsx";
import { formatImagePath } from "./imageUtils";
import {
  buildPdfBrandingFooter,
  buildPdfBrandingHeader,
  buildPdfPageDecoration,
  loadDocumentBranding,
  PDF_LAYOUT,
} from "./documentPdfBranding";

pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || {};

const EXCLUDED_HEADERS = new Set([
  "no",
  "Actions",
  "الإجراءات",
]);
const EXCEL_HEADER_ROW = 3;
const PORTRAIT_CONTENT_WIDTH = 547;
const LANDSCAPE_CONTENT_WIDTH = 794;
const PDF_CELL_HORIZONTAL_OVERHEAD = 6;
const DEFAULT_MAX_PDF_COLUMNS = 7;
const SERIAL_HEADERS = new Set([
  "#",
  "no",
  "no.",
  "number",
  "الرقم",
  "م",
  "التسلسل",
  "الرقم التسلسلي",
]);

export const extractCleanText = (content) => {
  if (content == null) return "";
  if (typeof content === "number" && !Number.isFinite(content)) return "";
  if (["string", "number", "boolean"].includes(typeof content)) {
    return String(content).trim();
  }
  if (Array.isArray(content)) {
    return content.map(extractCleanText).filter(Boolean).join(" • ");
  }
  if (typeof content === "object") {
    const props = content.props || {};
    if (props.children != null) return extractCleanText(props.children);
    if (props.label != null) return extractCleanText(props.label);
    if (props.value != null) return extractCleanText(props.value);
    return extractCleanText(
      content.name || content.label || content.title || content.text || "",
    );
  }
  return String(content).trim();
};

const resolvePath = (row, path) => {
  if (path == null) return undefined;
  if (typeof path === "function") return path(row);
  if (Array.isArray(path)) {
    for (const candidate of path) {
      const value = resolvePath(row, candidate);
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  }
  if (typeof path !== "string") return undefined;
  return path.split(".").reduce((value, key) => value?.[key], row);
};

const resolveColumnValue = (row, column, target, rowIndex) => {
  const valueHandler = column[`${target}Value`];
  const accessor = column[`${target}Accessor`];

  if (typeof valueHandler === "function") return valueHandler(row, rowIndex);
  if (accessor != null) return resolvePath(row, accessor);
  if (column.exportImageAccessor != null) {
    const images = resolvePath(row, column.exportImageAccessor);
    const image = Array.isArray(images) ? images[0] : images;
    return formatImagePath(image, { fallback: "" });
  }

  if (target === "pdf") {
    if (typeof column.excelValue === "function") return column.excelValue(row, rowIndex);
    if (column.excelAccessor != null) return resolvePath(row, column.excelAccessor);
  }
  if (column.accessor != null) return resolvePath(row, column.accessor);
  if (typeof column.render === "function") return column.render(row, rowIndex);
  return undefined;
};

export const getValueFromAccessor = (row, column, rowIndex) =>
  extractCleanText(resolveColumnValue(row, column, "pdf", rowIndex));

const safeExcelText = (value) => {
  const text = extractCleanText(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

export const getExcelValue = (row, column, rowIndex) => {
  const value = resolveColumnValue(row, column, "excel", rowIndex);
  if (value == null || value === "") return null;

  if (column.excelType === "number") {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }
  if (column.excelType === "date") {
    const dateValue = value instanceof Date ? value : new Date(value);
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }
  if (column.excelType === "boolean") return Boolean(value);
  if (typeof value === "number" || typeof value === "boolean" || value instanceof Date) {
    return value;
  }
  return safeExcelText(value);
};

export const getExportColumns = (columns = []) =>
  columns.filter(
    (column) =>
      !column.hidden &&
      column.exportable !== false &&
      column.header &&
      !EXCLUDED_HEADERS.has(column.header),
  );

const isSerialColumn = (column) =>
  SERIAL_HEADERS.has(String(column?.header || "").trim().toLowerCase()) ||
  column?.exportSerial === true;

const withSerialColumn = (columns, lang) => [
  {
    header: lang === "ar" ? "الرقم التسلسلي" : "No.",
    render: (_row, rowIndex) => rowIndex + 1,
    excelType: "number",
    excelWidth: 12,
    pdfWidth: 48,
    pdfRepeat: true,
    exportSerial: true,
  },
  ...columns.filter((column) => !isSerialColumn(column)),
];

export const buildExportRows = (data = [], columns = [], lang = "ar") => {
  const visibleColumns = withSerialColumn(getExportColumns(columns), lang);
  return {
    columns: visibleColumns,
    headers: visibleColumns.map((column) => column.pdfHeader || column.header),
    rows: data.map((row, rowIndex) =>
      visibleColumns.map((column) => getValueFromAccessor(row, column, rowIndex)),
    ),
  };
};

export const buildExcelExportRows = (data = [], columns = [], lang = "ar") => {
  const visibleColumns = withSerialColumn(getExportColumns(columns), lang);
  return {
    columns: visibleColumns,
    headers: visibleColumns.map((column) => column.excelHeader || column.header),
    rows: data.map((row, rowIndex) =>
      visibleColumns.map((column) => getExcelValue(row, column, rowIndex)),
    ),
  };
};

const textLength = (value) => extractCleanText(value).replace(/\s+/g, " ").length;

const estimatePdfColumnWidth = (column, header, values) => {
  if (typeof column.pdfWidth === "number") return column.pdfWidth;
  const longest = Math.max(textLength(header), ...values.map(textLength), 1);
  const inferredMaximum = column.pdfMaxWidth || (column.excelType === "number" ? 65 : 130);
  const inferredMinimum = column.pdfMinWidth || (column.excelType === "number" ? 42 : 52);
  return Math.min(Math.max(longest * 4.2 + 16, inferredMinimum), inferredMaximum);
};

const buildPdfColumnMeta = (columns, headers, rows) =>
  columns.map((column, index) => ({
    column,
    header: headers[index],
    sourceIndex: index,
    width: estimatePdfColumnWidth(
      column,
      headers[index],
      rows.map((row) => row[index]),
    ),
  }));

export const resolvePdfLayout = ({
  columns,
  headers,
  rows,
  requestedOrientation = "auto",
}) => {
  const meta = buildPdfColumnMeta(columns, headers, rows);
  const estimatedWidth = meta.reduce((sum, item) => sum + item.width, 0) +
    meta.length * PDF_CELL_HORIZONTAL_OVERHEAD;
  const orientation = requestedOrientation === "portrait" || requestedOrientation === "landscape"
    ? requestedOrientation
    : meta.length > 5 || estimatedWidth > PORTRAIT_CONTENT_WIDTH
      ? "landscape"
      : "portrait";
  return {
    orientation,
    availableWidth: orientation === "landscape"
      ? LANDSCAPE_CONTENT_WIDTH
      : PORTRAIT_CONTENT_WIDTH,
    columnMeta: meta,
  };
};

const splitPdfColumnGroups = (columnMeta, availableWidth, maxColumns) => {
  const totalWidth = columnMeta.reduce((sum, item) => sum + item.width, 0);
  if (columnMeta.length <= maxColumns && totalWidth <= availableWidth) {
    return [columnMeta];
  }

  const explicitlyRepeated = columnMeta.filter((item) => item.column.pdfRepeat);
  const repeated = explicitlyRepeated.length ? explicitlyRepeated : columnMeta.slice(0, 1);
  const repeatedIndexes = new Set(repeated.map((item) => item.sourceIndex));
  const remaining = columnMeta.filter((item) => !repeatedIndexes.has(item.sourceIndex));
  const groups = [];
  let group = [...repeated];
  let usedWidth = repeated.reduce((sum, item) => sum + item.width, 0);

  remaining.forEach((item) => {
    const exceedsWidth = group.length > repeated.length && usedWidth + item.width > availableWidth;
    const exceedsCount = group.length >= maxColumns;
    if (exceedsWidth || exceedsCount) {
      groups.push(group);
      group = [...repeated];
      usedWidth = repeated.reduce((sum, value) => sum + value.width, 0);
    }
    group.push(item);
    usedWidth += item.width;
  });
  if (group.length > repeated.length || !groups.length) groups.push(group);
  return groups;
};

const fitPdfWidths = (group, availableWidth) => {
  const total = group.reduce((sum, item) => sum + item.width, 0) || 1;
  const scale = availableWidth / total;
  const widths = group.map((item) => Math.max(38, Math.round(item.width * scale)));
  const difference = availableWidth - widths.reduce((sum, width) => sum + width, 0);
  const widestIndex = widths.indexOf(Math.max(...widths));
  widths[widestIndex] += difference;
  return widths;
};

const getPdfCellAlignment = (column, isArabic) => {
  if (column.pdfAlignment) return column.pdfAlignment;
  if (column.align) return column.align;
  return column.excelType === "number" ? "center" : isArabic ? "right" : "left";
};

const makePdfTextWrappable = (value, noWrap) => {
  const text = value == null ? "" : String(value);
  if (noWrap) return text;
  return text.replace(/\S{24,}/g, (token) =>
    token.replace(/(.{18})/g, "$1\u200b"),
  );
};

const buildPdfCell = ({ value, column, isArabic, header = false, rowIndex = 0, fontSize }) => ({
  ...(value?.image && !header
    ? { image: value.image, fit: [column.pdfImageWidth || 42, column.pdfImageHeight || 32] }
    : { text: makePdfTextWrappable(value, !header && column.pdfWrap === false) }),
  alignment: header ? "center" : getPdfCellAlignment(column, isArabic),
  rtl: isArabic,
  noWrap: header ? false : column.pdfWrap === false,
  bold: header,
  color: header ? "#ffffff" : "#1e293b",
  fillColor: header ? "#475569" : rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc",
  fontSize: header ? fontSize + 0.5 : fontSize,
  lineHeight: 1.15,
  margin: header ? [3, 5, 3, 5] : value?.image ? [2, 2, 2, 2] : [3, 3, 3, 3],
});

export const buildPdfTableBody = (
  headers = [],
  rows = [],
  isArabic = false,
  columns = headers.map(() => ({})),
  fontSize = 8,
) => {
  const indexes = headers.map((_header, index) => index);
  return [
    indexes.map((index) => buildPdfCell({
      value: headers[index], column: columns[index] || {}, isArabic, header: true, fontSize,
    })),
    ...rows.map((row, rowIndex) => indexes.map((index) => buildPdfCell({
      value: row[index], column: columns[index] || {}, isArabic, rowIndex, fontSize,
    }))),
  ];
};

const buildPdfTableSections = ({
  columns,
  headers,
  rows,
  isArabic,
  availableWidth,
  maxColumns,
  columnMeta,
}) => {
  const groups = splitPdfColumnGroups(
    columnMeta || buildPdfColumnMeta(columns, headers, rows),
    availableWidth,
    maxColumns,
  );
  return groups.map((group, groupIndex) => {
    const safeTableWidth = availableWidth -
      group.length * PDF_CELL_HORIZONTAL_OVERHEAD - 4;
    const widths = fitPdfWidths(group, safeTableWidth);
    const groupHeaders = group.map((item) => item.header);
    const groupColumns = group.map((item) => item.column);
    const groupRows = rows.map((row) => group.map((item) => row[item.sourceIndex]));
    const fontSize = group.length >= 7 ? 7.2 : group.length >= 5 ? 7.8 : 8.3;
    return {
      pageBreak: groupIndex ? "before" : undefined,
      stack: [
        ...(groups.length > 1 ? [{
          text: `${groupIndex + 1} / ${groups.length}`,
          alignment: "center",
          color: "#64748b",
          fontSize: 8,
          margin: [0, 0, 0, 4],
        }] : []),
        {
          table: {
            rtl: isArabic,
            headerRows: 1,
            keepWithHeaderRows: 1,
            dontBreakRows: false,
            widths,
            body: buildPdfTableBody(groupHeaders, groupRows, isArabic, groupColumns, fontSize),
          },
          layout: {
            hLineWidth: () => 0.45,
            vLineWidth: () => 0.35,
            hLineColor: () => "#cbd5e1",
            vLineColor: () => "#e2e8f0",
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 1,
            paddingBottom: () => 1,
          },
        },
      ],
    };
  });
};

const rasterizeImageSource = (source, sourceWidth, sourceHeight) => {
  if (!sourceWidth || !sourceHeight) return null;
  const maximumDimension = 900;
  const scale = Math.min(1, maximumDimension / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
};

const blobToPdfPng = async (blob) => {
  if (!blob?.size || !blob.type?.startsWith("image/")) return null;

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    try {
      return rasterizeImageSource(bitmap, bitmap.width, bitmap.height);
    } finally {
      bitmap.close?.();
    }
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      try {
        resolve(rasterizeImageSource(image, image.naturalWidth, image.naturalHeight));
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    image.src = objectUrl;
  });
};

const hydratePdfImages = async (rows, columns) => {
  const imageColumns = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => column.exportImageAccessor != null);
  if (!imageColumns.length) return rows;

  const cache = new Map();
  const loadImage = async (url) => {
    if (!url) return null;
    if (!cache.has(url)) {
      cache.set(url, (async () => {
        try {
          const response = await fetch(url, { credentials: "include" });
          if (!response.ok) return null;
          return await blobToPdfPng(await response.blob());
        } catch {
          return null;
        }
      })());
    }
    return cache.get(url);
  };

  return Promise.all(rows.map(async (row) => {
    const hydrated = [...row];
    await Promise.all(imageColumns.map(async ({ index }) => {
      const image = await loadImage(row[index]);
      hydrated[index] = image ? { image } : "-";
    }));
    return hydrated;
  }));
};

export const exportTablePDF = async ({
  data = [],
  columns = [],
  fileName = "Report.pdf",
  lang = "ar",
  title = "Report",
  pdfOptions = {},
}) => {
  if (!data.length) return;
  const isArabic = lang === "ar";
  const branding = await loadDocumentBranding();
  const { columns: visibleColumns, headers, rows: rawRows } = buildExportRows(data, columns, lang);
  if (!headers.length) return;
  const rows = await hydratePdfImages(rawRows, visibleColumns);

  const {
    orientation,
    availableWidth,
    columnMeta,
  } = resolvePdfLayout({
    columns: visibleColumns,
    headers,
    rows,
    requestedOrientation: pdfOptions.orientation || "auto",
  });
  const content = buildPdfTableSections({
    columns: visibleColumns,
    headers,
    rows,
    isArabic,
    availableWidth,
    maxColumns: pdfOptions.maxColumns ||
      (orientation === "landscape" ? 9 : DEFAULT_MAX_PDF_COLUMNS),
    columnMeta,
  });
  const docDefinition = {
    pageSize: pdfOptions.pageSize || "A4",
    pageOrientation: orientation,
    pageMargins: [24, PDF_LAYOUT.contentTop, 24, PDF_LAYOUT.contentBottom],
    header: buildPdfBrandingHeader({ branding, lang, title }),
    footer: buildPdfBrandingFooter({ branding, lang }),
    background: buildPdfPageDecoration,
    content,
    defaultStyle: { fontSize: 8, color: "#1e293b" },
  };
  pdfMake.createPdf(docDefinition).download(fileName);
};

const getExcelColumnWidth = (header, values, configuredWidth) => {
  if (configuredWidth) return configuredWidth;
  const longest = Math.max(textLength(header), ...values.map(textLength), 1);
  return Math.min(Math.max(longest + 2, 10), 48);
};

const setExcelCellTypes = (worksheet, rows, columns) => {
  columns.forEach((column, columnIndex) => {
    rows.forEach((_row, rowIndex) => {
      const address = XLSX.utils.encode_cell({ r: rowIndex + EXCEL_HEADER_ROW + 1, c: columnIndex });
      const cell = worksheet[address];
      if (!cell || cell.v == null) return;
      if (column.excelType === "number" && typeof cell.v === "number") {
        cell.t = "n";
        cell.z = column.excelFormat || "#,##0.00";
      } else if (column.excelType === "date" && cell.v instanceof Date) {
        cell.t = "d";
        cell.z = column.excelFormat || "yyyy-mm-dd";
      } else if (column.excelType === "boolean") {
        cell.t = "b";
      }
      if (column.exportImageAccessor && typeof cell.v === "string" && cell.v) {
        cell.l = { Target: cell.v, Tooltip: column.excelImageTooltip || "Open image" };
      }
    });
  });
};

export const exportTableExcel = ({
  data = [],
  columns = [],
  fileName = "Report.xlsx",
  title = "Report",
  lang = "ar",
  excelOptions = {},
}) => {
  if (!data.length) return;
  const { headers, rows, columns: visibleColumns } = buildExcelExportRows(data, columns, lang);
  if (!headers.length) return;
  const exportDate = lang === "ar"
    ? `تاريخ التصدير: ${new Date().toLocaleString("en-GB")}`
    : `Exported: ${new Date().toLocaleString("en-GB")}`;
  const worksheet = XLSX.utils.aoa_to_sheet([[title], [exportDate], [], headers, ...rows], {
    cellDates: true,
  });
  worksheet["!cols"] = headers.map((header, index) => ({
    wch: getExcelColumnWidth(
      header,
      rows.map((row) => row[index]),
      visibleColumns[index]?.excelWidth,
    ),
  }));
  worksheet["!merges"] = headers.length > 1 ? [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
  ] : [];
  if (excelOptions.autoFilter !== false) {
    worksheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({ s: { r: EXCEL_HEADER_ROW, c: 0 }, e: { r: EXCEL_HEADER_ROW, c: headers.length - 1 } }),
    };
  }
  setExcelCellTypes(worksheet, rows, visibleColumns);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, excelOptions.sheetName || "Report");
  XLSX.writeFile(workbook, fileName, { cellDates: true });
};
