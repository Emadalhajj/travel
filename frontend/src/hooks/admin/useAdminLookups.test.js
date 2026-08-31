import { act, renderHook } from "@testing-library/react";
import useAdminLookups, { resetAdminLookupCacheForTests } from "./useAdminLookups";
import { apiGetAdminLookup } from "../../services/api/admin/lookups";

jest.mock("../../services/api/admin/lookups", () => ({
  apiGetAdminLookup: jest.fn(),
  apiGetHotelLookupById: jest.fn(),
}));

describe("useAdminLookups", () => {
  beforeEach(() => {
    resetAdminLookupCacheForTests();
    jest.clearAllMocks();
  });

  it("deduplicates concurrent requests and reuses the fresh lookup", async () => {
    const rows = [{ _id: "1", nameAr: "فندق", nameEn: "Hotel" }];
    apiGetAdminLookup.mockResolvedValue(rows);
    const { result } = renderHook(() => useAdminLookups());

    await act(async () => {
      await Promise.all([
        result.current.loadLookup("hotels"),
        result.current.loadLookup("hotels"),
      ]);
    });
    await act(async () => {
      await result.current.loadLookup("hotels");
    });

    expect(apiGetAdminLookup).toHaveBeenCalledTimes(1);
    expect(result.current.lookups.hotels).toEqual(rows);
  });
});
