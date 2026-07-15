/*
أنشئ ملف منفصل للثوابت:
وهذا يسمح لك لاحقًا بإضافة:

ملفات مالية
ملفات تقارير
عقود
ملفات Excel
ملفات PDF

بدون تعديل الـ Factory نفسه.

هذا هو الأسلوب القابل للتوسع (Scalable Architecture).
*/
export const IMAGE_EXTENSIONS =
  /\.(jpe?g|png|gif|webp)$/i;

export const DOCUMENT_EXTENSIONS =
  /\.(jpe?g|png|gif|webp|pdf|doc|docx)$/i;

export const EXCEL_EXTENSIONS =
  /\.(xls|xlsx|csv)$/i;