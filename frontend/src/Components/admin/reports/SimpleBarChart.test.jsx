import { normalizeChartData } from "./SimpleBarChart";

test("charts handle zero data without invalid percentages", () => {
  expect(normalizeChartData([])).toEqual([]);
  expect(normalizeChartData([{ label: "A", value: 0 }])[0].percentage).toBe(0);
});

test("charts normalize values relative to the largest value", () => {
  const rows = normalizeChartData([{ label: "A", value: 5 }, { label: "B", value: 10 }]);
  expect(rows.map((row) => row.percentage)).toEqual([50, 100]);
});
