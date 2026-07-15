/*
useFieldHelpers.js

هذا مسؤول عن:

path generation
field value
error handling
useFieldHelpers.js

وظيفته:

تحديد path
قراءة القيمة
حذف رسالة الخطأ
المسارات والأخطاء
*/
import { get } from "../utils/objectPath";

export default function useFieldHelpers(
  formState,
  setFieldErrors,
) {
  const getFieldStatePath = (field) => {
    if (field.path) {
      return field.path;
    }

    if (field.isSpec) {
      return `specs.${field.name}`;
    }

    return field.name;
  };

  const getFieldValue = (field) => {
    return get(
      formState,
      getFieldStatePath(field),
    );
  };

  const clearFieldError = (field) => {
    const path =
      getFieldStatePath(field);

    setFieldErrors((prev) => ({
      ...prev,
      [path]: "",
    }));
  };

  return {
    getFieldStatePath,
    getFieldValue,
    clearFieldError,
  };
}