export default function EmptyState({
  icon = "📄",
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm border border-slate-100">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
        {icon}
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}