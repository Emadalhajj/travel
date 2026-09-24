import { Bed } from "lucide-react";
import { useTranslation } from "react-i18next";

import ActionButton from "../buttons/ActionButton";
import StatusBadge from "../../shared/common/StatusBadge";
import TruncatedText from "../TruncatedText";

export default function UniversalCard({
  title,
  subtitle,

  image,
  icon,

  badges = [],
  meta = [],

  price,
  currency,

  discountPercent = 0,

  isActive = true,
  showStatus = true,

  clickable = false,

  onNavigate,
  onView,
  onEdit,
  onDelete,
  onDuplicate,

  className = "",
}) {
  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleKeyDown = (event) => {
    if (!clickable || !onNavigate) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      handleNavigate();
    }
  };

  const stopPropagation = (handler) => (event) => {
    event.stopPropagation();

    handler?.();
  };

  const hasActions = onView || onEdit || onDelete || onDuplicate;

  const currencyLabel = currency || (isArabic ? "ر.س" : "SAR");

  return (
    <article
      onClick={clickable && onNavigate ? handleNavigate : undefined}
      onKeyDown={handleKeyDown}
      role={clickable && onNavigate ? "link" : undefined}
      tabIndex={clickable && onNavigate ? 0 : undefined}
      className={[
        "group flex h-full flex-col overflow-hidden",

        "rounded-app-lg border border-line",

        "bg-surface",

        "shadow-app",

        "transition-all duration-200",

        "hover:-translate-y-0.5 hover:shadow-app-md",

        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-primary/30",

        clickable && onNavigate ? "cursor-pointer" : "",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* =========================
          MEDIA
      ========================= */}

      <div className="relative h-44 overflow-hidden bg-surface-muted">
        {image ? (
          <img
            src={image}
            alt={title || ""}
            loading="lazy"
            decoding="async"
            className={[
              "h-full w-full object-cover",

              "transition-transform duration-300",

              "group-hover:scale-[1.03]",

              !isActive ? "grayscale opacity-70" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ) : icon ? (
          <div className="flex h-full items-center justify-center text-content-muted">
            {icon}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Bed
              size={40}
              strokeWidth={1.6}
              className="text-content-subtle"
              aria-hidden="true"
            />
          </div>
        )}

        {showStatus && (
          <div className="absolute start-2 top-2">
            <StatusBadge
              value={isActive ? "active" : "inactive"}
              type="user"
              isArabic={isArabic}
            />
          </div>
        )}

        {discountPercent > 0 && (
          <span
            className="
              absolute end-2 top-2

              rounded-full

              border border-rose-200
              bg-rose-600

              px-2.5 py-1

              text-xs font-bold text-white
            "
          >
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* =========================
          CONTENT
      ========================= */}

      <div className="flex flex-1 flex-col p-4">
        {title && (
          <h3 className="m-0 line-clamp-1 text-lg font-semibold text-content">
            {title}
          </h3>
        )}

        {subtitle && (
          <div className="mt-1 text-sm leading-6 text-content-muted">
            <TruncatedText text={subtitle} maxLines={2} />
          </div>
        )}

        {meta.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {meta.map((item, index) => (
              <div
                key={item.key ?? item.label ?? index}
                className="flex min-w-0 items-center gap-2 text-content-muted"
              >
                {item.icon && (
                  <span className="shrink-0 text-primary">{item.icon}</span>
                )}

                <span className="min-w-0 break-words">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((badge, index) => {
              const label = badge?.label ?? badge;

              if (!label) {
                return null;
              }

              return (
                <span
                  key={badge?.key ?? label ?? index}
                  className="
                    inline-flex items-center

                    rounded-full

                    border border-blue-200
                    bg-blue-50

                    px-2.5 py-1

                    text-xs font-semibold
                    text-blue-700
                  "
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {price !== undefined && price !== null && (
          <div className="mt-auto flex items-end gap-1 pt-4">
            <span className="text-2xl font-bold text-content">{price}</span>

            <span className="mb-1 text-sm text-content-muted">
              {currencyLabel}
            </span>
          </div>
        )}
      </div>

      {/* =========================
          ACTIONS
      ========================= */}

      {hasActions && (
        <div
          className="
            flex flex-wrap items-center justify-between gap-2

            border-t border-line

            bg-surface-muted

            px-4 py-3
          "
        >
          <div>
            {onView && (
              <ActionButton
                action="view"
                showLabel
                onClick={stopPropagation(onView)}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onEdit && (
              <ActionButton action="edit" onClick={stopPropagation(onEdit)} />
            )}

            {onDuplicate && (
              <ActionButton
                action="clone"
                onClick={stopPropagation(onDuplicate)}
              />
            )}

            {onDelete && (
              <ActionButton
                action="delete"
                onClick={stopPropagation(onDelete)}
              />
            )}
          </div>
        </div>
      )}
    </article>
  );
}
// import { Bed, Copy, Edit, Eye, Trash2 } from "lucide-react";

// export default function UniversalCard({
//   title,
//   subtitle,
//   onNavigate, // 🆕
//   onDuplicate,
//   image,
//   icon,
//   badges = [],
//   meta = [],
//   price,
//   discountPercent = 0,
//   isActive = true,
//   showStatus = true,
//   clickable = false,
//   onView,
//   onEdit,
//   onDelete,
// }) {
//   const handleNavigate = () => {
//     if (onNavigate) onNavigate();
//   };

//   const handleKeyDown = (event) => {
//     if (!clickable || !onNavigate) return;

//     if (event.key === "Enter" || event.key === " ") {
//       event.preventDefault();
//       handleNavigate();
//     }
//   };

//   return (
//     <div
//       onClick={clickable ? handleNavigate : undefined}
//       onKeyDown={handleKeyDown}
//       role={clickable && onNavigate ? "link" : undefined}
//       tabIndex={clickable && onNavigate ? 0 : undefined}
//       className={`group bg-white rounded-xl border border-gray-200 shadow-sm
//         hover:shadow-lg transition-all duration-300 overflow-hidden
//         ${clickable && onNavigate ? "cursor-pointer" : ""}`}
//     >
//       <div className="relative h-44 overflow-hidden">
//         {image ? (
//           <img
//             src={image}
//             alt={title}
//             loading="lazy"
//             decoding="async"
//             className={`w-full h-full object-cover transition-transform duration-500
//               group-hover:scale-105 ${!isActive ? "grayscale opacity-70" : ""}`}
//           />
//         ) : icon ? (
//           <div className="h-full bg-gray-50 flex items-center justify-center">
//             {icon}
//           </div>
//         ) : (
//           <div className="h-full bg-gray-100 flex items-center justify-center">
//             <Bed size={40} className="text-gray-400" />
//           </div>
//         )}

//         {showStatus && (
//           <span
//             className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-medium ${
//               isActive
//                 ? "bg-emerald-100 text-emerald-700"
//                 : "bg-rose-100 text-rose-700"
//             }`}
//           >
//             {isActive ? "نشط" : "غير نشط"}
//           </span>
//         )}

//         {discountPercent > 0 && (
//           <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
//             -{discountPercent}%
//           </span>
//         )}
//       </div>
//       <div className="p-4">
//         <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
//           {title}
//         </h3>

//         {subtitle && (
//           <p className="text-sm text-gray-500 mt-1 line-clamp-2">{subtitle}</p>
//         )}
//         {/* Meta */}
//         {meta.length > 0 && (
//           <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
//             {meta.map((item, i) => (
//               <div key={i} className="flex items-center gap-2 text-gray-600">
//                 <span className="text-blue-600">{item.icon}</span>
//                 <span>{item.label}</span>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Badge */}
//         {badges.length > 0 && (
//           <div className="mt-4">
//             <span
//               onClick={onNavigate}
//               className="cursor-pointer inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full"
//             >
//               {badges[0]?.label || badges[0]}
//             </span>
//           </div>
//         )}

//         {/* السعر */}
//         {price !== undefined && (
//           <div className="mt-4 flex items-end gap-1">
//             <span className="text-2xl font-bold text-gray-900">{price}</span>
//             <span className="text-sm text-gray-500 mb-1">ر.س</span>
//           </div>
//         )}
//       </div>

//       {/* أزرار التحكم */}
//       {(onView || onEdit || onDelete) && (
//         <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
//           {onView && (
//             <button
//               onClick={onView}
//               className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800"
//             >
//               <Eye size={16} />
//               تفاصيل
//             </button>
//           )}

//           <div className="flex gap-2">
//             {onEdit && (
//               <button
//                 onClick={onEdit}
//                 className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
//               >
//                 <Edit size={16} />
//               </button>
//             )}
//             {onDelete && (
//               <button
//                 onClick={onDelete}
//                 className="p-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
//               >
//                 <Trash2 size={16} />
//               </button>
//             )}
//             {onDuplicate && (
//               <button
//                 onClick={onDuplicate}
//                 className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
//               >
//                 <Copy size={16} />
//               </button>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
