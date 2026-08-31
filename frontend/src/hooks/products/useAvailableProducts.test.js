import { act, renderHook } from "@testing-library/react";

import { apiGetAvailablePackageProducts } from "../../services/api/admin/availability";
import useAvailableProducts from "./useAvailableProducts";

jest.mock("../../services/api/admin/availability", () => ({
  apiGetAvailablePackageProducts: jest.fn(),
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
