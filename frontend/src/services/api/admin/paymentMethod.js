// services/api/admin/paymentMethod.js

/*
=====================================================
Admin Payment Method API
=====================================================

يعيد Axios Response كاملًا حتى يتبع الـSlice
نفس النمط المستخدم في inventorySlice.
=====================================================
*/

import api from "../api";

const PAYMENT_METHOD_BASE_URL =
  "/payment-methods";

/*
جلب طرق الدفع مع الفلاتر والترقيم.
*/
export const apiGetPaymentMethods = (
  params,
) =>
  api.get(
    PAYMENT_METHOD_BASE_URL,
    {
      params,
    },
  );

/*
إنشاء طريقة دفع.
*/
export const apiCreatePaymentMethod = (
  payload,
) =>
  api.post(
    PAYMENT_METHOD_BASE_URL,
    payload,
  );

/*
تعديل طريقة دفع.
*/
export const apiUpdatePaymentMethod = (
  id,
  data,
) =>
  api.patch(
    `${PAYMENT_METHOD_BASE_URL}/${id}`,
    data,
  );

/*
تفعيل أو تعطيل الطريقة.
*/
export const apiUpdatePaymentMethodStatus = (
  id,
  data,
) =>
  api.patch(
    `${PAYMENT_METHOD_BASE_URL}/${id}/status`,
    data,
  );

/*
حذف منطقي.
*/
export const apiDeletePaymentMethod = (
  id,
) =>
  api.delete(
    `${PAYMENT_METHOD_BASE_URL}/${id}`,
  );