import writeXlsxFile from "write-excel-file/browser";
import { exportTableExcel as exportWithExcelDriver } from "./tableExportCore";

export const exportTableExcel = (options) => exportWithExcelDriver(options, writeXlsxFile);
