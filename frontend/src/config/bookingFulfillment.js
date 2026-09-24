const ACCOMMODATION_WORKFLOW = Object.freeze(["REQUEST_RECEIVED", "AVAILABILITY_CHECK", "BOOKING_REQUESTED", "PROVIDER_CONFIRMED", "VOUCHER_READY", "DELIVERED"]);

export const FULFILLMENT_WORKFLOWS = Object.freeze({
  FLIGHT: ["BOOKING_CREATED", "PAYMENT_RECEIVED", "PROVIDER_CONFIRMED", "TICKET_ISSUED", "DOCUMENTS_READY", "DELIVERED"],
  TRIP: ["REQUEST_RECEIVED", "BOOKING_REQUESTED", "PROVIDER_CONFIRMED", "DOCUMENTS_READY", "DELIVERED"],
  ACCOMMODATION: ACCOMMODATION_WORKFLOW,
  HOTEL: ACCOMMODATION_WORKFLOW,
  VISA: ["REQUEST_RECEIVED", "DOCUMENTS_REVIEW", "APPLICATION_SUBMITTED", "UNDER_PROCESSING", "VISA_ISSUED", "DELIVERED"],
  TRANSPORT: ["REQUEST_RECEIVED", "VEHICLE_ASSIGNED", "DRIVER_ASSIGNED", "SERVICE_READY", "DELIVERED"],
  ZIYARAT: ["REQUEST_RECEIVED", "SCHEDULED", "SERVICE_READY", "DELIVERED"],
  EXTRA_SERVICE: ["REQUEST_RECEIVED", "IN_PROGRESS", "SERVICE_READY", "DELIVERED"],
  PACKAGE: ["REQUEST_RECEIVED", "IN_PROGRESS", "SERVICE_READY", "DELIVERED"],
});

const LABELS = {
  BOOKING_CREATED: ["تم إنشاء الحجز", "Booking created"],
  PAYMENT_RECEIVED: ["تم استلام الدفع", "Payment received"],
  REQUEST_RECEIVED: ["تم استلام الطلب", "Request received"],
  AVAILABILITY_CHECK: ["التحقق من التوفر", "Availability check"],
  BOOKING_REQUESTED: ["تم إرسال طلب الحجز", "Booking requested"],
  PROVIDER_CONFIRMED: ["تم تأكيد الخدمة لدى المزود", "Provider confirmed"],
  TICKET_ISSUED: ["تم إصدار التذكرة", "Ticket issued"],
  DOCUMENTS_READY: ["المستندات جاهزة", "Documents ready"],
  DOCUMENTS_REVIEW: ["مراجعة المستندات", "Documents review"],
  APPLICATION_SUBMITTED: ["تم تقديم الطلب", "Application submitted"],
  UNDER_PROCESSING: ["قيد المعالجة", "Under processing"],
  VISA_ISSUED: ["تم إصدار التأشيرة", "Visa issued"],
  VOUCHER_READY: ["الفاوتشر جاهز", "Voucher ready"],
  VEHICLE_ASSIGNED: ["تم تعيين وسيلة النقل", "Vehicle assigned"],
  DRIVER_ASSIGNED: ["تم تعيين السائق", "Driver assigned"],
  SCHEDULED: ["تمت الجدولة", "Scheduled"],
  IN_PROGRESS: ["جاري تنفيذ الخدمة", "Service in progress"],
  SERVICE_READY: ["الخدمة جاهزة", "Service ready"],
  DELIVERED: ["تم التسليم واكتمال الخدمة", "Delivered and completed"],
};

export const getFulfillmentWorkflow = (serviceType) =>
  FULFILLMENT_WORKFLOWS[String(serviceType || "PACKAGE").toUpperCase()] || FULFILLMENT_WORKFLOWS.PACKAGE;

export const getFulfillmentStepLabel = (step, isArabic = true) =>
  (LABELS[step] || [step, step])[isArabic ? 0 : 1];
