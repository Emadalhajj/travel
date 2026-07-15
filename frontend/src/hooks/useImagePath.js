import { useCallback } from "react";

export const useImagePath = () => {
  const getImageUrl = useCallback((image) => {
    if (!image) return null;

    let img = image.replace(/\\/g, "/"); // تحويل backslashes

    // إذا الصورة فيها URL كامل → استخدمه كما هو
    if (img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }

    // إذا كانت بدون uploads/
    if (!img.includes("uploads")) {
      img = `uploads/${img}`;
    }

    // إضافة الدومين
    return `http://localhost:5000/${img}`;
  }, []);

  return { getImageUrl };
};
