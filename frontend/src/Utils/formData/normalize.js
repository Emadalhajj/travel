// utils/form/normalize.js
// DB → Form 
import { buildFieldMap } from "./fieldMap";

const isPlainObject = (val) =>
  Object.prototype.toString.call(val) === "[object Object]";

const isObjectIdLike = (val) =>
  isPlainObject(val) && val._id && Object.keys(val).length === 1;

const isDateString = (val) =>
  typeof val === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);

const arrayToCheckboxObject = (arr = []) =>
  arr.reduce((acc, item) => {
    acc[item] = true;
    return acc;
  }, {});

export const normalizeForForm = (data, config) => {
  const fieldMap = buildFieldMap(config);

  const normalize = (value, key) => {
    if (value === null || value === undefined) return "";

    // Date
    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }

    if (isDateString(value)) {
      return value.split("T")[0];
    }

    // ObjectId
    if (isObjectIdLike(value)) {
      return String(value._id);
    }

    // Array
    if (Array.isArray(value)) {
      // checkbox-group
      if (fieldMap[key] === "checkbox-group") {
        return arrayToCheckboxObject(value);
      }

      // array of ObjectIds
      if (value.every(isObjectIdLike)) {
        return value.map((item) => String(item._id));
      }

      return value.map((item) => normalize(item));
    }

    // Object
    if (isPlainObject(value)) {
      const result = {};
      Object.keys(value).forEach((k) => {
        result[k] = normalize(value[k], k);
      });
      return result;
    }

    return value;
  };

  return normalize(data);
};