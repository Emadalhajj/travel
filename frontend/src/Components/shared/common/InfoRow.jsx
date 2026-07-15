export default function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="text-sm text-slate-900 text-end">
        {value || "-"}
      </strong>
    </div>
  );
}