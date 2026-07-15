export default function DraftBookingSummaryCard({
  title,
  rows = [],
  note,
  primaryAction,
  secondaryAction,
}) {
  return (
    <aside className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 h-fit">
      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      <div className="mt-5 space-y-3 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-slate-500">{row.label}</span>

            <strong className="text-end text-slate-900">
              {row.value || "-"}
            </strong>
          </div>
        ))}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 space-y-3">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:bg-slate-400"
            >
              {primaryAction.label}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="w-full rounded-xl bg-red-50 px-5 py-3 font-bold text-red-700 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {note && (
        <p className="mt-4 text-xs leading-6 text-slate-500">
          {note}
        </p>
      )}
    </aside>
  );
}