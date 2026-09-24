import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";

import {
  apiGetAvailablePackageProducts,
  apiSearchPublicAccommodations,
} from "../../services/api/admin/availability";
import useAvailableProducts from "./useAvailableProducts";

jest.mock("../../services/api/admin/availability", () => ({
  apiGetAvailablePackageProducts: jest.fn(),
  apiSearchPublicAccommodations: jest.fn(),
}));

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

beforeEach(() => {
  jest.useFakeTimers();
  apiGetAvailablePackageProducts.mockReset();
  apiSearchPublicAccommodations.mockReset();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test("debounces and deduplicates identical availability queries", async () => {
  const request = deferred();
  apiGetAvailablePackageProducts.mockReturnValue(request.promise);
  const { result } = renderHook(() => useAvailableProducts());
  const query = { startDate: "2026-09-01", endDate: "2026-09-10", pilgrimsCount: 2 };

  act(() => {
    result.current.fetchProductsByDate(query);
    result.current.fetchProductsByDate(query);
    jest.advanceTimersByTime(250);
  });

  expect(apiGetAvailablePackageProducts).toHaveBeenCalledTimes(1);
  await act(async () => {
    request.resolve({ data: { data: { hotels: [] } } });
  });

  act(() => result.current.fetchProductsByDate(query));
  jest.advanceTimersByTime(300);
  expect(apiGetAvailablePackageProducts).toHaveBeenCalledTimes(1);
});

test("an older response cannot replace results from a newer query", async () => {
  const first = deferred();
  const second = deferred();
  apiGetAvailablePackageProducts
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);

  const { result } = renderHook(() => useAvailableProducts());

  act(() => {
    result.current.fetchProductsByDate({
      startDate: "2026-09-01",
      endDate: "2026-09-10",
      pilgrimsCount: 1,
    });
    jest.advanceTimersByTime(250);
  });

  const firstSignal = apiGetAvailablePackageProducts.mock.calls[0][1].signal;

  act(() => {
    result.current.fetchProductsByDate({
      startDate: "2026-09-01",
      endDate: "2026-09-10",
      pilgrimsCount: 3,
    });
    jest.advanceTimersByTime(250);
  });

  expect(firstSignal.aborted).toBe(true);

  await act(async () => {
    second.resolve({ data: { data: { hotels: [{ _id: "new" }] } } });
  });
  expect(result.current.availableProducts.hotels[0]._id).toBe("new");

  await act(async () => {
    first.resolve({ data: { data: { hotels: [{ _id: "old" }] } } });
  });
  expect(result.current.availableProducts.hotels[0]._id).toBe("new");
});

test("browse requests complete under React Strict Mode without a stuck loading state", async () => {
  apiGetAvailablePackageProducts.mockResolvedValue({
    data: { data: { transports: [{ _id: "transport-1" }] } },
  });
  const wrapper = ({ children }) => <StrictMode>{children}</StrictMode>;
  const { result } = renderHook(() => useAvailableProducts(), { wrapper });

  act(() => {
    result.current.fetchProductsByDate({
      category: "transports",
      mode: "browse",
      pilgrimsCount: 1,
    });
    jest.advanceTimersByTime(250);
  });

  await act(async () => Promise.resolve());

  expect(result.current.loadingProducts).toBe(false);
  expect(result.current.availableProducts.transports).toHaveLength(1);
});

test("room types use the public accommodation search contract", async () => {
  apiSearchPublicAccommodations.mockResolvedValue({
    data: { data: [{ _id: "room-1" }], pagination: { page: 1, total: 1 } },
  });
  const { result } = renderHook(() => useAvailableProducts());

  act(() => {
    result.current.fetchProductsByDate({
      category: "roomTypes",
      mode: "availability",
      startDate: "2026-10-01",
      endDate: "2026-10-06",
      adults: 2,
      children: 1,
      roomsCount: 2,
      city: "جدة",
    });
    jest.advanceTimersByTime(250);
  });
  await act(async () => Promise.resolve());

  expect(apiGetAvailablePackageProducts).not.toHaveBeenCalled();
  expect(apiSearchPublicAccommodations).toHaveBeenCalledWith(
    expect.objectContaining({
      checkIn: "2026-10-01",
      checkOut: "2026-10-06",
      adults: 2,
      children: 1,
      roomsCount: 2,
      city: "جدة",
    }),
    expect.any(Object),
  );
  expect(result.current.availableProducts.roomTypes).toHaveLength(1);
});
