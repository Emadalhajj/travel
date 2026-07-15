// src/Components/common/ModalForms/visa/visaTypeFormConfig.js

export const visaTypeFormConfig = () => ({
  commonFields: [
    {
      name: "nameAr",           // ← اسم الحقل كما في الـ Schema
      labelAr: "الاسم بالعربية",
      labelEn: "Name (Arabic)",
      type: "text",
      col: 6,
      required: true,
      order: 1,
    },
    {
      name: "nameEn",           // ← اسم الحقل كما في الـ Schema
      labelAr: "الاسم بالإنجليزية",
      labelEn: "Name (English)",
      type: "text",
      col: 6,
      required: true,
      order: 1,
    },
    {
      name: "descriptionAr",
      labelAr: "الوصف بالعربية",
      labelEn: "Description (Arabic)",
      type: "textarea",
      rows: 3,
      col: 12,
      required: false,
      order: 2,
    },
    {
      name: "descriptionEn",
      labelAr: "الوصف بالإنجليزية",
      labelEn: "Description (English)",
      type: "textarea",
      rows: 3,
      col: 12,
      required: false,
      order: 2,
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