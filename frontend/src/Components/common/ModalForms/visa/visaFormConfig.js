// src/config/visaFormConfig.js

export const visaFormConfig = (visaTypes = []) => ({
  // conditionKey: undefined,   // لا يوجد حقل شرطي هنا (كل الحقول مشتركة)

  commonFields: [
    {
      name: "name.ar",
      labelAr: "الاسم بالعربي",
      labelEn: "Name (Arabic)",
      type: "text",
      col: 6,
      required: true,
      order: 1,
    },
    {
      name: "name.en",
      labelAr: "الاسم بالإنجليزي",
      labelEn: "Name (English)",
      type: "text",
      col: 6,
      required: true,
      order: 1,
    },
    {
      name: "description.ar",
      labelAr: "الوصف بالعربي",
      labelEn: "Description (Arabic)",
      type: "textarea",
      rows: 3,
      col: 6,
      required: true,
      order: 2,
    },
    {
      name: "description.en",
      labelAr: "الوصف بالإنجليزي",
      labelEn: "Description (English)",
      type: "textarea",
      rows: 3,
      col: 6,
      required: true,
      order: 2,
    },
    {
      name: "duration",
      labelAr: "المدة (مثال: 30 يوم)",
      labelEn: "Duration (e.g. 30 days)",
      type: "text",
      col: 4,
      required: true,
      order: 3,
    },
    {
      name: "validity",
      labelAr: "الصلاحية (مثال: 90 يوم)",
      labelEn: "Validity (e.g. 90 days)",
      type: "text",
      col: 4,
      required: true,
      order: 3,
    },
    {
      name: "price",
      labelAr: "السعر (ريال)",
      labelEn: "Price (SAR)",
      type: "number",
      col: 4,
      required: true,
      order: 3,
    },

    {
      name: "country.ar",
      labelAr: "الدولة (عربي)",
      labelEn: "Country (Arabic)",
      type: "text",
      col: 6,
      required: true,
      order: 4,
    },
    {
      name: "country.en",
      labelAr: "الدولة (إنجليزي)",
      labelEn: "Country (English)",
      type: "text",
      col: 6,
      required: true,
      order: 4,
    },

    {
      name: "visaType",
      labelAr: "نوع التأشيرة",
      labelEn: "Visa Type",
      type: "select",
      col: 6,
      required: true,
      order: 5,
      options: visaTypes.map((vt) => ({
        value: vt._id,
        labelAr: vt.name?.ar || vt.nameAr,
        labelEn: vt.name?.en || vt.nameEn,
      })),
    },
    {
  name: "isAlwaysAvailable",
  labelAr: "التأشيرة دائمة التوفر",
  labelEn: "Visa is always available",
  type: "checkbox",
  col: 6,
  defaultValue: true,
  order: 5,
},

    {
      name: "isActive",
      labelAr: "نشط",
      labelEn: "Active",
      type: "checkbox",
      col: 12,
      order: 6,
    },

    {
      name: "images",
      labelAr: "صور التأشيرة",
      labelEn: "Visa Images",
      type: "file",
      multiple: true,
      col: 12,
      order: 7,
    },
  ],

  // لا يوجد conditionalFields حالياً
  conditionalFields: {},
});
