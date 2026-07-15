import { buildBaseQuery } from "./baseSearch.js";

export const buildHotelFilter = (query) => {
  const filter = buildBaseQuery({
    query,
    searchableFields: ["nameAr", "nameEn"],
  });

  if (query.city) {
    filter["location.city.en"] = query.city;
  }

  if (query.stars) {
    filter.stars = Number(query.stars);
  }

  return filter;
};
