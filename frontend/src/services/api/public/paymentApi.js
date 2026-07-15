import api from "../api";

/*
=========================================================
Public Payment API
=========================================================

منطق الدفع:
1- Authorization أولًا
2- Capture لاحقًا بعد تأكيد تنفيذ الطلب
=========================================================
*/

const PAYMENT_BASE_URL = "/payments";

// إنشاء تفويض دفع للحجز المبدئي
export const apiAuthorizeDraftBookingPayment = async (draftBookingId, data = {}) => {
  const response = await api.post(
    `${PAYMENT_BASE_URL}/authorize/draft-booking/${draftBookingId}`,
    data
  );

  return response.data;
};

// جلب حالة الدفع
export const apiGetPaymentStatus = async (paymentId) => {
  const response = await api.get(`${PAYMENT_BASE_URL}/${paymentId}/status`);
  return response.data;
};
