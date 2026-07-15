// utils/domain/normalizeCapacity.js

/**
 * تطبيع السعة (بالغين + أطفال)
 * تُستخدم في: الفنادق، النقل، الرحلات
 */
export const normalizeCapacity = (capacity = {}) => {
  return {
    maxAdults: Math.max(1, Number(capacity.maxAdults) || 1),
    maxChildren: Math.max(0, Number(capacity.maxChildren) || 0),
    // يمكن إضافة totalOccupancy المحسوب لاحقًا في pre-save
  };
};