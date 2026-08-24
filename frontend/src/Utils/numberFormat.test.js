import { formatCurrency, formatNumber, NUMBER_LOCALE } from "./numberFormat";

test("all numbers use English digits regardless of interface language", () => {
  expect(NUMBER_LOCALE).toBe("en-US");
  expect(formatNumber(19705.36)).toBe("19,705.36");
  expect(formatCurrency(19705.36, "SAR")).not.toMatch(/[٠-٩]/);
});
