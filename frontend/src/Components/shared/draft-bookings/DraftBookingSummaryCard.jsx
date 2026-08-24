import PublicButton from "../buttons/PublicButton";

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
              {row.value ?? "-"}
            </strong>
          </div>
        ))}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 space-y-3">
          {primaryAction && (
            <PublicButton
              fullWidth
              variant={primaryAction.variant || "primary"}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              loading={primaryAction.loading}
            >
              {primaryAction.label}
            </PublicButton>
          )}

          {secondaryAction && (
            <PublicButton
              fullWidth
              variant={secondaryAction.variant || "dangerOutline"}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              loading={secondaryAction.loading}
            >
              {secondaryAction.label}
            </PublicButton>
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
