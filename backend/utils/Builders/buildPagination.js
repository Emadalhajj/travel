const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const positiveInteger = (value, fallback) => {
  const number = Number(value);
  const integer = Math.floor(number);
  return Number.isSafeInteger(integer) && integer >= 1
    ? integer
    : fallback;
};

export const buildPagination = ({ page, limit } = {}) => {
  const safePage = positiveInteger(page, DEFAULT_PAGE);
  const safeLimit = Math.min(
    positiveInteger(limit, DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};
