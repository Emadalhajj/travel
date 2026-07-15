import React from "react";
import { Dropdown, ButtonGroup } from "react-bootstrap";
import { FaFileExport, FaFilePdf, FaFileExcel } from "react-icons/fa";
import {
  exportTablePDF,
  exportTableExcel,
} from "../../../Utils/exportTripsPDF";
import { motion } from "framer-motion"; // ← اختياري: لإضافة حركة لطيفة
const ExportTableButtons = ({
  data = [],
  columns = [],
  fileName = "Report",
  lang = "ar",
  title,
}) => {
  const isArabic = lang === "ar";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`d-flex align-items-center gap-2 ${
        isArabic ? "flex-row-reverse" : ""
      }`}
    >
      <Dropdown as={ButtonGroup}>
        <Dropdown.Toggle
          variant="primary"
          id="dropdown-export"
          className="d-flex align-items-center gap-2 shadow-sm"
          style={{
            borderRadius: "12px",
            padding: "10px 20px",
            fontWeight: 500,
            background: "linear-gradient(90deg, #4361ee, #3f37c9)",
            border: "none",
            transition: "all 0.3s ease",
          }}
        >
          <FaFileExport size={18} />
          {isArabic ? "تصدير" : "Export"}
        </Dropdown.Toggle>

        <Dropdown.Menu
          align={isArabic ? "start" : "end"}
          className="border-0 shadow-lg rounded-3 overflow-hidden"
          style={{
            minWidth: "180px",
            borderRadius: "12px",
          }}
        >
          <Dropdown.Item
            onClick={() =>
              exportTablePDF({
                data,
                columns,
                fileName: `${fileName}.pdf`,
                lang,
                title: title || (isArabic ? "تقرير البيانات" : "Data Report"),
              })
            }
            className="d-flex align-items-center gap-3 py-3 px-4 hover-bg-light"
            style={{
              transition: "background 0.2s",
            }}
          >
            <FaFilePdf size={20} className="text-danger" />
            <span className="fw-medium">
              {isArabic ? "ملف PDF" : "PDF File"}
            </span>
          </Dropdown.Item>

          <Dropdown.Item
            onClick={() =>
              exportTableExcel({
                data,
                columns,
                fileName: `${fileName}.xlsx`,
              })
            }
            className="d-flex align-items-center gap-3 py-3 px-4 hover-bg-light"
            style={{
              transition: "background 0.2s",
            }}
          >
            <FaFileExcel size={20} className="text-success" />
            <span className="fw-medium">
              {isArabic ? "ملف Excel" : "Excel File"}
            </span>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* تأثير hover خفيف على الزر الرئيسي */}
      <style jsx>{`
        .hover-bg-light:hover {
          background-color: rgba(0, 0, 0, 0.04) !important;
        }
      `}</style>
    </motion.div>
  );
};

export default ExportTableButtons;

// // src/components/common/ExportTableButtons.jsx
// import React from "react";
// import { Button, ButtonGroup } from "react-bootstrap";
// import { useTranslation } from "react-i18next";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf"; // الاستيراد الافتراضي
// import "jspdf-autotable"; // ← هذا مهم جدًا لتفعيل الـ plugin

// // استيراد الخط (Base64)
// import AmiriRegular from "../../../assets/fonts/Amiri-Regular-normal";

// // دالة تسجيل الخط (نتأكد أنه يُضاف مرة واحدة فقط)
// const registerAmiriFont = (doc) => {
//   const fontList = doc.getFontList();
//   if (!fontList?.Amiri?.normal) {
//     doc.addFileToVFS("Amiri-Regular.ttf", AmiriRegular);
//     doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
//   }
//   doc.setFont("Amiri", "normal");
// };

// // استخراج النص النظيف (بدون تغيير كبير)
// const extractCleanText = (content) => {
//   if (!content) return "";

//   if (typeof content === "string") return content.trim();
//   if (typeof content === "number" || typeof content === "boolean")
//     return content.toString();

//   if (Array.isArray(content)) {
//     return content.map(extractCleanText).filter(Boolean).join(" • ").trim();
//   }

//   if (typeof content === "object" && content !== null) {
//     if (content.props?.children) {
//       return extractCleanText(content.props.children);
//     }
//     return content.toString?.() || "";
//   }

//   return content.toString?.() || "";
// };

// // تنسيق اسم الملف
// const getCurrentDateTime = () => {
//   const now = new Date();
//   const date = now.toISOString().split("T")[0];
//   const time = now.toTimeString().split(" ")[0].slice(0, 5).replace(":", "-");
//   return `${date}_${time}`;
// };

