// src/utils/textUtils.js

/**
 * تقطيع النص إلى عدد محدد من الكلمات مع إمكانية "عرض المزيد / إخفاء"
 *
 * @param {string} text - النص الأصلي
 * @param {number} limit - عدد الكلمات المسموح بعرضها (افتراضي 30)
 * @returns {object} { shortText, hasMore, fullText }
 */
export const useTruncatedText = (text, limit = 30) => {
  if (!text || typeof text !== "string") {
    return { shortText: "", hasMore: false, fullText: "" };
  }

  const words = text.trim().split(/\s+/); // تقسيم حسب المسافات (يدعم العربي والإنجليزي)

  const shortText = words.slice(0, limit).join(" ");
  const hasMore = words.length > limit;
  const fullText = text;

  return { shortText, hasMore, fullText };
};