// src/Components/common/ModalForms/visa/visaTypeFormConfig.js

export const visaTypeFormConfig = () => ({
  commonFields: [
    {
      name: "nameAr",           // ← اسم الحقل كما في الـ Schema
      labelAr: "الاسم بالعربية",
      labelEn: "Name (Arabic)",
      type: "text",
      language: "ar",
      col: 6,
      required: true,
      order: 1,
    },
    {
      name: "nameEn",           // ← اسم الحقل كما في الـ Schema
      labelAr: "الاسم بالإنجليزية",
      labelEn: "Name (English)",
      type: "text",
      language: "en",
      col: 6,
      required: true,
      order: 1,
    },
    {
      name: "isActive",
      labelAr: "نشط",
      labelEn: "Active",
      type: "checkbox",
      col: 12,
      order: 3,
    },
  ],
});
