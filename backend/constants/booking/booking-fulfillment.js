export const FULFILLMENT_STATUS = Object.freeze({
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  ACTION_REQUIRED: "action_required",
  READY: "ready",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

export const FULFILLMENT_STATUS_VALUES = Object.freeze(
  Object.values(FULFILLMENT_STATUS),
);

const ACCOMMODATION_WORKFLOW = Object.freeze([
  "REQUEST_RECEIVED",
  "AVAILABILITY_CHECK",
  "BOOKING_REQUESTED",
  "PROVIDER_CONFIRMED",
  "VOUCHER_READY",
  "DELIVERED",
]);

export const FULFILLMENT_WORKFLOWS = Object.freeze({
  FLIGHT: [
    "BOOKING_CREATED",
    "PAYMENT_RECEIVED",
    "PROVIDER_CONFIRMED",
    "TICKET_ISSUED",
    "DOCUMENTS_READY",
    "DELIVERED",
  ],
  TRIP: [
    "REQUEST_RECEIVED",
    "BOOKING_REQUESTED",
    "PROVIDER_CONFIRMED",
    "DOCUMENTS_READY",
    "DELIVERED",
  ],
  ACCOMMODATION: ACCOMMODATION_WORKFLOW,
  HOTEL: ACCOMMODATION_WORKFLOW,
  VISA: [
    "REQUEST_RECEIVED",
    "DOCUMENTS_REVIEW",
    "APPLICATION_SUBMITTED",
    "UNDER_PROCESSING",
    "VISA_ISSUED",
    "DELIVERED",
  ],
  TRANSPORT: [
    "REQUEST_RECEIVED",
    "VEHICLE_ASSIGNED",
    "DRIVER_ASSIGNED",
    "SERVICE_READY",
    "DELIVERED",
  ],
  ZIYARAT: ["REQUEST_RECEIVED", "SCHEDULED", "SERVICE_READY", "DELIVERED"],
  EXTRA_SERVICE: ["REQUEST_RECEIVED", "IN_PROGRESS", "SERVICE_READY", "DELIVERED"],
  PACKAGE: ["REQUEST_RECEIVED", "IN_PROGRESS", "SERVICE_READY", "DELIVERED"],
});

export const resolveFulfillmentServiceType = (booking = {}) => {
  const explicit = String(booking.serviceType || "").trim().toUpperCase();
  return FULFILLMENT_WORKFLOWS[explicit] ? explicit : "PACKAGE";
};

export const getFulfillmentSteps = (serviceType) =>
  FULFILLMENT_WORKFLOWS[String(serviceType || "PACKAGE").toUpperCase()] ||
  FULFILLMENT_WORKFLOWS.PACKAGE;

export const buildInitialFulfillment = (booking = {}, now = new Date()) => {
  const serviceType = resolveFulfillmentServiceType(booking);
  const steps = getFulfillmentSteps(serviceType);
  const paid = String(booking.paymentStatus || "").toLowerCase() === "paid";
  const providerConfirmed = Boolean(
    booking.bookingItems?.trip?.external?.orderId ||
    booking.bookingItems?.trip?.external?.providerOrderId,
  );
  let currentStep = steps[0];
  if (paid && steps.includes("PAYMENT_RECEIVED")) currentStep = "PAYMENT_RECEIVED";
  if (providerConfirmed && steps.includes("PROVIDER_CONFIRMED")) currentStep = "PROVIDER_CONFIRMED";

  return {
    serviceType,
    status: FULFILLMENT_STATUS.IN_PROGRESS,
    currentStep,
    startedAt: now,
    completedAt: null,
    lastUpdatedAt: now,
    actionRequiredReason: "",
  };
};
