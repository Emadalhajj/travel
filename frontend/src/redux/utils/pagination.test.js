import { createEmptyPagination, normalizePagination } from "./pagination";

describe("pagination normalization", () => {
  it("creates the frontend pagination contract", () => {
    expect(createEmptyPagination()).toEqual({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });

  it("maps legacy pages to totalPages", () => {
    expect(normalizePagination({ total: 25, page: 2, limit: 10, pages: 3 }))
      .toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
  });

  it("normalizes nested pagination and preserves fallbacks", () => {
    expect(normalizePagination(
      { pagination: { total: 7, pages: 2 } },
      { page: 3, limit: 5, totalPages: 4 },
    )).toEqual({ total: 7, page: 3, limit: 5, totalPages: 2 });
  });
});
