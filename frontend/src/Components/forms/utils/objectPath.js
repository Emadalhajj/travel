/*
هذا يحتوي get/set الخاصة بالـ nested object.
وظيفته:

قراءة القيم nested object
تعديل القيم nested object

*/

export const get = (obj, path) => {
  return path?.split(".").reduce((o, k) => o?.[k], obj);
};

const isArrayIndex = (key) => /^\d+$/.test(key);

export const set = (obj, path, value) => {
  const keys = path.split(".");

  const root = Array.isArray(obj)
    ? [...obj]
    : { ...obj };

  let current = root;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const nextKey = keys[i + 1];

    const existing = current[k];

    if (Array.isArray(existing)) {
      current[k] = [...existing];
    } else if (
      existing &&
      typeof existing === "object"
    ) {
      current[k] = { ...existing };
    } else {
      current[k] = isArrayIndex(nextKey)
        ? []
        : {};
    }

    current = current[k];
  }

  current[keys.at(-1)] = value;

  return root;
};