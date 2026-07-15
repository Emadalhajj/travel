/*
وهو المسؤول عن:

إنشاء Draft تلقائياً.
تحديثه بعد كل خطوة.
استعادته عند تحديث الصفحة.
إكماله وتحويله إلى Booking نهائي.
*/
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createPublicDraftBooking,
  updatePublicDraftBooking,
  fetchPublicDraftBookingById,
  cancelPublicDraftBooking,
  completePublicDraftBooking,
  clearPublicBookingError,
} from "../../redux/public/bookingSlice";

/*
=========================================================
useDraftBooking
=========================================================

هذا Hook هو طبقة وسيطة بين:
- BookingProvider / BookingWizard
- Redux publicBookingSlice
- Draft Booking API

وظيفته:
1- إنشاء Draft Booking
2- تحديث Draft Booking
3- جلب Draft Booking
4- إلغاء Draft Booking
5- إكمال Draft Booking وتحويله إلى Booking نهائي

مهم:
هذا Hook لا يحتوي UI.
ولا يعرف شكل الصفحة.
هو فقط يدير عمليات Draft Booking.
=========================================================
*/

export default function useDraftBooking() {
  const dispatch = useDispatch();

  const {
    draftBooking,
    finalBooking,
    loading,
    submitLoading,
    error,
    success,
  } = useSelector((state) => state.publicBooking || {});

  const getDraftId = useCallback(() => {
    return draftBooking?._id || draftBooking?.id || null;
  }, [draftBooking]);

  const createDraft = useCallback(
    async (payload) => {
      const result = await dispatch(createPublicDraftBooking(payload));

      if (createPublicDraftBooking.fulfilled.match(result)) {
        return result.payload?.data || result.payload;
      }

      throw new Error(result.payload || "فشل إنشاء مسودة الحجز");
    },
    [dispatch]
  );

  const updateDraft = useCallback(
    async (payload, customDraftId = null) => {
      const draftId = customDraftId || getDraftId();

      if (!draftId) {
        throw new Error("لا يوجد Draft Booking لتحديثه");
      }

      const result = await dispatch(
        updatePublicDraftBooking({
          draftId,
          data: payload,
        })
      );

      if (updatePublicDraftBooking.fulfilled.match(result)) {
        return result.payload?.data || result.payload;
      }

      throw new Error(result.payload || "فشل تحديث مسودة الحجز");
    },
    [dispatch, getDraftId]
  );

  const fetchDraft = useCallback(
    async (draftId) => {
      if (!draftId) {
        throw new Error("معرف المسودة مطلوب");
      }

      const result = await dispatch(fetchPublicDraftBookingById(draftId));

      if (fetchPublicDraftBookingById.fulfilled.match(result)) {
        return result.payload?.data || result.payload;
      }

      throw new Error(result.payload || "فشل جلب مسودة الحجز");
    },
    [dispatch]
  );

  const cancelDraft = useCallback(
    async (customDraftId = null) => {
      const draftId = customDraftId || getDraftId();

      if (!draftId) {
        throw new Error("لا يوجد Draft Booking لإلغائه");
      }

      const result = await dispatch(cancelPublicDraftBooking(draftId));

      if (cancelPublicDraftBooking.fulfilled.match(result)) {
        return result.payload?.data || result.payload;
      }

      throw new Error(result.payload || "فشل إلغاء مسودة الحجز");
    },
    [dispatch, getDraftId]
  );

  const completeDraft = useCallback(
    async (customDraftId = null) => {
      const draftId = customDraftId || getDraftId();

      if (!draftId) {
        throw new Error("لا يوجد Draft Booking لإكماله");
      }

      const result = await dispatch(completePublicDraftBooking(draftId));

      if (completePublicDraftBooking.fulfilled.match(result)) {
        return result.payload?.data || result.payload;
      }

      throw new Error(result.payload || "فشل تحويل المسودة إلى حجز");
    },
    [dispatch, getDraftId]
  );

  const clearError = useCallback(() => {
    dispatch(clearPublicBookingError());
  }, [dispatch]);

  return {
    draftBooking,
    finalBooking,

    loading,
    submitLoading,
    error,
    success,

    draftId: getDraftId(),

    createDraft,
    updateDraft,
    fetchDraft,
    cancelDraft,
    completeDraft,
    clearError,
  };
}