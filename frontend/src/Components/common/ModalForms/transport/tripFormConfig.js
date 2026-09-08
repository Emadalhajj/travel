import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "../../../../constants/currencies";
import {
  getTripSubtypeOptions,
  TRIP_SCOPE_OPTIONS,
  TRIP_SOURCE_OPTIONS,
  TRIP_TYPE_OPTIONS,
} from "../../../../constants/trips/trip.constants";

const routeFields = [
  { name: "location", labelAr: "الموقع", labelEn: "Location", type: "text", required: true, col: 6 },
  { name: "notes", labelAr: "ملاحظات", labelEn: "Notes", type: "text", col: 6 },
];

const hideForExternalAir = (state = {}) =>
  state.type !== "AIR" || state.source !== "API";

const showForManualAir = (state = {}) => state.source !== "API";

export const tripFormConfig = (transports = []) => ({
  conditionKey: "type",
  commonFields: [
    { name: "nameAr", labelAr: "الاسم بالعربية", labelEn: "Arabic Name", type: "text", col: 6, required: true, order: 1, visibleWhen: hideForExternalAir },
    { name: "nameEn", labelAr: "الاسم بالإنجليزية", labelEn: "English Name", type: "text", col: 6, required: true, order: 1, visibleWhen: hideForExternalAir },
    { name: "descriptionAr", labelAr: "الوصف بالعربية", labelEn: "Arabic Description", type: "textarea", col: 6, order: 2, visibleWhen: hideForExternalAir },
    { name: "descriptionEn", labelAr: "الوصف بالإنجليزية", labelEn: "English Description", type: "textarea", col: 6, order: 2, visibleWhen: hideForExternalAir },
    {
      name: "type", labelAr: "نوع الرحلة", labelEn: "Trip Type", type: "select", col: 4,
      options: TRIP_TYPE_OPTIONS, required: true, order: 3,
      onValueChange: ({ next }) => ({ ...next, subtype: "" }),
    },
    { name: "scope", labelAr: "النطاق", labelEn: "Scope", type: "select", col: 4, options: TRIP_SCOPE_OPTIONS, required: true, order: 3, defaultValue: "DOMESTIC" },
    { name: "subtype", labelAr: "التصنيف", labelEn: "Subtype", type: "select", col: 4, options: (state) => getTripSubtypeOptions(state.type), required: true, order: 3 },
    { name: "pricing.basePrice", labelAr: "السعر الافتراضي", labelEn: "Default Price", type: "number", col: 4, required: true, min: 0, order: 7, visibleWhen: hideForExternalAir },
    { name: "pricing.discountPrice", labelAr: "الخصم الافتراضي", labelEn: "Default Discount Price", type: "number", col: 4, min: 0, order: 7, visibleWhen: hideForExternalAir },
    { name: "pricing.currency", labelAr: "العملة", labelEn: "Currency", type: "select", col: 4, defaultValue: DEFAULT_CURRENCY, options: CURRENCY_OPTIONS, order: 7, visibleWhen: hideForExternalAir },
    { name: "features", labelAr: "المميزات", labelEn: "Features", type: "checkbox-group", valueMode: "object", col: 12, options: [
      { key: "wifi", labelAr: "واي فاي", labelEn: "WiFi" },
      { key: "meals", labelAr: "وجبات", labelEn: "Meals" },
      { key: "baggage", labelAr: "أمتعة", labelEn: "Baggage" },
    ], order: 8, visibleWhen: hideForExternalAir },
    { name: "images", labelAr: "الصور", labelEn: "Images", type: "file", multiple: true, col: 12, order: 9, visibleWhen: hideForExternalAir },
    { name: "isActive", labelAr: "نشط", labelEn: "Active", type: "checkbox", col: 12, defaultValue: true, order: 10, visibleWhen: hideForExternalAir },
  ],
  conditionalFields: {
    AIR: [
      { name: "source", labelAr: "المصدر", labelEn: "Source", type: "select", options: TRIP_SOURCE_OPTIONS, defaultValue: "MANUAL", col: 4, order: 4 },
      { name: "airline", labelAr: "شركة الطيران", labelEn: "Airline", type: "text", col: 4, order: 4, visibleWhen: showForManualAir },
      { name: "flightNumber", labelAr: "رقم الرحلة", labelEn: "Flight Number", type: "text", col: 4, order: 4, visibleWhen: showForManualAir },
      { name: "originAirport", labelAr: "مطار المغادرة", labelEn: "Origin Airport", type: "text", col: 4, required: true, order: 5, visibleWhen: showForManualAir },
      { name: "destinationAirport", labelAr: "مطار الوصول", labelEn: "Destination Airport", type: "text", col: 4, required: true, order: 5, visibleWhen: showForManualAir },
      { name: "cabinClass", labelAr: "درجة المقصورة", labelEn: "Cabin Class", type: "text", col: 4, order: 5, visibleWhen: showForManualAir },
      { name: "departureTerminal", labelAr: "صالة المغادرة", labelEn: "Departure Terminal", type: "text", col: 3, order: 6, visibleWhen: showForManualAir },
      { name: "arrivalTerminal", labelAr: "صالة الوصول", labelEn: "Arrival Terminal", type: "text", col: 3, order: 6, visibleWhen: showForManualAir },
      { name: "fareClass", labelAr: "فئة السعر", labelEn: "Fare Class", type: "text", col: 2, order: 6, visibleWhen: showForManualAir },
      { name: "baggage", labelAr: "سياسة الأمتعة", labelEn: "Baggage", type: "text", col: 2, order: 6, visibleWhen: showForManualAir },
      { name: "aircraft", labelAr: "الطائرة", labelEn: "Aircraft", type: "text", col: 2, order: 6, visibleWhen: showForManualAir },
    ],
    LAND: [
      { name: "transportId", labelAr: "وسيلة النقل", labelEn: "Transport", type: "select", required: true, col: 6, options: transports.map((item) => ({ value: item._id, labelAr: item.nameAr || item.nameEn, labelEn: item.nameEn || item.nameAr })), order: 4 },
      { name: "routeStops", labelAr: "محطات المسار", labelEn: "Route Stops", type: "array", itemLabelAr: "محطة", itemLabelEn: "Stop", fields: routeFields, col: 12, order: 5 },
    ],
    SEA: [
      { name: "vesselName", labelAr: "اسم السفينة", labelEn: "Vessel Name", type: "text", col: 6, order: 4 },
      { name: "cabinTypes", labelAr: "أنواع المقصورات", labelEn: "Cabin Types", type: "text", col: 6, order: 4 },
      { name: "ports", labelAr: "الموانئ", labelEn: "Ports", type: "array", itemLabelAr: "ميناء", itemLabelEn: "Port", fields: routeFields, col: 12, order: 5 },
      { name: "mealsIncluded", labelAr: "الوجبات مشمولة", labelEn: "Meals Included", type: "checkbox", col: 4, order: 6 },
      { name: "baggagePolicy", labelAr: "سياسة الأمتعة", labelEn: "Baggage Policy", type: "textarea", col: 8, order: 6 },
    ],
  },
});
