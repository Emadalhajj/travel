import { useState } from "react";
import { toast } from "react-toastify";
import ActionButton from "./ActionButton";

export default function ExportTableButtons({
  data = [], columns = [], fileName = "Report", filename, lang = "ar", title,
  pdfOptions, excelOptions,
}) {
  const isArabic = lang === "ar";
  const disabled = !data.length;
  const reportTitle = title || (isArabic ? "تقرير البيانات" : "Data Report");
  const resolvedFileName = filename || fileName;
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportExcel = async () => {
    if (exportingExcel) return;
    setExportingExcel(true);
    try {
      const { exportTableExcel } = await import("../../../Utils/tableExportExcel");
      await exportTableExcel({ data, columns, fileName: `${resolvedFileName}.xlsx`, lang, title: reportTitle, excelOptions });
    } catch (error) {
      toast.error(error?.message || (isArabic ? "تعذر تصدير ملف Excel" : "Unable to export Excel"));
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const { exportTablePDF } = await import("../../../Utils/tableExportPdf");
      await exportTablePDF({ data, columns, fileName: `${resolvedFileName}.pdf`, lang, title: reportTitle, pdfOptions });
    } catch (error) {
      toast.error(error?.message || (isArabic ? "تعذر تصدير ملف PDF" : "Unable to export PDF"));
    } finally {
      setExportingPdf(false);
    }
  };
  return (
    <div className="d-flex flex-wrap align-items-center gap-2" dir={isArabic ? "rtl" : "ltr"}>
      <ActionButton
        action="exportPdf"
        showLabel
        disabled={disabled || exportingPdf}
        label={exportingPdf ? (isArabic ? "جارٍ تجهيز PDF..." : "Preparing PDF...") : (isArabic ? "تصدير PDF" : "Export PDF")}
        onClick={handleExportPdf}
      />
      <ActionButton
        action="exportExcel"
        showLabel
        disabled={disabled || exportingExcel}
        label={exportingExcel ? (isArabic ? "جارٍ تجهيز Excel..." : "Preparing Excel...") : (isArabic ? "تصدير Excel" : "Export Excel")}
        onClick={handleExportExcel}
      />
    </div>
  );
}
