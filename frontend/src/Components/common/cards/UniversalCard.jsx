import { Bed } from "lucide-react";
import { useTranslation } from "react-i18next";
import ActionButton from "../buttons/ActionButton";

export default function UniversalCard({
  title,
  subtitle,
  onNavigate,
  onDuplicate,
  image,
  badges = [],
  meta = [],
  price,
  discountPercent = 0,
  isActive = true,
  onView,
  onEdit,
  onDelete,
}) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      <div className="relative h-44 overflow-hidden sm:h-48">
        {image ? (
          <img
            onClick={onNavigate}
            src={image}
            alt={title || ""}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              !isActive ? "grayscale opacity-70" : ""
            } ${onNavigate ? "cursor-pointer" : ""}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <Bed size={40} className="text-gray-400" />
          </div>
        )}

        <span
          className={`absolute start-2 top-2 rounded-full px-2 py-1 text-xs font-medium ${
            isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {isActive
            ? isArabic ? "نشط" : "Active"
            : isArabic ? "غير نشط" : "Inactive"}
        </span>

        {discountPercent > 0 && (
          <span className="absolute end-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      <div className="flex-1 p-4">
        <h3
          onClick={onNavigate}
          className={`line-clamp-1 text-lg font-semibold text-gray-900 ${onNavigate ? "cursor-pointer" : ""}`}
        >
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{subtitle}</p>
        )}

        {meta.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {meta.map((item, index) => (
              <div key={item.key || index} className="flex min-w-0 items-center gap-2 text-gray-600">
                <span className="shrink-0 text-blue-600">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {badges.length > 0 && (
          <div className="mt-4">
            <span
              onClick={onNavigate}
              className={`inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ${onNavigate ? "cursor-pointer" : ""}`}
            >
              {badges[0]?.label || badges[0]}
            </span>
          </div>
        )}

        {price !== undefined && (
          <div className="mt-4 flex items-end gap-1">
            <span className="text-2xl font-bold text-gray-900">{price}</span>
            <span className="mb-1 text-sm text-gray-500">
              {isArabic ? "ر.س" : "SAR"}
            </span>
          </div>
        )}
      </div>

      {(onView || onEdit || onDelete || onDuplicate) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-gray-50 px-4 py-3">
          <div>
            {onView && (
              <ActionButton action="view" onClick={onView} showLabel />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onEdit && <ActionButton action="edit" onClick={onEdit} />}
            {onDelete && <ActionButton action="delete" onClick={onDelete} />}
            {onDuplicate && <ActionButton action="clone" onClick={onDuplicate} />}
          </div>
        </div>
      )}
    </article>
  );
}
