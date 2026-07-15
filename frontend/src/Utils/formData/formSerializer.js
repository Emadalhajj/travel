// // هذا الملف يحتوي على مجموعة من الدوال التي تساعد في التعامل مع بيانات النماذج في تطبيق React. تشمل هذه الدوال استخراج البيانات من FormData، بناء حمولة (payload) بناءً على تكوين الحقول، وإنشاء FormData جديد لإرسال الطلبات. الهدف هو تسهيل عملية التعامل مع البيانات في النماذج وتحويلها إلى تنسيقات مناسبة للاستخدام في التطبيق أو لإرسالها إلى الخادم.
// //الهدف: تحويل FormData إلى raw object، ثم بناء payload عام اعتمادًا على config


// import { setNestedValue } from "./setNestedValue";

// export const extractFormDataEntries = (fd, ignoredKeys = []) => {
//   const rawData = {};

//   [...fd.entries()].forEach(([key, value]) => {
//     if (ignoredKeys.includes(key)) return;

//     if (rawData[key] !== undefined) {
//       rawData[key] = Array.isArray(rawData[key])
//         ? [...rawData[key], value]
//         : [rawData[key], value];
//     } else {
//       rawData[key] = value;
//     }
//   });

//   return rawData;
// };

// export const buildPayloadFromConfig = (rawData, fields = []) => {
//   let payload = {};

//   fields.forEach((field) => {
//     const rawValue = rawData[field.name];

//     const value =
//       typeof field.serialize === "function"
//         ? field.serialize(rawValue, rawData)
//         : rawValue;

//     const targetPath = field.targetName || field.name;
//     payload = setNestedValue(payload, targetPath, value);
//   });

//   return payload;
// };

// export const createRequestFormData = ({
//   sourceFd,
//   payload,
//   fileFields = ["images"],
//   deletedSuffix = "Deleted[]",
//   deletedTargetName = "deleteImages[]",
// }) => {
//   const requestData = new FormData();
//   requestData.append("data", JSON.stringify(payload));

//   [...sourceFd.entries()].forEach(([key, value]) => {
//     if (fileFields.includes(key) && value instanceof File) {
//       requestData.append(key, value);
//     }

//     if (key.endsWith(deletedSuffix)) {
//       requestData.append(deletedTargetName, value);
//     }
//   });

//   return requestData;
// };
