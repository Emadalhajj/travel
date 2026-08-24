// هذه الدوال تقوم بتحويل القيم إلى أنواع معينة مثل boolean أو number أو قائمة من السلاسل النصية. كما تحتوي على دوال لتحليل JSON بأمان واستخراج المفاتيح المحددة من كائن. هذه الأدوات مفيدة عند التعامل مع بيانات النماذج حيث قد تكون القيم في شكل نصي وتحتاج إلى تحويلها إلى أنواع مناسبة للاستخدام في التطبيق.

//الهدف: تحويلات صغيرة عامة فقط

// utils/form/converters.js

export const convertToBoolean = (value) => {
  if (value === true || value === "true" || value === "on" || value === 1)
    return true;
  if (value === false || value === "false" || value === "off" || value === 0)
    return false;
  return value;
};

export const convertToNumber = (value) => {
  if (value === "" || value === null || value === undefined) return value;
  const num = Number(value);
  return isNaN(num) ? value : num;
};

export const convertTimeToMinutes = (value) => {
  if (value === "" || value === null || value === undefined) return value;
  if (typeof value === "number") return value;
  if (!/^\d{2}:\d{2}$/.test(value)) return value;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const convertValueByType = (value, type) => {
  if (type === "number") return convertToNumber(value);
  if (type === "time") return convertTimeToMinutes(value);
  if (type === "checkbox") return convertToBoolean(value);
  return value;
};

// export const toBoolean = (value) => value === true || value === "true";

// export const toNumber = (value, fallback = 0) => {
//   const parsed = Number(value);
//   return Number.isNaN(parsed) ? fallback : parsed;
// };

// export const toNumberOrNull = (value) => {
//   if (value === "" || value === null || value === undefined) return null;

//   const parsed = Number(value);
//   return Number.isNaN(parsed) ? null : parsed;
// };

// export const toStringList = (value) =>
//   String(value || "")
//     .split(/[\n,]/)
//     .map((item) => item.trim())
//     .filter(Boolean);

// export const jsonParseSafe = (value, fallback = {}) => {
//   try {
//     if (value === null || value === undefined || value === "") {
//       return fallback;
//     }

//     return typeof value === "string" ? JSON.parse(value) : value;
//   } catch {
//     return fallback;
//   }
// };

// export const selectedKeysFromObject = (value) =>
//   Object.entries(jsonParseSafe(value, {}))
//     .filter(([, enabled]) => enabled)
//     .map(([key]) => key);

// export const toId = (value) => {
//   if (!value) return "";
//   if (typeof value === "object" && value._id) return String(value._id);
//   return String(value);
// };

// export const toIdList = (value) => {
//   if (!Array.isArray(value)) return [];

//   return value
//     .map((item) => (typeof item === "object" && item?._id ? item._id : item))
//     .filter(Boolean)
//     .map(String);
// };
