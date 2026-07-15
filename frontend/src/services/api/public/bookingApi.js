import api from "../api";

/*
=========================================================
Public Booking API
=========================================================

هذا الملف مسؤول عن التعامل مع Draft Booking من واجهة العميل.

المنطق:
1- إنشاء Draft Booking
2- تحديث بيانات العميل والمعتمرين
3- مراجعة الحجز
4- إكمال Draft وتحويله إلى Booking
=========================================================
*/

const DRAFT_BOOKING_BASE_URL = "/draft-bookings";

// إنشاء حجز مبدئي Draft
export const apiCreateDraftBooking = async (data) => {
  const response = await api.post(DRAFT_BOOKING_BASE_URL, data);
  return response.data;
};

// تحديث Draft Booking
export const apiUpdateDraftBooking = async (draftId, data) => {
  const response = await api.patch(`${DRAFT_BOOKING_BASE_URL}/${draftId}`, data);
  return response.data;
};

// جلب Draft Booking بالمعرف
export const apiGetDraftBookingById = async (draftId) => {
  const response = await api.get(`${DRAFT_BOOKING_BASE_URL}/${draftId}`);
  return response.data;
};

// إلغاء Draft Booking
export const apiCancelDraftBooking = async (draftId) => {
  const response = await api.post(`${DRAFT_BOOKING_BASE_URL}/${draftId}/cancel`);
  return response.data;
};

// تحويل Draft إلى Booking نهائي
export const apiCompleteDraftBooking = async (draftId) => {
  const response = await api.post(`${DRAFT_BOOKING_BASE_URL}/${draftId}/complete`);
  return response.data;
};

// جلب حجز نهائي بالمعرف
export const apiGetBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

// حجوزاتي
export const apiGetMyBookings = async (params = {}) => {
  const response = await api.get("/bookings/my-bookings", { params });
  return response.data;
};

// مسوداتي
export const apiGetMyDraftBookings = async (params = {}) => {
  const response = await api.get("/draft-bookings/my", { params });
  return response.data;
};