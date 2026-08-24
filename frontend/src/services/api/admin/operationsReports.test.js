import api from "../api";
import { apiGetBookingOperations, apiGetBookingOperationsDetails } from "./operations";
import { apiGetReportsOverview } from "./reports";

jest.mock("../api", () => ({ get: jest.fn() }));

beforeEach(() => api.get.mockReset());

test("operations and report filters are sent as backend query params", () => {
  const params = { bookingStatus: "confirmed", dateFrom: "2026-08-01" };
  apiGetBookingOperations(params);
  apiGetReportsOverview(params);
  expect(api.get).toHaveBeenNthCalledWith(1, "/operations/bookings", { params });
  expect(api.get).toHaveBeenNthCalledWith(2, "/reports/overview", { params });
});

test("Booking 360 requests the selected booking only", () => {
  apiGetBookingOperationsDetails("booking/id");
  expect(api.get).toHaveBeenCalledWith("/operations/bookings/booking%2Fid");
});
