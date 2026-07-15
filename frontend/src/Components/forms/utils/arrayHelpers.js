/*
arrayHelpers.js

وظيفته:

إنشاء عنصر جديد للمصفوفات.
*/
import { set } from "./objectPath";

export const createArrayItem = (field) => {
  return (field.fields || []).reduce(
    (item, subField) => {
      const value =
        subField.defaultValue !== undefined
          ? subField.defaultValue
          : subField.type === "checkbox"
          ? false
          : "";

      return set(
        item,
        subField.name,
        value,
      );
    },
    {},
  );
};