export const TRIP_TYPES= Object.freeze({ // تجميد أنواع الرحلات
  AIR: "AIR",
  LAND: "LAND",
  SEA: "SEA",
});
// TRIP_TYPE_VALUES يحول القيم إلى مصفوفة لتسهيل الوصول إليها واستخدامها في أي مكان في التطبيق.
/*
وتكون مفيده في Mongoose
Joi
Filters
Validation
*/
export const TRIP_TYPE_VALUES = Object.freeze(
  Object.values(TRIP_TYPES), // تجميد قيم أنواع الرحلات
);

/*
اما TRIP_SCOPES و TRIP_SOURCES فهي لتحديد نطاقات الرحلات ومصادرها، وتجميدها لتسهيل الوصول إليها واستخدامها في أي مكان في التطبيق.
وتكون مفيدة في Business Logic:
مثل 
if (trip.type === TRIP_TYPES.AIR) {
  ...
}
*/
export const TRIP_SCOPES = Object.freeze({ // تجميد نطاقات الرحلات
  DOMESTIC: "DOMESTIC", // الرحلات الداخلية
  INTERNATIONAL: "INTERNATIONAL", // الرحلات الدولية
});

export const TRIP_SCOPE_VALUES = Object.freeze(
  Object.values(TRIP_SCOPES),
);

export const TRIP_SOURCES = Object.freeze({
  MANUAL: "MANUAL",
  API: "API",
});
export const TRIP_SOURCE_VALUES = Object.freeze(
  Object.values(TRIP_SOURCES),
);

export const LAND_TRIP_SUBTYPES = Object.freeze({
  TOUR: "TOUR", // جولة سياحية
  ACTIVITY: "ACTIVITY", // نشاط سياحي
  TRANSFER: "TRANSFER", // نقل من مكان إلى آخر
  TRANSPORT: "TRANSPORT", // نقل ركاب أو بضائع
});

export const SEA_TRIP_SUBTYPES = Object.freeze({
  FERRY: "FERRY", // قارب نقل
  CRUISE: "CRUISE", // سفينة سياحية
  TOUR: "TOUR", // جولة سياحية
  TRANSFER: "TRANSFER", // نقل من مكان إلى آخر
});

export const AIR_TRIP_SUBTYPES = Object.freeze({
  FLIGHT: "FLIGHT", // رحلة جوية
});
// وظيفة TRIP_SUBTYPES_BY_TYPE
/*

الناتج تقريبًا:
{
  AIR: [
    "FLIGHT"
  ],

  LAND: [
    "TOUR",
    "ACTIVITY",
    "TRANSFER",
    "TRANSPORT"
  ],

  SEA: [
    "FERRY",
    "CRUISE",
    "TOUR",
    "TRANSFER"
  ]
}
  وهذا سيفيدنا كثيرًا في الـFrontend أيضًا.

إذا اختار المستخدم:

LAND

يمكن للنظام معرفة الـsubtypes المناسبة مباشرة:

TRIP_SUBTYPES_BY_TYPE["LAND"]

والنتيجة:

[
  "TOUR",
  "ACTIVITY",
  "TRANSFER",
  "TRANSPORT"
]

بدل كتابة if/else داخل الفورم.
*/
export const TRIP_SUBTYPES_BY_TYPE = Object.freeze({
  [TRIP_TYPES.AIR]: Object.values(AIR_TRIP_SUBTYPES),
  [TRIP_TYPES.LAND]: Object.values(LAND_TRIP_SUBTYPES),
  [TRIP_TYPES.SEA]: Object.values(SEA_TRIP_SUBTYPES),
});

/*
في ALL_TRIP_SUBTYPE_VALUES
اولا لدينا Object.values(TRIP_SUBTYPES_BY_TYPE)
يعطينا 
[
  ["FLIGHT"],
  ["TOUR", "ACTIVITY", "TRANSFER", "TRANSPORT"],
  ["FERRY", "CRUISE", "TOUR", "TRANSFER"]
]
.flat()
  يعطنا 
  [
  "FLIGHT",
  "TOUR",
  "ACTIVITY",
  "TRANSFER",
  "TRANSPORT",
  "FERRY",
  "CRUISE",
  "TOUR",
  "TRANSFER"
]

هناك تكرار:

TOUR
TRANSFER

لأنها موجودة في LAND وSEA.

لذلك:

new Set(...)

يحذف التكرار.

فتصبح النتيجة:

[
  "FLIGHT",
  "TOUR",
  "ACTIVITY",
  "TRANSFER",
  "TRANSPORT",
  "FERRY",
  "CRUISE"
]

ثم يستخدمها الموديل:

subtype: {
  type: String,
  enum: ALL_TRIP_SUBTYPE_VALUES,
}


*/
export const ALL_TRIP_SUBTYPE_VALUES = Object.freeze([
  ...new Set( // يمنع التكرار
    Object.values(TRIP_SUBTYPES_BY_TYPE).flat(), // دمج جميع القيم في مصفوفة واحدة
  ),
]);

/*
وظيفتها وظيفتها التأكد أن العلاقة صحيحة.
بمعنى آخر، إذا كان نوع الرحلة هو LAND، فإن subtype يجب أن يكون واحدًا من LAND_TRIP_SUBTYPES.
مثلا 
isTripSubtypeAllowed(
  "LAND",
  "TRANSPORT",
); يرجع true
اما 
isTripSubtypeAllowed(
  "AIR",
  "CRUISE",
); يرجع false
لان CRUISE موجودة في SEA وليس في AIR.
*/
export const isTripSubtypeAllowed = (
  type,
  subtype,
) => {
  return (
    TRIP_SUBTYPES_BY_TYPE[type]?.includes(
      subtype,
    ) ?? false // إذا لم يكن النوع موجودًا، يرجع false
  );
}; 