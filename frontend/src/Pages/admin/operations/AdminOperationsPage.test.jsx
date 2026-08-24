import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminOperationsPage from "./AdminOperationsPage";
import { apiGetBookingOperations } from "../../../services/api/admin/operations";
import { apiGetReportsOverview } from "../../../services/api/admin/reports";

jest.mock("react-i18next", () => ({ useTranslation: () => ({ i18n: { language: "ar" } }) }));
jest.mock("../../../services/api/admin/operations", () => ({ apiGetBookingOperations: jest.fn() }));
jest.mock("../../../services/api/admin/reports", () => ({ apiGetReportsOverview: jest.fn() }));
jest.mock("../../../Components/layout/PageHeader", () => () => <h1>لوحة العمليات</h1>);
jest.mock("../../../Components/layout/PublicSectionCard", () => ({ children, title }) => <section><h2>{title}</h2>{children}</section>);
jest.mock("../../../Components/common/feedback/LoadingOverlay", () => ({ show }) => show ? <div>loading</div> : null);
jest.mock("../../../Components/common/feedback/ErrorOverlay", () => ({ show, message }) => show ? <div>{message}</div> : null);
jest.mock("../../../Components/common/buttons/ExportTableButtons", () => () => null);
jest.mock("../../../Components/common/Pagination", () => () => null);
jest.mock("../../../Components/admin/reports/ReportKpiCard", () => ({ label, value }) => <div>{label}:{value}</div>);
jest.mock("../../../Components/shared/common/StatusBadge", () => ({ value }) => <span>{value}</span>);
jest.mock("../../../Components/common/buttons/ActionButton", () => ({ action, onClick, label }) => <button onClick={onClick}>{label || action}</button>);
jest.mock("../../../Components/common/tables/UniversalTable", () => ({ data, emptyMessage }) => data.length
  ? <div>{data.map((item) => `${item.bookingNumber}:${item.attentionRequired}`).join(",")}</div>
  : <div>{emptyMessage}</div>);

const overview = {
  data: { data: {
    bookings: { attentionRequired: 1 },
    payments: { failedTransactions: 0, paidPendingBooking: 1 },
    bankTransfers: { pendingReview: 0 },
  } },
};

beforeEach(() => {
  apiGetBookingOperations.mockReset();
  apiGetReportsOverview.mockReset();
  apiGetReportsOverview.mockResolvedValue(overview);
});

const renderPage = () => render(<MemoryRouter><AdminOperationsPage /></MemoryRouter>);

test("operations page handles loading, empty results and RTL", async () => {
  apiGetBookingOperations.mockResolvedValue({ data: { items: [], pagination: {} } });
  const { container } = renderPage();
  expect(screen.getByText("loading")).not.toBeNull();
  expect(container.firstChild.getAttribute("dir")).toBe("rtl");
  expect(await screen.findByText("لا توجد حالات تشغيلية ضمن الفلاتر")).not.toBeNull();
});

test("attentionRequired is displayed and filters update backend query after apply", async () => {
  apiGetBookingOperations.mockResolvedValue({
    data: { items: [{ id: "1", bookingNumber: "BK-1", attentionRequired: true }], pagination: {} },
  });
  renderPage();
  expect(await screen.findByText("BK-1:true")).not.toBeNull();
  fireEvent.change(screen.getByLabelText("bookingStatus"), { target: { value: "confirmed" } });
  fireEvent.click(screen.getByText("apply"));
  await waitFor(() => expect(apiGetBookingOperations).toHaveBeenLastCalledWith(expect.objectContaining({ bookingStatus: "confirmed" })));
});

test("operations page displays backend errors", async () => {
  apiGetBookingOperations.mockRejectedValue({ response: { data: { message: "Backend error" } } });
  renderPage();
  expect(await screen.findByText("Backend error")).not.toBeNull();
});
