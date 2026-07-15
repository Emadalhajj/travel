// utils/buildQuery.js
/*
عند عملية البحث بالفلتر
*/
export const buildQuery = (filters, pagination) => {
  const query = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.append(key, value);
    }
  });
  
  if (pagination) {
    query.append("page", pagination.page);
    query.append("limit", pagination.limit);
  }
  
  return query;
};