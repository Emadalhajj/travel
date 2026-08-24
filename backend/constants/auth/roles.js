// عملية تجميد الكائنات في JavaScript تمنع تعديل خصائص الكائن بعد إنشائه. عند استخدام `Object.freeze()` 
// على كائن، يصبح هذا الكائن غير قابل للتغيير، مما يعني أنه لا يمكن إضافة أو حذف أو تعديل أي من خصائصه. هذا مفيد للحفاظ على الثوابت وضمان أن القيم لا تتغير أثناء تنفيذ البرنامج.
export const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
});

export const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));
