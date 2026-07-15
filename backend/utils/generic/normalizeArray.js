/*
تحويل أي قيمة إلى Array.
يستخدم مع:

facilities
roomTypes
services
tags
*/ 
export const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
};