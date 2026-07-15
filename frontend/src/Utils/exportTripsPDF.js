// src/Utils/exportTripsPDF.js

import pdfMake from 'pdfmake-rtl';
import pdfFonts from 'pdfmake-rtl/build/vfs_fonts';
import * as XLSX from "xlsx";

// ربط الـ vfs بأمان
pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || {};

// دالة استخراج نص نظيف (مهمة جدًا لتجنب إرسال JSX)
const extractCleanText = (content) => {
  if (content == null || content === undefined) return "";

  if (typeof content === "string") return content.trim();

  if (typeof content === "number" || typeof content === "boolean") {
    return String(content);
  }

  if (Array.isArray(content)) {
    return content
      .map(extractCleanText)
      .filter(Boolean)
      .join(" • ")
      .trim();
  }

  if (typeof content === "object" && content !== null) {
    if (content.props?.children) {
      return extractCleanText(content.props.children);
    }
    if (content.name) return String(content.name);
    if (content.label) return String(content.label);
    if (content.title) return String(content.title);
    if (content.text) return String(content.text);
    return "";
  }

  return String(content) || "";
};

const getValueFromAccessor = (row, col) => {
  let value = "";

  if (col.render && typeof col.render === "function") {
    const rendered = col.render(row);
    value = extractCleanText(rendered);
  } else if (col.accessor) {
    if (typeof col.accessor === "function") {
      value = col.accessor(row);
    } else if (typeof col.accessor === "string") {
      try {
        value = col.accessor
          .split(".")
          .reduce((obj, key) => obj?.[key], row);
      } catch {}
    }
  }

  return extractCleanText(value ?? "");
};

export const exportTablePDF = ({
  data = [],
  columns = [],
  fileName = "Report.pdf",
  lang = "ar",
  title = "Report",
}) => {
  if (!data?.length) {
    alert(lang === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
    return;
  }

  const visibleColumns = columns.filter(
    (col) =>
      col.header &&
      col.header !== "no" &&
      col.header !== (lang === "ar" ? "الصور" : "Images") &&
      col.header !== (lang === "ar" ? "الإجراءات" : "Actions")
  );

  const tableHeader = visibleColumns.map((col) => ({
    text: col.header || "",
    style: "tableHeader",
    alignment: "right",
    bold: true,
  }));

const tableBody = data.map((row) =>
  visibleColumns.map((col) => ({
    text: getValueFromAccessor(row, col) || "",
    alignment: "right",
    style: "tableCell",
    rtl: true,                          // ← أضف هذا لكل خلية
  }))
);

const docDefinition = {
  pageSize: "A4",
  pageOrientation: "landscape",
  pageMargins: [40, 80, 40, 60],

  // ✅ مهم جداً لتفعيل RTL
  rtl: true,                          // ← أضف هذا السطر
  direction: 'rtl',                   // ← أو هذا (جرب الاثنين)

  header: () => ({
    text: title,
    alignment: "center",
    margin: [0, 30, 0, 0],
    style: "header",
  }),

  footer: (currentPage, pageCount) => ({
    text: `صفحة ${currentPage} من ${pageCount}   |   تاريخ ووقت الطباعة: ${new Date().toLocaleString('ar-SA')}`,
    alignment: "center",
    margin: [0, 0, 0, 20],
    style: "footer",
  }),

  content: [
    {
      table: {
        headerRows: 1,
        widths: Array(visibleColumns.length).fill("*"),
        body: [tableHeader, ...tableBody],
      },
      layout: 'lightHorizontalLines',
      alignment: 'right',               // ← مهم للجدول
    },
  ],

  styles: {
    header: {
      fontSize: 18,
      bold: true,
      alignment: "center",
    },
    tableHeader: {
      fontSize: 11,
      bold: true,
      fillColor: "#2980b9",
      color: "white",
      alignment: "right",               // ← مهم
    },
    tableCell: {
      fontSize: 10,
      alignment: "right",               // ← مهم جدًا
    },
  },

  defaultStyle: {
    font: "Cairo",                      // أو "Amiri"
    alignment: "right",                 // ← مهم جدًا
    lineHeight: 1.4,
  },
};

  pdfMake.createPdf(docDefinition).download(fileName);
};

export const exportTableExcel = ({
  data = [],
  columns = [],
  fileName = "Report.xlsx",
  title = "التقرير",
  lang = "ar",
}) => {
  const printDate = new Date().toLocaleString('ar-SA', {
    dateStyle: 'long',
    timeStyle: 'medium',
  });

  // إضافة صفوف معلومات في الأعلى
  const infoRows = [
    [title || (lang === "ar" ? "قائمة البيانات" : "Data List")],
    [`تاريخ ووقت الطباعة: ${printDate}`],
    [], // سطر فارغ للفصل
  ];

  // تحويل البيانات الرئيسية
  const headers = columns
    .filter(col => col.header && !["no", "الصور", "الإجراءات"].includes(col.header))
    .map(col => col.header);

  const rows = data.map(row => {
    const rowData = {};
    columns.forEach(col => {
      if (col.header && !["no", "الصور", "الإجراءات"].includes(col.header)) {
        rowData[col.header] = getValueFromAccessor(row, col);
      }
    });
    return rowData;
  });

  // دمج كل شيء
  const worksheetData = [
    ...infoRows.map(row => ({ [headers[0]]: row[0] || "" })), // تحويل لتنسيق json_to_sheet
    headers.reduce((acc, h) => ({ ...acc, [h]: h }), {}),     // header row
    ...rows,
  ];

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // دمج الخلايا للعنوان والتاريخ (اختياري - يجعلها تبدو أجمل)
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // دمج العنوان
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // دمج التاريخ
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, fileName);
};