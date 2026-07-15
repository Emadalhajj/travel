/*
    * 🟢 normalizeSchedule
    * وظيفة: تطبيع بيانات الجدول الزمني (اليوم، من، إلى) لضمان تنسيق موحد وصحيح.
     * المدخلات: مصفوفة تحتوي على كائنات يحتوي على خصائص الجدول الزمني.
     
-- مثال * المخرجات: مصفوفة جديدة يحتوي على نفس الخصائص بعد تطبيعها.
     [
 {
   day,
   from,
   to
 }
]
 قد تصل البيانات مثل 
 {
 day: "Sunday"
}
 او ناقصة
 يتم تحوليها شكل ثابت الى 
[
 {
   day: "Sunday",
   from: "8:00",
   to: "18:00"
 }
]
 */
import { normalizeArray } from "../generic/normalizeArray.js";

export const normalizeSchedule = (
  schedules,
) => {
  return normalizeArray(schedules).map(
    (item) => ({
      day: item.day || "", // تعيين اليوم إلى قيمة فارغة إذا لم يكن موجودًا

      from: item.from || "", // تعيين من إلى قيمة فارغة إذا لم يكن موجودًا

      to: item.to || "",
    }),
  );
};