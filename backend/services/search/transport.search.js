import { buildBaseQuery } from "../../services/search/baseSearch.js";

export const buildTransportFilter = (query) => {
  const filter = buildBaseQuery({
    query,
    searchableFields: ["nameAr", "nameEn"],
  });

  if (query.transportType) {
    filter.transportType = query.transportType;
  }

  if (query.capacity) {
    filter.capacity = { $gte: Number(query.capacity) };
  }

  return filter;
};
