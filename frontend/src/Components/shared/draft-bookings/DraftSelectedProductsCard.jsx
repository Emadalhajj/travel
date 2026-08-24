import PublicSectionCard from "../../layout/PublicSectionCard";

export default function DraftSelectedProductsCard({
  title,
  items = [],
  isArabic = true,
}) {
  if (!items.length) return null;

  return (
    <PublicSectionCard title={title}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.category}-${item.productId || index}`}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {item.categoryLabel || item.category}
                </span>

                <h3 className="mt-2 font-bold text-slate-900">
                  {getItemName(item, isArabic)}
                </h3>

                {item.quantity && (
                  <p className="mt-1 text-xs text-slate-500">
                    {isArabic ? "الكمية" : "Quantity"}: {item.quantity}
                  </p>
                )}
              </div>

              <strong className="text-sm text-emerald-700">
                {Number(item.priceAtTime || 0).toLocaleString(
                  isArabic ? "en-US" : "en-US"
                )}{" "}
                {item.currency || "SAR"}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </PublicSectionCard>
  );
}

function getItemName(item, isArabic) {
  return isArabic
    ? item.nameAr || item.name?.ar || item.nameEn || item.name || "-"
    : item.nameEn || item.name?.en || item.nameAr || item.name || "-";
}

