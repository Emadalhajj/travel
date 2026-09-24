import {
  createProductSortOptions,
  PRODUCT_SORT_OPTIONS,
  VISA_SORT_OPTIONS,
} from "./productSortOptions";

test("builds the shared nested product price sort options", () => {
  expect(PRODUCT_SORT_OPTIONS.map((option) => option.value)).toEqual([
    "createdAt_desc",
    "createdAt_asc",
    "pricing.basePrice_asc",
    "pricing.basePrice_desc",
  ]);
});

test("supports products with a top-level price field", () => {
  expect(VISA_SORT_OPTIONS).toEqual(createProductSortOptions("price"));
  expect(VISA_SORT_OPTIONS.map((option) => option.value)).toContain("price_asc");
  expect(VISA_SORT_OPTIONS.map((option) => option.value)).toContain("price_desc");
});
