import ActionButton from "./ActionButton";
import { exportTableExcel, exportTablePDF } from "../../../Utils/tableExport";

export default function ExportTableButtons({
  data = [], columns = [], fileName = "Report", filename, lang = "ar", title,
  pdfOptions, excelOptions,
}) {
  const isArabic = lang === "ar";
  const disabled = !data.length;
  const reportTitle = title || (isArabic ? "تقرير البيانات" : "Data Report");
  const resolvedFileName = filename || fileName;
  return (
    <div className="d-flex flex-wrap align-items-center gap-2" dir={isArabic ? "rtl" : "ltr"}>
      <ActionButton
        action="exportPdf"
        showLabel
        disabled={disabled}
        label={isArabic ? "تصدير PDF" : "Export PDF"}
        onClick={() => exportTablePDF({ data, columns, fileName: `${resolvedFileName}.pdf`, lang, title: reportTitle, pdfOptions })}
      />
      <ActionButton
        action="exportExcel"
        showLabel
        disabled={disabled}
        label={isArabic ? "تصدير Excel" : "Export Excel"}
        onClick={() => exportTableExcel({ data, columns, fileName: `${resolvedFileName}.xlsx`, lang, title: reportTitle, excelOptions })}
      />
    </div>
  );
}
