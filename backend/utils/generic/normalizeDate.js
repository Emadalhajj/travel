/*
تحويل النص إلى Date
مثال:
const dateStr = "2024-12-31";
const date = normalizeDate(dateStr);
يستخدم مع:

startDate
endDate
checkIn
*/
export const normalizeDate = (value) => {
    if (!value) return null; // إذا كانت القيمة غير موجودة، نعيد null
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date; // إذا كان التاريخ غير صالح، نعيد null
}
