// //  ├── transportFormConfig.js   ✅ تعريف الحقول

////////////////////--/////////////////
// transportFormConfig.js

export const transportFormConfig = {
  // الحقول العامة (تظهر دائمًا)
  commonFields: [
    {
      name: "vehicleType",
      labelAr: "نوع  وسيلة النقل",
      labelEn: "Transport Type",
      type: "select",
      order: 1,
      col: 12,
      options: [
        { value: "bus", labelAr: "باص", labelEn: "Bus" },
        { value: "van", labelAr: "فان", labelEn: "Van" },
        { value: "car", labelAr: "سيارة", labelEn: "Car" },
        { value: "plane", labelAr: "طائرة", labelEn: "Plane" },
        { value: "ship", labelAr: "سفينة", labelEn: "Ship" },
        { value: "train", labelAr: "قطار", labelEn: "train" },
      ],
      required: true,
    },
    {
      name: "nameAr",
      labelAr: "الاسم بالعربي",
      labelEn: "Arabic Name",
      type: "text",
      order: 2,
      col: 6,
      required: true,
    },
    {
      name: "nameEn",
      labelAr: "الاسم بالإنجليزي",
      labelEn: "English Name",
      type: "text",
      col: 6,
      order: 2,
      required: true,
    },
    {
      name: "descriptionAr",
      labelAr: "الوصف بالعربي",
      labelEn: "Arabic Description",
      type: "textarea", // غيرته إلى textarea لوصف أطول
      rows: 3,
      order: 3,
      col: 6,
    },
    {
      name: "descriptionEn",
      labelAr: "الوصف بالإنجليزي",
      labelEn: "English Description",
      type: "textarea",
      rows: 3,
      order: 3,

      col: 6,
    },
    {
      name: "capacity",
      labelAr: "السعة (عدد الركاب)",
      labelEn: "Capacity (Passengers)",
      type: "number",
      col: 4,
      required: true,
    },

    {
      name: "features",
      labelAr: "السمات العامة",
      labelEn: "General Features",
      type: "checkbox-group",
      col: 12,
      options: [
        { key: "wifi", labelAr: "واي فاي", labelEn: "WiFi" },
        { key: "ac", labelAr: "مكيف", labelEn: "Air Conditioning" },
        { key: "meals", labelAr: "وجبات", labelEn: "Meals" },
        { key: "gps", labelAr: "نظام تتبع", labelEn: "GPS" },
      ],
    },
    {
      name: "images",
      labelAr: "الصور",
      labelEn: "Images",
      type: "file",

      col: 12,
    },
    {
      name: "isActive",
      labelAr: "نشط",
      labelEn: "Active",
      type: "checkbox",
      col: 6,
    },
    {
  name: "isAlwaysAvailable",
  labelAr: "وسيلة النقل دائمة التوفر",
  labelEn: "Transport is always available",
  type: "checkbox",
  col: 6,
  defaultValue: true,
  order: 6,
}
  ],

  // الحقول المشروطة حسب النوع
  conditionalFields: {
    bus: [
      // للباص أو السيارة البرية
      {
        name: "busModel",
        labelAr: "موديل الباص",
        labelEn: "Bus Model",
        type: "text",
        isSpec: true,
        col: 6,
        required: true,
        order: 4,
      },
      {
        name: "manufacturer",
        labelAr: "نوع الصناعة (مثل مرسيدس/فولفو)",
        labelEn: "Manufacturer (e.g., Mercedes/Volvo)",
        isSpec: true,
        type: "select",
        order: 4,
        col: 6,
        options: [
          { value: "mercedes", labelAr: "مرسيدس", labelEn: "Mercedes" },
          { value: "volvo", labelAr: "فولفو", labelEn: "Volvo" },
          { value: "scania", labelAr: "سكانيا", labelEn: "Scania" },
          { value: "other", labelAr: "أخرى", labelEn: "Other" },
        ],
      },
      {
        name: "highRoof",
        isSpec: true,
        labelAr: "سقف مرتفع",
        labelEn: "High Roof",
        type: "checkbox",
        order: 5,
        col: 4,
      },
    ],
    //van
    van: [
      // للباص أو السيارة البرية
      {
        name: "vanModel",
        labelAr: "موديل الباص",
        labelEn: "van Model",
        type: "text",
        col: 6,
        order: 4,
        isSpec: true,
        required: true,
      },
      {
        name: "manufacturer",
        labelAr: "نوع الصناعة (مثل مرسيدس/تويوتا)",
        labelEn: "Manufacturer (e.g., Mercedes/toyta)",
        type: "select",
        order: 4,
        isSpec: true,
        col: 6,
        options: [
          { value: "mercedes", labelAr: "مرسيدس", labelEn: "Mercedes" },
          { value: "volvo", labelAr: "فولفو", labelEn: "Volvo" },
          { value: "scania", labelAr: "سكانيا", labelEn: "Scania" },
          { value: "other", labelAr: "أخرى", labelEn: "Other" },
        ],
      },
    ],
    //car
    car: [
      // للباص أو السيارة البرية
      {
        name: "vanModel",
        labelAr: "موديل الباص",
        labelEn: "van Model",
        isSpec: true,
        type: "text",
        col: 6,
        order: 4,
        required: true,
      },
      {
        name: "manufacturer",
        labelAr: "نوع الصناعة (مثل مرسيدس/تويوتا)",
        labelEn: "Manufacturer (e.g., Mercedes/toyta)",
        type: "select",
        isSpec: true,
        col: 6,
        order: 4,
        options: [
          { value: "mercedes", labelAr: "مرسيدس", labelEn: "Mercedes" },
          { value: "volvo", labelAr: "فولفو", labelEn: "Volvo" },
          { value: "scania", labelAr: "سكانيا", labelEn: "Scania" },
          { value: "other", labelAr: "أخرى", labelEn: "Other" },
        ],
      },
    ],

    plane: [
      // للطائرة
      {
        name: "aircraftModel",
        labelAr: "طراز الطائرة (مثل إيرباص A320)",
        labelEn: "Aircraft Model (e.g., Airbus A320)",
        type: "text",
        col: 6,
        required: true,
        isSpec: true,
        order: 4,
      },
      {
        name: "manufacturer",
        labelAr: "الشركة المصنعة",
        labelEn: "Manufacturer",
        type: "select",
        isSpec: true,
        order: 4,
        col: 6,
        options: [
          { value: "airbus", labelAr: "إيرباص", labelEn: "Airbus" },
          { value: "boeing", labelAr: "بوينغ", labelEn: "Boeing" },
          { value: "embraer", labelAr: "إمبراير", labelEn: "Embraer" },
        ],
      },
    ],
    ship: [
      // للفان أو السيارة الخاصة
      {
        name: "aircraftModel",
        labelAr: "طراز الطائرة (مثل إيرباص A320)",
        labelEn: "Aircraft Model (e.g., Airbus A320)",
        type: "text",
        isSpec: true,
        col: 6,
        required: true,
        order: 4,
      },
      {
        name: "manufacturer",
        labelAr: "الشركة المصنعة",
        labelEn: "Manufacturer",
        type: "select",
        isSpec: true,
        col: 6,
        order: 4,
        options: [
          { value: "airbus", labelAr: "إيرباص", labelEn: "Airbus" },
          { value: "boeing", labelAr: "بوينغ", labelEn: "Boeing" },
          { value: "embraer", labelAr: "إمبراير", labelEn: "Embraer" },
        ],
      },
      {
        name: "vanModel",
        isSpec: true,
        labelAr: "موديل الفان/السيارة",
        labelEn: "Van/Car Model",
        type: "text",
        col: 6,
        order: 4,
      },
      {
        name: "seatsConfig",
        isSpec: true,
        labelAr: "ترتيب المقاعد",
        labelEn: "Seats Configuration",
        type: "select",
        col: 6,
        options: [
          { value: "2-2", labelAr: "2-2", labelEn: "2-2" },
          { value: "2-3", labelAr: "2-3", labelEn: "2-3" },
          { value: "luxury", labelAr: "فاخر", labelEn: "Luxury" },
        ],
        order: 4,
      },
    ],
    train: [
      // أضف حقول خاصة بالسفن إذا أردت
      {
        name: "aircraftModel",
        isSpec: true,
        labelAr: "طراز الطائرة (مثل إيرباص A320)",
        labelEn: "Aircraft Model (e.g., Airbus A320)",
        type: "text",
        col: 6,
        required: true,
        order: 4,
      },
      {
        name: "manufacturer",
        isSpec: true,
        labelAr: "الشركة المصنعة",
        labelEn: "Manufacturer",
        type: "select",
        order: 4,
        col: 6,
        options: [
          { value: "airbus", labelAr: "إيرباص", labelEn: "Airbus" },
          { value: "boeing", labelAr: "بوينغ", labelEn: "Boeing" },
          { value: "embraer", labelAr: "إمبراير", labelEn: "Embraer" },
        ],
      },
    ],
    other: [
      // حقول خاصة بالقطار
      {
        name: "veicleName",
        isSpec: true,
        labelAr: "توع المركة",
        labelEn: "veicleName",
        type: "text",
        col: 6,
        required: true,
        order: 4,
      },
      {
        name: "manufacturer",
        isSpec: true,
        labelAr: "الشركة المصنعة",
        labelEn: "Manufacturer",
        type: "select",
        order: 4,
        col: 6,
        options: [
          { value: "airbus", labelAr: "إيرباص", labelEn: "Airbus" },
          { value: "boeing", labelAr: "بوينغ", labelEn: "Boeing" },
          { value: "embraer", labelAr: "إمبراير", labelEn: "Embraer" },
        ],
      },
    ],
  },
};
