

export default function PublicActionBar({
  primary,
  secondary,
  className = "",
}) {
  return (
    <div className={`mt-8 flex flex-col md:flex-row gap-3 ${className}`}>
      {primary && (
        <button
          type="button"
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="flex-1 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:bg-slate-400"
        >
          {primary.label}
        </button>
      )}

      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          disabled={secondary.disabled}
          className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
        >
          {secondary.label}
        </button>
      )}
    </div>
  );
}