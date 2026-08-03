import api from "../api";

const BASE_URL =
  "/public/payments/configurations";

const buildQueryParams = (
  params = {},
) => {
  const query =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      query.append(
        key,
        String(value),
      );
    },
  );

  const queryString =
    query.toString();

  return queryString
    ? `?${queryString}`
    : "";
};

export const apiGetPublicPaymentConfigurations =
  async ({
    sectionCode,
    currency = "SAR",
    amount,
  }) => {
    const response =
      await api.get(
        `${BASE_URL}${buildQueryParams({
          sectionCode,
          currency,
          amount,
        })}`,
      );

    return response.data;
  };