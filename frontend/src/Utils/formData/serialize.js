// utils/form/serialize.js
// Form → API
// هذه الدالة تأخذ حالة النموذج وتكوين النموذج، وتقوم بتحويل البيانات إلى الشكل المناسب للإرسال إلى API. تقوم بمعالجة أنواع الحقول المختلفة مثل checkbox-group وتحويلها إلى مصفوفة، بالإضافة إلى تطبيق التحويلات النوعية بناءً على نوع الحقل المحدد في التكوين.

// src/utils/form/serialize.js

import { buildFieldMap } from "./fieldMap";
import { convertValueByType } from "./converters";

const isPlainObject = (val) =>
  Object.prototype.toString.call(val) === "[object Object]";

export const serializeForApi = (formState, config) => {
  const fieldMap = buildFieldMap(config);
  const fieldConfigMap = [
    ...(config?.commonFields || []),
    ...Object.values(config?.conditionalFields || {}).flat(),
  ].reduce((map, field) => {
    if (field?.name) map[field.name] = field;
    return map;
  }, {});

  const serialize = (value, fullPath = "") => {
    const fieldType = fieldMap[fullPath];
    const fieldConfig = fieldConfigMap[fullPath];

    // ====================== معالجة المرفقات ======================
    if (fieldType === "file-attachment" || fullPath === "attachments") {
      if (Array.isArray(value)) {
        // إرسال المرفقات الموجودة (غير File objects) فقط
        const existingAttachments = value.filter(
          (item) => !(item instanceof File),
        );
        return existingAttachments.length > 0 ? existingAttachments : undefined;
      }
      return undefined;
    }

    // ====================== معالجة الملفات المحذوفة ======================
    if (fullPath === "deleteAttachments") {
      if (Array.isArray(value) && value.length > 0) {
        return value; // إرسال قائمة المسارات المراد حذفها
      }
      return undefined;
    }

    // ====================== checkbox-group ======================
    if (fieldType === "checkbox-group" && isPlainObject(value)) {
      if (fieldConfig?.valueMode === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, checked]) => [key, Boolean(checked)]),
        );
      }

      return Object.entries(value)
        .filter(([_, checked]) => checked)
        .map(([key]) => key);
    }

    // Optional array fields must remain arrays even when legacy initial data
    // contains an empty string.
    if (fieldType === "array" && !Array.isArray(value)) {
      return [];
    }

    // ====================== Arrays ======================
    if (Array.isArray(value)) {
      return value
        .map((item, index) => serialize(
          item,
          fullPath ? `${fullPath}.${index}` : String(index),
        ))
        .filter(Boolean); // إزالة القيم الفارغة
    }

    // ====================== Nested Objects ======================
    if (isPlainObject(value)) {
      const result = {};

      Object.entries(value).forEach(([key, val]) => {
        const nextPath = fullPath ? `${fullPath}.${key}` : key;
        const serialized = serialize(val, nextPath);

        if (serialized !== undefined) {
          result[key] = serialized;
        }
      });

      return Object.keys(result).length > 0 ? result : undefined;
    }

    // ====================== القيم العادية ======================
    return convertValueByType(value, fieldType);
  };

  const payload = serialize(formState);

  // تنظيف القيم الفارغة في المستوى الأعلى
  if (isPlainObject(payload)) {
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
  }

  return payload;
};
