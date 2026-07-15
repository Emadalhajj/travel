import { Bed, Copy, Edit, Eye, Trash2 } from "lucide-react";

export default function UniversalCard({
  title,
  subtitle,
  onNavigate, // 🆕
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
  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* الصورة */}
      <div className="relative h-44 overflow-hidden">
        {image ? (
          <img
          onClick={onNavigate}
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              !isActive ? "grayscale opacity-70" : ""
            }`}
          />
        ) : (
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <Bed size={40} className="text-gray-400" />
          </div>
        )}

        {/* الحالة */}
        <span
          className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-medium ${
            isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {isActive ? "نشط" : "غير نشط"}
        </span>

        {/* الخصم */}
        {discountPercent > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* المحتوى */}
      <div className="p-4">
        <h3
          style={{ cursor: onNavigate ? "pointer" : "default" }}
          onClick={onNavigate}
          className="font-semibold text-gray-900 text-lg line-clamp-1"
        >
          {title}
        </h3>

        {subtitle && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{subtitle}</p>
        )}

        {/* Meta */}
        {meta.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            {meta.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-600">
                <span className="text-blue-600">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Badge */}
        {badges.length > 0 && (
          <div className="mt-4">
            <span
              onClick={onNavigate}
              className="cursor-pointer inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
              {badges[0]?.label || badges[0]}
            </span>
          </div>
        )}

        {/* السعر */}
        {price !== undefined && (
          <div className="mt-4 flex items-end gap-1">
            <span className="text-2xl font-bold text-gray-900">{price}</span>
            <span className="text-sm text-gray-500 mb-1">ر.س</span>
          </div>
        )}
      </div>

      {/* أزرار التحكم */}
      {(onView || onEdit || onDelete) && (
        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
          {onView && (
            <button
              onClick={onView}
              className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Eye size={16} />
              تفاصيل
            </button>
          )}

          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
              >
                <Edit size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
              >
                <Trash2 size={16} />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
              >
                <Copy size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
