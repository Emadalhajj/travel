import { LayoutGrid } from "lucide-react";

import UniversalCard from "./UniversalCard";

import EmptyState from "../../shared/common/EmptyState";

export default function UniversalCardsContainer({
  items = [],

  loading = false,
  error = null,

  lang = "ar",

  emptyMessageAr = "لا توجد عناصر مضافة بعد",
  emptyMessageEn = "No items added yet",

  emptyDescriptionAr,
  emptyDescriptionEn,

  emptyIcon = LayoutGrid,

  emptyAction,

  getKey = (item) => item?._id || item?.id,

  getImage = (item) =>
    item?.thumbnailUrl || 
    item?.images?.[0]?.thumbnailUrl ||
    item?.images?.[0] ||
    null,

  getTitle = (item) => item?.nameAr || item?.nameEn || "",

  getSubtitle = (item) => item?.descriptionAr || item?.descriptionEn || "",

  getBadges = () => [],

  getMeta = () => [],

  getPrice,

  getCurrency,

  getIcon = () => null,

  getIsActive = (item) => item?.isActive ?? true,

  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onNavigate,

  showStatus = true,

  clickable = false,

  className = "",
}) {
  /*
   * Loading/Error يتم التعامل معهما في مستوى الصفحة
   * بواسطة LoadingOverlay / ErrorOverlay.
   */
  if (loading || error) {
    return null;
  }

  if (!items?.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={lang === "ar" ? emptyMessageAr : emptyMessageEn}
        description={lang === "ar" ? emptyDescriptionAr : emptyDescriptionEn}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      className={[
        "grid grid-cols-1 gap-4",

        "sm:grid-cols-2",

        "lg:grid-cols-3",

        "2xl:grid-cols-4", // تعني أن كل بطاقة ستأخذ 1/4 من عرض الحاوية على الشاشات الكبيرة جدًا

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item, index) => (
        <UniversalCard
          key={getKey(item) ?? index}
          title={getTitle(item)}
          subtitle={getSubtitle(item)}
          image={getImage(item) || null}
          icon={getIcon(item)}
          isActive={getIsActive(item)}
          showStatus={showStatus}
          clickable={clickable}
          badges={getBadges(item) || []}
          meta={getMeta(item) || []}
          price={getPrice ? getPrice(item) : undefined}
          currency={getCurrency ? getCurrency(item) : undefined}
          onView={onView ? () => onView(item) : undefined}
          onEdit={onEdit ? () => onEdit(item) : undefined}
          onDelete={onDelete ? () => onDelete(item) : undefined}
          onDuplicate={onDuplicate ? () => onDuplicate(item) : undefined}
          onNavigate={onNavigate ? () => onNavigate(item) : undefined}
        />
      ))}
    </div>
  );
}

