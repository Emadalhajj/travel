import PublicButton from "../buttons/PublicButton";

export default function EmptyState({
  icon = "📄",
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "primary",
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
        <div className="mt-6">
          <PublicButton variant={actionVariant} onClick={onAction}>
            {actionLabel}
          </PublicButton>
        </div>
      )}
    </div>
  );
}