// export default function ExportTableButtons({
//   data = [],
//   columns = [],
//   filename = "table",
//   title = "جدول البيانات",
//   lang = "ar",
// }) {
//   const { t } = useTranslation();

//   const exportToExcel = () => {
//     if (!data?.length) {
//       alert(lang === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
//       return;
//     }

//     const exportColumns = columns.filter(
//       (col) =>
//         col.header &&
//         col.header !== "no" &&
//         col.header !== (lang === "ar" ? "الصور" : "Images") &&
//         col.header !== (lang === "ar" ? "الإجراءات" : "Actions"),
//     );

//     const headers = exportColumns.map((col) => col.header);

//     const rows = data.map((row) =>
//       exportColumns.map((col) => {
//         if (col.render) return extractCleanText(col.render(row));
//         if (col.accessor) return row[col.accessor] ?? "";
//         return "";
//       }),
//     );

//     const worksheetData = [headers, ...rows];
//     const ws = XLSX.utils.aoa_to_sheet(worksheetData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Data");

//     ws["!cols"] = headers.map(() => ({ wch: 25 }));

//     XLSX.writeFile(wb, `${filename}_${getCurrentDateTime()}.xlsx`);
//   };

//   const exportToPDF = () => {
//     if (!data?.length) {
//       alert(lang === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
//       return;
//     }

//     const doc = new jsPDF({
//       orientation: "landscape",
//       unit: "mm",
//       format: "a4",
//     });

//     // تسجيل الخط أولاً
//     registerAmiriFont(doc);

//     // if (lang === "ar") {
//     //   doc.setR2L(true);
//     // }

//     // العنوان
//     doc.setFontSize(16);
//     doc.text(title, doc.internal.pageSize.getWidth() - 15, 15, {
//       align: "right",
//     });
//     // دالة لعكس النص العربي
//     const reverseArabic = (text) => {
//       return text.split("").reverse().join("");
//     };
//     // تاريخ الطباعة

//     doc.setFontSize(12);
// // تنسيق تاريخ الطباعة بناءً على اللغة
//     const printDate =
//       lang === "ar"
//         ? reverseArabic(`تاريخ الطباعة: ${new Date().toLocaleString("ar-SA")}`)
//         : `Printed on: ${new Date().toLocaleString("en-US")}`;

//     doc.text(printDate, doc.internal.pageSize.getWidth() - 15, 22, {
//       align: "right",
//     });

//     const exportColumns = columns.filter(
//       (col) =>
//         col.header &&
//         col.header !== "no" &&
//         col.header !== (lang === "ar" ? "الصور" : "Images") &&
//         col.header !== (lang === "ar" ? "الإجراءات" : "Actions"),
//     );

//     const tableColumns = exportColumns.map((col) => col.header);

//     const tableRows = data.map((row) =>
//       exportColumns.map((col) => {
//         if (col.render) return extractCleanText(col.render(row));
//         if (col.accessor) return row[col.accessor] ?? "";
//         return "";
//       }),
//     );

//     // استخدام doc.autoTable مباشرة (بعد import "jspdf-autotable")
//     doc.autoTable({
//       head: [tableColumns],
//       body: tableRows,
//       startY: 35,
//       styles: {
//         font: "Amiri",
//         fontStyle: "normal",
//         fontSize: 10,
//         cellPadding: 4,
//         overflow: "linebreak",
//         halign: lang === "ar" ? "right" : "left",
//         valign: "middle",
//       },
//       headStyles: {
//         font: "Amiri",
//         fontStyle: "normal",
//         fillColor: [41, 128, 185],
//         textColor: 255,
//         halign: lang === "ar" ? "right" : "left",
//       },
//       alternateRowStyles: { fillColor: [240, 240, 240] },
//       margin: { top: 35, left: 10, right: 10 },
//       theme: "grid",
//       didParseCell: (data) => {
//         // ضمان الاتجاه في كل خلية
//         if (lang === "ar") {
//           data.cell.styles.halign = "right";
//         }
//       },
//     });

//     doc.save(`${filename}_${getCurrentDateTime()}.pdf`);
//   };

//   return (
//     <ButtonGroup className="mb-3">
//       <Button variant="success" onClick={exportToExcel}>
//         {lang === "ar" ? "تصدير Excel" : "Export Excel"}
//       </Button>
//       <Button variant="danger" onClick={exportToPDF}>
//         {lang === "ar" ? "تصدير PDF" : "Export PDF"}
//       </Button>
//     </ButtonGroup>
//   );
// }
