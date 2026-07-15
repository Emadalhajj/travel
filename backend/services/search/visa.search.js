import { buildBaseQuery } from "./baseSearch.js";

export const buildVisaFilter = (query) => {
  return buildBaseQuery({
    query,
    searchableFields: ["titleAr", "titleEn"],
  });
};
