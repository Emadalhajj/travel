// // هذه الدالة تقوم بتحويل البيانات إلى تنسيق مناسب للاستخدام في نماذج الإدخال. تأخذ البيانات الأصلية وتقوم بتحويلها بحيث تكون متوافقة مع الحقول المختلفة في النماذج، مثل تحويل التواريخ إلى تنسيق ISO أو استخراج معرفات الكائنات. هذا يساعد في تسهيل عملية ملء النماذج بالبيانات الموجودة بالفعل عند تحرير الكيانات أو نسخها.
// //الهدف: تجهيز بيانات السيرفر لتناسب عرضها في الفورم، بشكل عام فقط


// const isPlainObject = (value) =>
//   Object.prototype.toString.call(value) === "[object Object]";

// const isObjectIdLike = (value) =>
//   isPlainObject(value) &&
//   value._id &&
//   Object.keys(value).length === 1;

// const isIsoDateString = (value) =>
//   typeof value === "string" &&
//   /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

// export const normalizeForForm = (data) => {
//   if (data === null || data === undefined) return "";

//   if (data instanceof Date) {
//     return data.toISOString().split("T")[0];
//   }

//   if (isIsoDateString(data)) {
//     return data.split("T")[0];
//   }

//   if (isObjectIdLike(data)) {
//     return String(data._id);
//   }

//   if (Array.isArray(data)) {
//     return data.map((item) => normalizeForForm(item));
//   }

//   if (isPlainObject(data)) {
//     const normalized = {};

//     Object.keys(data).forEach((key) => {
//       normalized[key] = normalizeForForm(data[key]);
//     });

//     return normalized;
//   }

//   return data;
// };
