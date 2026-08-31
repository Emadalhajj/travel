import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ExportTableButtons from "./ExportTableButtons";

const mockExportExcel = jest.fn();
const mockExportPdf = jest.fn();

jest.mock("../../../Utils/tableExportExcel", () => ({
  exportTableExcel: (...args) => mockExportExcel(...args),
}));
jest.mock("../../../Utils/tableExportPdf", () => ({
  exportTablePDF: (...args) => mockExportPdf(...args),
}));
jest.mock("./ActionButton", () => function MockActionButton({ label, onClick, disabled }) {
  return <button type="button" onClick={onClick} disabled={disabled}>{label}</button>;
});

beforeEach(() => {
  mockExportExcel.mockReset();
  mockExportPdf.mockReset();
});

test("Excel action loads only the Excel driver", async () => {
  render(<ExportTableButtons data={[{ name: "A" }]} columns={[]} lang="en" />);
  fireEvent.click(screen.getByRole("button", { name: "Export Excel" }));

  await waitFor(() => expect(mockExportExcel).toHaveBeenCalledTimes(1));
  expect(mockExportPdf).not.toHaveBeenCalled();
});

test("PDF action loads only the PDF driver", async () => {
  render(<ExportTableButtons data={[{ name: "A" }]} columns={[]} lang="en" />);
  fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));

  await waitFor(() => expect(mockExportPdf).toHaveBeenCalledTimes(1));
  expect(mockExportExcel).not.toHaveBeenCalled();
});
