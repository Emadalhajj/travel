export const buildBaseQuery = ({ query, searchableFields = [] }) => {
  const filter = {};

  // 🔍 Search
  if (query.search && searchableFields.length) {
    filter.$or = searchableFields.map((field) => ({
      [field]: { $regex: query.search, $options: "i" },
    }));
  }

  // 🟢 Active
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  return filter;
};
