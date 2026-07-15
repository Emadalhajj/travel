/*
ينظف النصوص:

حذف المسافات الزائدة
التأكد أن القيمة string
يستخدم مع:

nameAr
nameEn
description
email
address
*/ 
export const normalizeString = (value = "") => {
  if (typeof value !== "string") return "";

  return value.trim();
};