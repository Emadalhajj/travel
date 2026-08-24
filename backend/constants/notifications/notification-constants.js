export const NOTIFICATION_CHANNELS = Object.freeze({
  DATABASE: "database",
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
});

export const NOTIFICATION_TYPES = Object.freeze({
  BOOKING_CREATED: "booking_created",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_FAILED: "payment_failed",
  PAID_PENDING_BOOKING: "paid_pending_booking",
  BANK_TRANSFER_SUBMITTED: "bank_transfer_submitted",
  BANK_TRANSFER_APPROVED: "bank_transfer_approved",
  BANK_TRANSFER_REJECTED: "bank_transfer_rejected",
  DOCUMENTS_READY: "documents_ready",
  GENERAL: "general",
});

export const NOTIFICATION_STATUS = Object.freeze({
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
});

export const NOTIFICATION_CHANNEL_VALUES = Object.freeze(
  Object.values(NOTIFICATION_CHANNELS),
);
export const NOTIFICATION_TYPE_VALUES = Object.freeze(
  Object.values(NOTIFICATION_TYPES),
);
export const NOTIFICATION_STATUS_VALUES = Object.freeze(
  Object.values(NOTIFICATION_STATUS),
);
