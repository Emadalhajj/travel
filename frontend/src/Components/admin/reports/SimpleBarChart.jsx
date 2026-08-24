export const normalizeChartData = (data = []) => {
  const safe = data.map((item) => ({
    label: String(item?.label || "-"),
    value: Math.max(0, Number(item?.value) || 0),
  }));
  const max = Math.max(0, ...safe.map((item) => item.value));
  return safe.map((item) => ({ ...item, percentage: max ? (item.value / max) * 100 : 0 }));
};

const barColors = [
  "from-blue-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-violet-500 to-fuchsia-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-slate-600 to-slate-400",
];

export default function SimpleBarChart({ data = [], emptyLabel = "No data", valueFormatter = String }) {
  const rows = normalizeChartData(data);
  if (!rows.length || rows.every((row) => row.value === 0)) {
    return <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">{emptyLabel}</div>;
  }
  return (
    <div className="overflow-x-auto pb-1" role="img" aria-label="bar chart">
      <div className="flex min-h-64 min-w-max items-end gap-3 border-b border-slate-200 px-2 pt-8 sm:gap-5">
        {rows.map((row, index) => (
          <div key={row.label} className="flex w-20 flex-col items-center sm:w-24">
            <span className="mb-2 text-xs font-black text-slate-800">{valueFormatter(row.value)}</span>
            <div className="flex h-40 w-full items-end justify-center rounded-t-2xl bg-slate-50/80 px-2">
              <div
                className={`w-full rounded-t-xl bg-gradient-to-t shadow-sm transition-all duration-500 ${barColors[index % barColors.length]}`}
                style={{ height: `${Math.max(row.percentage, 5)}%` }}
                title={`${row.label}: ${valueFormatter(row.value)}`}
              />
            </div>
            <span className="mt-3 line-clamp-2 min-h-10 text-center text-xs font-semibold leading-5 text-slate-600">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
