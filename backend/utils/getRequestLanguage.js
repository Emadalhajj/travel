/*
لتعريب النصوص الملاحظات وغيرها في هذا الملف، يمكنك اتباع الخطوات التالية:
*/

export const getRequestLanguage = (req) => {
  const language = String(
    req?.headers?.["accept-language"] || "ar",
  ).toLowerCase();

  if (language.startsWith("en")) return "en";
  if (language.startsWith("ar")) return "ar";

  return "ar";
};

export const isArabicRequest = (req) =>
  getRequestLanguage(req) === "ar";
