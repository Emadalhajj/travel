// tripFormConfig.js


export const tripFormConfig = (vehicleTypes = []) => ({
  conditionKey: "tripType",

  /* ====================== COMMON FIELDS ====================== */
  commonFields: [
    {
      name: "nameAr",
      labelAr: "الاسم بالعربي",
      labelEn: "Arabic Name",
      type: "text",
      col: 6,
      required: true,
      order : 1
    },
    {
      name: "nameEn",
      labelAr: "الاسم بالإنجليزي",
      labelEn: "English Name",
      type: "text",
      col: 6,
      required: true,
      order : 1
    },
    {
      name: "descriptionAr",
      labelAr: "الوصف بالعربي",
      labelEn: "Arabic Description",
      type: "textarea",
      rows: 3,
      col: 6,
      order : 2
    },
    {
      name: "descriptionEn",
      labelAr: "الوصف بالإنجليزي",
      labelEn: "English Description",
      type: "textarea",
      rows: 3,
      col: 6,
      order : 2
    },
    {
      name: "tripType",
      labelAr: "نوع الرحلة",
      labelEn: "Trip Type",
      type: "select",
      col: 4,
      options: [
        { value: "tour", labelAr: "سياحة", labelEn: "tour" },
        { value: "transport", labelAr: "نقل", labelEn: "transport" },
        { value: "package", labelAr: "حزمة", labelEn: "package" },
        { value: "activity", labelAr: "نشاط", labelEn: "activity" },
      ],
      required: true,
      order : 3
    },

    // السمات (features) كـ checkbox-group مع options افتراضية (إذا لم تُحدد شرطيًا)
    {
      name: "features",
      labelAr: "المميزات",
      labelEn: "Features",
      type: "checkbox-group",
      col: 12,
      options: [ // options افتراضية (تُستخدم إذا لم يكن هناك conditionalOptions)
        { key: "wifi", labelAr: "واي فاي", labelEn: "WiFi" },
        { key: "ac", labelAr: "مكيف", labelEn: "Air Conditioning" },
        { key: "meals", labelAr: "وجبات", labelEn: "Meals" },
        { key: "gps", labelAr: "GPS", labelEn: "GPS" },
      ],
      order : 4
    },

    {
      name: "pricing.basePrice",
      labelAr: "السعر الأساسي",
      labelEn: "Base Price",
      type: "number",
      col: 4,
      required: true,
      order : 6
    },
    {
      name: "pricing.discountPrice",
      labelAr: "سعر الخصم",
      labelEn: "Discount Price",
      type: "number",
      col: 4,
      order : 6
    },
    {
      name: "pricing.currency",
      labelAr: "العملة",
      labelEn: "Currency",
      type: "select",
      col: 4,
      options: [
        { value: "SAR", labelAr: "ريال سعودي", labelEn: "SAR" },
        { value: "USD", labelAr: "دولار أمريكي", labelEn: "USD" },
      ],
      order : 6
    },

    {
      name: "images",
      labelAr: "الصور",
      labelEn: "Images",
      type: "file",
      multiple: true,
      col: 12,
    },

    {
      name: "isActive",
      labelAr: "نشط",
      labelEn: "Active",
      type: "checkbox",
      col: 12,
      // defaultValue: true,
    },
  ],

  /* ====================== CONDITIONAL FIELDS ====================== */
  conditionalFields: {
    transport: [
      // ... الحقول الأخرى كما هي
      {
        name: "vehicleType",
        labelAr: "نوع المركبة",
        labelEn: "Vehicle Type",
        type: "select",
        col: 4,
        order : 5 ,
        options: vehicleTypes.map((v) => ({
          value: v._id,
          labelAr: v.nameAr || v.nameEn || "—",
          labelEn: v.nameEn || v.nameAr || "—",
          
        })),
      },
      { name: "fromCity", labelAr: "من المدينة", labelEn: "From City", type: "text", col: 4 , order : 5 ,},
      { name: "toCity", labelAr: "إلى المدينة", labelEn: "To City", type: "text", col: 4 , order : 5 ,},
      { name: "startDate", labelAr: "تاريخ الانطلاق", labelEn: "Start Date", type: "date", col: 6 , order : 5 , },
      { name: "startTime", labelAr: "وقت الانطلاق", labelEn: "Start Time", type: "time", col: 6 , order : 5 ,},
      { name: "capacity.maxAdults", labelAr: "عدد البالغين", labelEn: "Max Adults", type: "number", col: 6 , order : 5 ,},
      { name: "capacity.maxChildren", labelAr: "عدد الأطفال", labelEn: "Max Children", type: "number", col: 6 , order : 5 , },

      // جديد: سمات خاصة بالنقل البري
      {
        name: "features",
        type: "checkbox-group-options", // نوع جديد للإشارة إلى خيارات شرطية (سيتم شرح كيفية دعمه في UniversalFormModal)
        order : 5 ,
        options: [
          { key: "ac", labelAr: "مكيف", labelEn: "Air Conditioning" },
          { key: "wifi", labelAr: "واي فاي", labelEn: "WiFi" },
          { key: "restStops", labelAr: "محطات راحة", labelEn: "Rest Stops" },
          { key: "luggageSpace", labelAr: "مساحة أمتعة", labelEn: "Luggage Space" },
          // أضف ما تريد
        ],
      },
    ],

    tour: [
      // ... الحقول الأخرى كما هي
      { name: "fromCity", labelAr: "من", labelEn: "From", type: "text", col: 6 , order : 5 ,},
      { name: "toCity", labelAr: "إلى", labelEn: "To", type: "text", col: 6 , order : 5 ,},
      { name: "startDate", labelAr: "تاريخ البداية", labelEn: "Start Date", type: "date", col: 3 , order : 5 ,},
      { name: "endDate", labelAr: "تاريخ النهاية", labelEn: "End Date", type: "date", col: 3 , order : 5 ,},
      { name: "duration.days", labelAr: "عدد الأيام", labelEn: "Days", type: "number", col: 3 , order : 5 ,},
      { name: "duration.nights", labelAr: "عدد الليالي", labelEn: "Nights", type: "number", col: 3 , order : 5 ,},

      // جديد: سمات خاصة بالجولات
      {
        name: "features",
        type: "checkbox-group-options",
        order : 5 ,
        options: [
          { key: "guide", labelAr: "دليل سياحي", labelEn: "Tour Guide" },
          { key: "snacks", labelAr: "وجبات خفيفة", labelEn: "Snacks" },
          { key: "transportInside", labelAr: "نقل داخلي", labelEn: "Internal Transport" },
          // أضف ما تريد
        ],
      },
    ],

    package: [
      // ... الحقول الأخرى كما هي
      { name: "startDate", labelAr: "تاريخ البداية", labelEn: "Start Date", type: "date", col: 4 , order : 5  },
      { name: "endDate", labelAr: "تاريخ النهاية", labelEn: "End Date", type: "date", col: 4 , order : 5  },
      { name: "duration.days", labelAr: "عدد الأيام", labelEn: "Days", type: "number", col: 4 , order : 5  },

      // جديد: سمات خاصة بالباقات
      {
        name: "features",
        type: "checkbox-group-options",
        order : 5 ,
        options: [
          { key: "insurance", labelAr: "تأمين سفر", labelEn: "Travel Insurance" },
          { key: "fullMeals", labelAr: "وجبات كاملة", labelEn: "Full Meals" },
          { key: "hotelIncluded", labelAr: "فندق مشمول", labelEn: "Hotel Included" },
          // أضف ما تريد
        ],
      },
    ],

    activity: [
      // ... الحقول الأخرى كما هي
      { name: "startDate", labelAr: "التاريخ", labelEn: "Date", type: "date", col: 4 ,order : 5  },
      { name: "startTime", labelAr: "الوقت", labelEn: "Time", type: "time", col: 4 , order : 5 },
      { name: "durationHours", labelAr: "المدة بالساعات", labelEn: "Duration (hours)", type: "number", col: 4 ,order : 5  },

      // جديد: سمات خاصة بالأنشطة (جوي أو غيره)
      {
        name: "features",
        type: "checkbox-group-options",
        order : 5 ,
        options: [
          { key: "safetyGear", labelAr: "معدات أمان", labelEn: "Safety Gear" },
          { key: "training", labelAr: "تدريب", labelEn: "Training" },
          { key: "inFlightMeals", labelAr: "وجبات جوية", labelEn: "In-Flight Meals" },
          { key: "luggageAllowance", labelAr: "بدل أمتعة", labelEn: "Luggage Allowance" },
          // أضف ما تريد
        ],
        
      },
       
    ],
   
  },
})