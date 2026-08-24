// utils/form/normalize.js

/*
=====================================================
Form Normalizer
=====================================================

DB → Form

مسؤول عن تحويل بيانات قاعدة البيانات إلى شكل
متوافق مع UniversalForm.

يدعم:
-----------------------------------------------------
- Dates
- ObjectIds
- Arrays
- Checkbox Groups
- Nested Fields
=====================================================
*/

import { buildFieldMap } from "./fieldMap";

/*
=====================================================
Helpers
=====================================================
*/

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === "[object Object]";

const isObjectIdLike = (value) =>
  isPlainObject(value) && value._id && Object.keys(value).length === 1;

const isDateString = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

const arrayToCheckboxObject = (values = []) =>
  values.reduce((result, item) => {
    /*
      checkbox-group يفترض أن القيم نصوص أو أرقام.

      نتجنب إنشاء مفتاح undefined أو null.
      */

    if (item !== undefined && item !== null) {
      result[String(item)] = true;
    }

    return result;
  }, {});

/*
=====================================================
Normalize For Form
=====================================================
*/

export const normalizeForForm = (data, config) => {
  const fieldMap = buildFieldMap(config);

  /*
  path يحتوي المسار الكامل للحقل.

  أمثلة:
  -----------------------------------------------------
  supportedPaymentMethods
  credentials.entityId
  settings.methods
  */

  const normalize = (value, path = "") => {
    /*
    لا نحول false أو 0 إلى قيمة فارغة.

    فقط null وundefined.
    */

    if (value === null || value === undefined) {
      return "";
    }

    if (fieldMap[path] === "time" && typeof value === "number") {
      const hours = Math.floor(value / 60).toString().padStart(2, "0");
      const minutes = (value % 60).toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    /*
    =============================================
    Date
    =============================================
    */

    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }

    if (isDateString(value)) {
      return value.split("T")[0];
    }

    /*
    =============================================
    ObjectId
    =============================================
    */

    if (isObjectIdLike(value)) {
      return String(value._id);
    }

    /*
    =============================================
    Array
    =============================================
    */

    if (Array.isArray(value)) {
      /*
      دعم checkbox-group سواء كان الحقل في المستوى
      الرئيسي أو داخل مسار متداخل.
      */

      if (fieldMap[path] === "checkbox-group") {
        return arrayToCheckboxObject(value);
      }

      /*
      مصفوفة ObjectIds.
      */

      if (value.length > 0 && value.every(isObjectIdLike)) {
        return value.map((item) => String(item._id));
      }

      /*
      المحافظة على المسار عند تطبيع عناصر المصفوفة.
      */

      return value.map((item, index) =>
        normalize(item, path ? `${path}.${index}` : String(index)),
      );
    }

    /*
    =============================================
    Object
    =============================================
    */

    if (isPlainObject(value)) {
      const result = {};

      Object.keys(value).forEach((key) => {
        const nestedPath = path ? `${path}.${key}` : key;

        result[key] = normalize(value[key], nestedPath);
      });

      return result;
    }

    return value;
  };

  return normalize(data);
};

// // utils/form/normalize.js
// // DB → Form
// import { buildFieldMap } from "./fieldMap";

// const isPlainObject = (val) =>
//   Object.prototype.toString.call(val) === "[object Object]";

// const isObjectIdLike = (val) =>
//   isPlainObject(val) && val._id && Object.keys(val).length === 1;

// const isDateString = (val) =>
//   typeof val === "string" &&
//   /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);

// const arrayToCheckboxObject = (arr = []) =>
//   arr.reduce((acc, item) => {
//     acc[item] = true;
//     return acc;
//   }, {});

// export const normalizeForForm = (data, config) => {
//   const fieldMap = buildFieldMap(config);

//   const normalize = (value, key) => {
//     if (value === null || value === undefined) return "";

//     // Date
//     if (value instanceof Date) {
//       return value.toISOString().split("T")[0];
//     }

//     if (isDateString(value)) {
//       return value.split("T")[0];
//     }

//     // ObjectId
//     if (isObjectIdLike(value)) {
//       return String(value._id);
//     }

//     // Array
//     if (Array.isArray(value)) {
//       // checkbox-group
//       if (fieldMap[key] === "checkbox-group") {
//         return arrayToCheckboxObject(value);
//       }

//       // array of ObjectIds
//       if (value.every(isObjectIdLike)) {
//         return value.map((item) => String(item._id));
//       }

//       return value.map((item) => normalize(item));
//     }

//     // Object
//     if (isPlainObject(value)) {
//       const result = {};
//       Object.keys(value).forEach((k) => {
//         result[k] = normalize(value[k], k);
//       });
//       return result;
//     }

//     return value;
//   };

//   return normalize(data);
// };
