import React from "react";
import { motion } from "framer-motion";
import UniversalCard from "./UniversalCard";

export default function UniversalCardsContainer({
  items = [],
  loading = false,
  error = null,
  lang = "ar",

  // نصوص الرسالة عند عدم وجود بيانات
  emptyMessageAr = "لا توجد عناصر مضافة بعد",
  emptyMessageEn = "No items added yet",

  // دوال لاستخراج البيانات من كل عنصر (مرنة جداً)
  getImage = (item) => item.thumbnailUrl || item.images?.[0]?.thumbnailUrl || item.images?.[0] || null,
  getTitle = (item) => item.nameAr || item.nameEn || "بدون اسم",
  getSubtitle = (item) => item.descriptionAr || item.descriptionEn || "",

  // للـ badges (مثل نوع الفندق)
  getBadges = (item) => [{ label: "ITEM" }],

  // الدوال المطلوبة لكل بطاقة
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onNavigate,
}) {
  // حالة التحميل يتم التعامل معها خارج المكون (بـ LoadingOverlay)
  if (error) return null;

  // حالة عدم وجود بيانات
  if (!items || items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-5"
      >
        <div className="bg-light rounded-4 p-5">
          <h4 className="text-muted">
            {lang === "ar" ? emptyMessageAr : emptyMessageEn}
          </h4>
        </div>
      </motion.div>
    );
  }

  // عرض البطاقات
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <UniversalCard
          key={item._id}
          title={getTitle(item)}
          subtitle={getSubtitle(item)}
          image={getImage(item) || null}
          isActive={item.isActive ?? true}
          badges={getBadges(item)}
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
