export const createEmptyPagination = (limit = 10) => ({
  total: 0,
  page: 1,
  limit,
  totalPages: 0,
});

export const normalizePagination = (payload, fallback = {}) => {
  const source = payload?.pagination || payload?.meta || payload || {};
  const defaults = { ...createEmptyPagination(fallback.limit), ...fallback };

  return {
    total: source.total ?? defaults.total,
    page: source.page ?? defaults.page,
    limit: source.limit ?? defaults.limit,
    totalPages: source.totalPages ?? source.pages ?? defaults.totalPages,
  };
};
