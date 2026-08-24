const toneStyles = {
  emerald: { card: "border-emerald-100 from-emerald-50 to-white", accent: "bg-emerald-500", icon: "bg-emerald-100 text-emerald-700", value: "text-emerald-950" },
  blue: { card: "border-blue-100 from-blue-50 to-white", accent: "bg-blue-500", icon: "bg-blue-100 text-blue-700", value: "text-blue-950" },
  amber: { card: "border-amber-100 from-amber-50 to-white", accent: "bg-amber-500", icon: "bg-amber-100 text-amber-700", value: "text-amber-950" },
  rose: { card: "border-rose-100 from-rose-50 to-white", accent: "bg-rose-500", icon: "bg-rose-100 text-rose-700", value: "text-rose-950" },
  slate: { card: "border-slate-200 from-slate-50 to-white", accent: "bg-slate-500", icon: "bg-slate-100 text-slate-700", value: "text-slate-950" },
  violet: { card: "border-violet-100 from-violet-50 to-white", accent: "bg-violet-500", icon: "bg-violet-100 text-violet-700", value: "text-violet-950" },
};

export default function ReportKpiCard({ label, value, hint, tone = "emerald", icon: Icon }) {
  const styles = toneStyles[tone] || toneStyles.slate;
  return (
    <article className={`relative flex min-h-44 flex-col overflow-hidden rounded-3xl border bg-gradient-to-b p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${styles.card}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 ${styles.accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[75%] text-sm font-bold leading-6 text-slate-600">{label}</p>
        {Icon && <span className={`rounded-2xl p-2.5 ${styles.icon}`}><Icon size={20} aria-hidden="true" /></span>}
      </div>
      <p
        className={`mt-auto whitespace-nowrap pt-6 text-xl font-black leading-tight tabular-nums sm:text-2xl ${styles.value}`}
        dir="ltr"
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>}
    </article>
  );
}
