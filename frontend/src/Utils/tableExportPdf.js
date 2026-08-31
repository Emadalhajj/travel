import pdfMake from "pdfmake-rtl";
import pdfFonts from "pdfmake-rtl/build/vfs_fonts";
import { exportTablePDF as exportWithPdfMake } from "./tableExportCore";

pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || {};

export const exportTablePDF = (options) => exportWithPdfMake(options, pdfMake);
