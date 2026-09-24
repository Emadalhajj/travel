import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "../../../../constants/currencies";
import { createPricingPolicyFields } from "../shared/pricingPolicyFields";

export const tripDepartureFormConfig = (transports = []) => {
  const capacityByTransportId = new Map(
    transports.map((transport) => [String(transport._id), Number(transport.capacity || 0)]),
  );
  const validateCapacity = (value, state, isArabic) => {
    const required = Number(value || 0);
    const selectedIds = new Set(
      (state.segments || []).map((segment) => String(segment.transportId?._id || segment.transportId || "")).filter(Boolean),
    );
    const insufficient = [...selectedIds]
      .map((id) => capacityByTransportId.get(id))
      .find((capacity) => Number.isFinite(capacity) && required > capacity);
    if (insufficient === undefined) return true;
    return isArabic
      ? `سعة وسيلة النقل المختارة ${insufficient} راكبًا، بينما سعة المغادرة المطلوبة ${required}`
      : `The selected transport capacity is ${insufficient}, while the departure requires ${required} seats`;
  };

  return ({
  commonFields: [
    { name: "departureAt", labelAr: "موعد المغادرة", labelEn: "Departure At", type: "datetime-local", required: true, col: 6, order: 1 },
    { name: "arrivalAt", labelAr: "موعد الوصول", labelEn: "Arrival At", type: "datetime-local", col: 6, order: 1 },
    { name: "serviceNumber", labelAr: "رقم الخدمة", labelEn: "Service Number", type: "text", col: 4, order: 2 },
    { name: "pricing.basePrice", labelAr: "سعر هذه المغادرة", labelEn: "Departure Price", type: "number", required: true, min: 0, col: 4, order: 2 },
    { name: "pricing.discountPrice", labelAr: "خصم هذه المغادرة", labelEn: "Departure Discount Price", type: "number", min: 0, col: 4, order: 2 },
    { name: "pricing.currency", labelAr: "العملة", labelEn: "Currency", type: "select", options: CURRENCY_OPTIONS, defaultValue: DEFAULT_CURRENCY, col: 4, order: 3 },
    ...createPricingPolicyFields({ order: 4 }),
    { name: "capacity.totalSeats", labelAr: "السعة الكلية", labelEn: "Total Seats", type: "number", required: true, min: 0, validate: validateCapacity, col: 4, order: 3 },
    { name: "isActive", labelAr: "نشط", labelEn: "Active", type: "checkbox", defaultValue: true, col: 4, order: 3 },
    { name: "segments", labelAr: "مقاطع مسار المغادرة", labelEn: "Departure Route Segments", type: "array", structureLocked: true, itemLabelAr: "مقطع", itemLabelEn: "Segment", col: 12, order: 4, fields: [
      { name: "from", labelAr: "من", labelEn: "From", type: "text", readOnly: true, col: 3 },
      { name: "to", labelAr: "إلى", labelEn: "To", type: "text", readOnly: true, col: 3 },
      { name: "departureAt", labelAr: "المغادرة", labelEn: "Departure", type: "datetime-local", col: 3 },
      { name: "arrivalAt", labelAr: "الوصول", labelEn: "Arrival", type: "datetime-local", col: 3 },
      { name: "transportId", labelAr: "وسيلة النقل", labelEn: "Transport", type: "select", col: 4, options: transports.map((item) => ({ value: item._id, labelAr: `${item.nameAr || item.nameEn} (${item.capacity || 0})`, labelEn: `${item.nameEn || item.nameAr} (${item.capacity || 0})` })) },
      { name: "carrierName", labelAr: "الناقل", labelEn: "Carrier", type: "text", col: 4 },
      { name: "serviceNumber", labelAr: "رقم الخدمة", labelEn: "Service Number", type: "text", col: 4 },
    ] },
    { name: "notesAr", labelAr: "ملاحظات عربية", labelEn: "Arabic Notes", type: "textarea", language: "ar", col: 6, order: 5 },
    { name: "notesEn", labelAr: "ملاحظات إنجليزية", labelEn: "English Notes", type: "textarea", language: "en", col: 6, order: 5 },
  ],
  });
};
