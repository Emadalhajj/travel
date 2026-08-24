import PublicSectionCard from "../../layout/PublicSectionCard";

export default function DraftBookingInfoCard({ title, items = [] }) {
  return (
    <PublicSectionCard title={title}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-slate-50 p-4"
          >
            <p className="text-xs font-semibold text-slate-500">
              {item.label}
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {item.value ?? "-"}
            </p>
          </div>
        ))}
      </div>
    </PublicSectionCard>
  );
}
