import React from "react";
import UniversalCard from "./UniversalCard";
import EmptyState from "../../shared/common/EmptyState";

export default function UniversalCardsContainer({
  items = [],
  loading = false,
  error = null,
  lang = "ar",
  emptyMessageAr = "لا توجد عناصر مضافة بعد",
  emptyMessageEn = "No items added yet",
  getImage = (item) => item.thumbnailUrl || item.images?.[0]?.thumbnailUrl || item.images?.[0] || null,
  getTitle = (item) => item.nameAr || item.nameEn || (lang === "ar" ? "بدون اسم" : "Unnamed"),
  getSubtitle = (item) => item.descriptionAr || item.descriptionEn || "",
  getBadges = () => [{ label: "ITEM" }],
  getMeta = () => [],
  getPrice,
  getDiscountPercent,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onNavigate,
}) {
  if (loading || error) return null;

  if (!items?.length) {
    return (
      <EmptyState
        title={lang === "ar" ? emptyMessageAr : emptyMessageEn}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, index) => (
        <UniversalCard
          key={item._id || item.id || index}
          title={getTitle(item)}
          subtitle={getSubtitle(item)}
          image={getImage(item)}
          isActive={item.isActive ?? true}
          badges={getBadges(item)}
          meta={getMeta(item)}
          price={getPrice ? getPrice(item) : undefined}
          discountPercent={getDiscountPercent ? getDiscountPercent(item) : 0}
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
