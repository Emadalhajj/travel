
// نسخة كائن الكيان مع تعديل الحقول المناسبة بناءً على النوع

export const cloneEntity = (entity, type) => {
  
    const clone = structuredClone(entity);//

  // مفاتيح مشتركة
  delete clone._id; // حذف المعرف الأصلي
  delete clone.createdAt; // حذف تاريخ الإنشاء
  delete clone.updatedAt; // حذف تاريخ التحديث


  if (type === "hotel") {
    clone.nameAr += " (نسخة)";
    clone.nameEn += " (Copy)";
    clone.roomTypes = [];
  }

  if (type === "room") {
    clone.nameAr += " (نسخة)";
  }

  if (type === "visa") {
    clone.titleAr += " (نسخة)";
  }

  return clone;
};
