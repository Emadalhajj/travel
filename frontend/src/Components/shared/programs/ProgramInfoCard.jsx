export default function ProgramInfoCard({ title, items = [] }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      <h2 className="mb-5 text-xl font-bold text-slate-900">
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-slate-50 p-4"
          >
            <p className="text-xs font-semibold text-slate-500">
              {item.label}
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {item.value || "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}