/*
=====================================================
Admin Payment Provider API
=====================================================

يحتوي جميع طلبات API المتعلقة بإدارة مزودي الدفع.

المسار الأساسي في Backend:

/api/admin/payment-providers
=====================================================
*/

import api from "../api";

/*
=====================================================
Base URL
=====================================================
*/

const PAYMENT_PROVIDER_BASE_URL =
  "/admin/payment-providers";

/*
=====================================================
Build Query Params
=====================================================

يبني Query Params دون إرسال القيم الفارغة.

مثال:

{
  page: 1,
  limit: 10,
  search: "",
  environment: "TEST",
  isActive: true
}

سيصبح:

?page=1&limit=10&environment=TEST&isActive=true
=====================================================
*/

const buildQueryParams = (
  params = {},
) => {
  const queryParams =
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

      queryParams.append(
        key,
        String(value),
      );
    },
  );

  return queryParams.toString();
};

/*
=====================================================
Get Payment Providers
=====================================================

GET /admin/payment-providers
=====================================================
*/

export const apiGetPaymentProviders =
  async (
    params = {},
  ) => {
    const queryString =
      buildQueryParams(params);

    const url = queryString
      ? `${PAYMENT_PROVIDER_BASE_URL}?${queryString}`
      : PAYMENT_PROVIDER_BASE_URL;

    const response =
      await api.get(url);

    return response.data;
  };

/*
=====================================================
Get Payment Provider By ID
=====================================================

GET /admin/payment-providers/:providerId
=====================================================
*/

export const apiGetPaymentProviderById =
  async (
    providerId,
  ) => {
    const response =
      await api.get(
        `${PAYMENT_PROVIDER_BASE_URL}/${providerId}`,
      );

    return response.data;
  };

/*
=====================================================
Create Payment Provider
=====================================================

POST /admin/payment-providers
=====================================================
*/

export const apiCreatePaymentProvider =
  async (
    payload,
  ) => {
    const response =
      await api.post(
        PAYMENT_PROVIDER_BASE_URL,
        payload,
      );

    return response.data;
  };

/*
=====================================================
Update Payment Provider
=====================================================

PATCH /admin/payment-providers/:providerId
=====================================================
*/

export const apiUpdatePaymentProvider =
  async ({
    providerId,
    data,
  }) => {
    const response =
      await api.patch(
        `${PAYMENT_PROVIDER_BASE_URL}/${providerId}`,
        data,
      );

    return response.data;
  };

/*
=====================================================
Update Payment Provider Status
=====================================================

PATCH /admin/payment-providers/:providerId/status
=====================================================
*/

export const apiUpdatePaymentProviderStatus =
  async ({
    providerId,
    isActive,
  }) => {
    const response =
      await api.patch(
        `${PAYMENT_PROVIDER_BASE_URL}/${providerId}/status`,
        {
          isActive,
        },
      );

    return response.data;
  };

/*
=====================================================
Delete Payment Provider
=====================================================

DELETE /admin/payment-providers/:providerId
=====================================================
*/

export const apiDeletePaymentProvider =
  async (
    providerId,
  ) => {
    const response =
      await api.delete(
        `${PAYMENT_PROVIDER_BASE_URL}/${providerId}`,
      );

    return response.data;
  };
