export default function ProgramServicesCard({
  title,
  emptyText,
  items = [],
  isArabic = true,
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      <h2 className="mb-5 text-xl font-bold text-slate-900">
        {title}
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <ServiceRow
              key={item._id || item.refId || index}
              item={item}
              isArabic={isArabic}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ServiceRow({ item, isArabic }) {
  const name = getName(item, isArabic);

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div>
        <h3 className="font-bold text-slate-900">
          {name}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {item.type || item.category || "-"}
        </p>
      </div>

      <div className="text-sm font-bold text-emerald-700">
        {item.priceAtTime || item.price || 0} {item.currency || "SAR"}
      </div>
    </div>
  );
}

function getName(item, isArabic) {
  return isArabic
    ? item.nameAr || item.name?.ar || item.nameEn || item.name?.en || "-"
    : item.nameEn || item.name?.en || item.nameAr || item.name?.ar || "-";
}