import { useEffect, useRef } from "react";

/*
=========================================================
useAutoSaveDraftBooking
=========================================================

هذا Hook مسؤول عن الحفظ التلقائي لمسودة الحجز.

الفكرة:
عند تغيير بيانات الحجز، لا نحفظ مباشرة مع كل حرف.
ننتظر مدة قصيرة debounce.
إذا توقف المستخدم عن التعديل، يتم تحديث Draft Booking.

لا يتم الحفظ التلقائي في الحالات التالية:
1- لا يوجد برنامج مختار
2- أثناء الحفظ الحالي
3- في خطوة النجاح
4- إذا لم يتم إنشاء Draft بعد واختار المستخدم البرنامج فقط
=========================================================
*/

export default function useAutoSaveDraftBooking({
  enabled = true,
  currentStepKey,
  selectedPackage,
  draftBooking,
  submitLoading,
  syncDraftBooking,
  dependencies = [],
  delay = 1000,
  
}) {
  const firstRunRef = useRef(true);
  const timerRef = useRef(null);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!draftBooking?._id && !draftBooking?.id) return;
    if (!selectedPackage) return;
    if (submitLoading) return;
    if (currentStepKey === "success") return;

    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      syncDraftBooking(currentStepKey);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    enabled,
    currentStepKey,
    selectedPackage,
    draftBooking,
    submitLoading,
    syncDraftBooking,
    delay,
    ...dependencies,
  ]);
}