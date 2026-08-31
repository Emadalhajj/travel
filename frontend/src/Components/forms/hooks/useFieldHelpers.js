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
import { useCallback, useMemo, useRef } from "react";
import { validateFormField } from "../utils/formValidation";

export default function useFieldHelpers(
  formState,
  setFieldErrors,
  isArabic,
) {
  const formStateRef = useRef(formState);
  formStateRef.current = formState;

  const getFieldStatePath = useCallback((field) => {
    if (field.path) {
      return field.path;
    }

    if (field.isSpec) {
      return `specs.${field.name}`;
    }

    return field.name;
  }, []);

  const getFieldValue = useCallback((field) => {
    return get(
      formStateRef.current,
      getFieldStatePath(field),
    );
  }, [getFieldStatePath]);

  const clearFieldError = useCallback((field) => {
    const path =
      getFieldStatePath(field);

    setFieldErrors((prev) => ({
      ...prev,
      [path]: "",
    }));
  }, [getFieldStatePath, setFieldErrors]);

  const validateField = useCallback((field, value) => {
    const path = getFieldStatePath(field);
    const message = validateFormField(field, value, isArabic);
    setFieldErrors((previous) => ({ ...previous, [path]: message }));
    return message;
  }, [getFieldStatePath, isArabic, setFieldErrors]);

  return useMemo(() => ({
    getFieldStatePath,
    getFieldValue,
    clearFieldError,
    validateField,
  }), [clearFieldError, getFieldStatePath, getFieldValue, validateField]);
}
