//📌 Pagination (التقسيم إلى صفحات) هو الحل القياسي.
/*
    * 🟢 buildPagination
    * وظيفة: بناء كائن التصفح (pagination) لعمليات البحث في قاعدة البيانات بناءً على معايير التصفح المحددة.
    * المدخلات: كائن يحتوي على خصائص التصفح (page, limit).
    * المخرجات: كائن يحتوي على عدد السجلات التي يجب تخطيها (skip) وعدد السجلات التي يجب إرجاعها (limit).
*/

export const buildPagination = ({ 
  page = 1,
   limit = 10 }) => { // الافتراضي
  const skip = (page - 1) * limit; // تخطي الصفوف
  return { skip, limit: Number(limit) };//

//       page = 1 ,
//     limit = 10
// }) => {
//     page = Number(page);
//     limit = Number(limit);
//     const skip = (page - 1) * limit
//     return { skip, limit };

};
