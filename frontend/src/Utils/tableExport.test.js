import {
  buildExcelExportRows,
  buildExportRows,
  buildPdfTableBody,
  getExportColumns,
  resolvePdfLayout,
  exportTablePDF,
} from "./tableExport";
import pdfMake from "pdfmake-rtl";

jest.mock("./documentPdfBranding", () => ({
  loadDocumentBranding: jest.fn().mockResolvedValue({}),
  buildPdfBrandingHeader: jest.fn(() => ({})),
  buildPdfBrandingFooter: jest.fn(() => () => ({})),
  buildPdfPageDecoration: jest.fn(() => ({})),
  PDF_LAYOUT: { contentTop: 100, contentBottom: 100 },
}));

jest.mock("pdfmake-rtl", () => ({
  __esModule: true,
  default: { vfs: {}, createPdf: jest.fn() },
}));
jest.mock("pdfmake-rtl/build/vfs_fonts", () => ({
  __esModule: true,
  default: { vfs: {} },
}));

test("export respects visible and explicitly exportable columns", () => {
  const columns = [
    { header: "Name", accessor: "customer.name" },
    { header: "Hidden", accessor: "hidden", hidden: true },
    { header: "Internal", accessor: "secret", exportable: false },
    { header: "Actions", render: () => "button" },
  ];
  expect(getExportColumns(columns).map((column) => column.header)).toEqual(["Name"]);
  expect(buildExportRows([{ customer: { name: "Ali" }, secret: "no" }], columns).rows).toEqual([["1", "Ali"]]);
});

test("Excel keeps counts and accounting amounts as real numbers", () => {
  const columns = [
    { header: "Bookings", accessor: "bookingsCount" },
    { header: "Gross value", render: (row) => `${row.amount} SAR`, excelAccessor: "amount", excelType: "number" },
    { header: "Currency", accessor: "currency" },
  ];
  const result = buildExcelExportRows([{ bookingsCount: 3, amount: "1250.50", currency: "SAR" }], columns);
  expect(result.rows).toEqual([[1, 3, 1250.5, "SAR"]]);
  expect(typeof result.rows[0][0]).toBe("number");
  expect(typeof result.rows[0][2]).toBe("number");
});

test("Arabic PDF keeps logical column order for pdfmake RTL rendering", () => {
  const columns = [
    { pdfAlignment: "right" },
    { excelType: "number", pdfWrap: false },
  ];
  const body = buildPdfTableBody(
    ["البرنامج", "الحجوزات"],
    [["https://example.com/a-very-long-reference-without-spaces", 5]],
    true,
    columns,
  );
  expect(body[0].map((cell) => cell.text)).toEqual(["البرنامج", "الحجوزات"]);
  expect(body[1].map((cell) => cell.text)).toEqual([
    expect.stringContaining("\u200b"),
    "5",
  ]);
  body.flat().forEach((cell) => {
    expect(cell.rtl).toBe(true);
    expect(cell.columns).toBeUndefined();
  });
});

test("image columns export a usable image URL instead of an empty React cell", () => {
  const result = buildExportRows(
    [{ images: ["programs/example.jpg"] }],
    [{ header: "الصور", exportImageAccessor: "images", render: () => null }],
  );

  expect(result.rows[0][1]).toContain("/uploads/programs/example.jpg");
});

test("Excel neutralizes formula-like user text", () => {
  const result = buildExcelExportRows(
    [{ name: "=HYPERLINK(\"bad\")" }],
    [{ header: "Name", accessor: "name" }],
  );
  expect(result.rows[0][1]).toBe("'=HYPERLINK(\"bad\")");
});

test("PDF automatically switches wide tables to landscape", () => {
  const columns = Array.from({ length: 6 }, (_value, index) => ({
    header: `Column ${index + 1}`,
    accessor: `value${index + 1}`,
  }));
  const headers = columns.map((column) => column.header);
  const rows = [columns.map((_column, index) => `Value ${index + 1}`)];

  expect(resolvePdfLayout({ columns, headers, rows }).orientation).toBe("landscape");
  expect(resolvePdfLayout({
    columns,
    headers,
    rows,
    requestedOrientation: "portrait",
  }).orientation).toBe("portrait");
});

test("export renderers receive row index and never export NaN", () => {
  const result = buildExportRows(
    [{ name: "First" }, { name: "Second" }],
    [{ header: "Number", render: (_row, index) => index + 1 }],
  );

  expect(result.rows).toEqual([["1"], ["2"]]);
  expect(result.headers).toEqual(["الرقم التسلسلي"]);
});

test("Arabic PDF explicitly marks tables as RTL regardless of cell language ratio", async () => {
  const download = jest.fn();
  pdfMake.createPdf.mockReturnValue({ download });

  await exportTablePDF({
    data: [{ name: "Program", amount: 150, status: "active" }],
    columns: [
      { header: "البرنامج", accessor: "name" },
      { header: "السعر", accessor: "amount", excelType: "number" },
      { header: "الحالة", accessor: "status" },
    ],
    lang: "ar",
  });

  const definition = pdfMake.createPdf.mock.calls.at(-1)[0];
  const tableSection = definition.content[0].stack.at(-1);
  expect(tableSection.table.rtl).toBe(true);
  expect(download).toHaveBeenCalled();
});
