import mongoose from "mongoose";

import Booking from "../../models/booking/booking-model.js";
import BookingLog from "../../models/bookingLog-model.js";
import AppError from "../../utils/AppError.js";
import { BOOKING_STATUS } from "../../constants/booking/booking-status.js";
import {
  FULFILLMENT_STATUS,
  FULFILLMENT_STATUS_VALUES,
  buildInitialFulfillment,
  getFulfillmentSteps,
} from "../../constants/booking/booking-fulfillment.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import { createAuditLog } from "../audit/audit-log-service.js";
import { sendNotificationChannels } from "../notifications/notification-channel-service.js";
import { NOTIFICATION_TYPES } from "../../constants/notifications/notification-constants.js";
import { createVoucherForBooking } from "../voucher-service.js";

const TERMINAL_STATUSES = new Set([
  FULFILLMENT_STATUS.COMPLETED,
  FULFILLMENT_STATUS.FAILED,
  FULFILLMENT_STATUS.CANCELLED,
]);

const ensureAccommodationVoucher = async ({ booking, userId, req }) => {
  if (
    booking.fulfillment?.currentStep !== "VOUCHER_READY" ||
    !["ACCOMMODATION", "HOTEL"].includes(
      String(booking.serviceType || booking.fulfillment?.serviceType || "").toUpperCase(),
    )
  ) return null;

  return createVoucherForBooking({
    bookingId: booking._id,
    userId,
    locale: String(req?.headers?.["accept-language"] || "ar").startsWith("en")
      ? "en"
      : "ar",
    privateDocument: true,
    operationalBoundary: true,
  });
};

const serializeFulfillment = (value = {}) => ({
  serviceType: value.serviceType || "PACKAGE",
  status: value.status || FULFILLMENT_STATUS.PENDING,
  currentStep: value.currentStep || "",
  startedAt: value.startedAt || null,
  completedAt: value.completedAt || null,
  lastUpdatedAt: value.lastUpdatedAt || null,
  actionRequiredReason: value.actionRequiredReason || "",
  customerAction: value.customerAction ? {
    status: value.customerAction.status || "",
    requestedAt: value.customerAction.requestedAt || null,
    submittedAt: value.customerAction.submittedAt || null,
    note: value.customerAction.note || "",
    documents: Array.isArray(value.customerAction.documents)
      ? value.customerAction.documents
      : [],
  } : null,
});

export const validateFulfillmentTransition = ({ booking, nextStep, status }) => {
  if (!FULFILLMENT_STATUS_VALUES.includes(status)) {
    throw new AppError("INVALID_FULFILLMENT_STATUS", 400, "status");
  }
  const current = booking.fulfillment?.currentStep
    ? serializeFulfillment(booking.fulfillment)
    : buildInitialFulfillment(booking);
  const steps = getFulfillmentSteps(current.serviceType);
  const currentIndex = steps.indexOf(current.currentStep);
  const nextIndex = steps.indexOf(nextStep);
  if (nextIndex === -1) throw new AppError("INVALID_FULFILLMENT_STEP", 400, "currentStep");
  if (TERMINAL_STATUSES.has(current.status)) {
    throw new AppError("FULFILLMENT_TERMINAL", 409, "status");
  }
  if (TERMINAL_STATUSES.has(status) && nextIndex !== currentIndex) {
    throw new AppError("INVALID_FULFILLMENT_TRANSITION", 409, "currentStep");
  }
  if (nextIndex < currentIndex || (!TERMINAL_STATUSES.has(status) && nextIndex > currentIndex + 1)) {
    throw new AppError("INVALID_FULFILLMENT_TRANSITION", 409, "currentStep");
  }
  if (status === FULFILLMENT_STATUS.COMPLETED && nextIndex !== steps.length - 1) {
    throw new AppError("INVALID_FULFILLMENT_TRANSITION", 409, "status");
  }
  if (nextIndex > 0 && String(booking.paymentStatus || "").toLowerCase() !== "paid") {
    throw new AppError("FULFILLMENT_PAYMENT_REQUIRED", 409, "paymentStatus");
  }
  return { current, steps, nextIndex };
};

export const isSameFulfillment = (current, target) =>
  current.status === target.status &&
  current.currentStep === target.currentStep &&
  String(current.actionRequiredReason || "") === String(target.actionRequiredReason || "");

export const updateBookingFulfillmentService = async ({
  bookingId,
  nextStep,
  status = FULFILLMENT_STATUS.IN_PROGRESS,
  actionRequiredReason = "",
  userId,
  req,
  dependencies = {},
}) => {
  const deps = {
    findBooking: (filter) => Booking.findOne(filter),
    compareAndSetBooking: (filter, update) => Booking.findOneAndUpdate(
      filter,
      update,
      { new: true, runValidators: true },
    ),
    createBookingLog: (payload) => BookingLog.create(payload),
    createAudit: createAuditLog,
    notify: sendNotificationChannels,
    ...dependencies,
  };
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new AppError("INVALID_BOOKING_ID", 400, "bookingId");
  }
  const booking = await deps.findBooking({ _id: bookingId, isDeleted: false });
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", 404, "bookingId");

  const normalizedStep = String(nextStep || "").trim().toUpperCase();
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const normalizedReason = String(actionRequiredReason || "").trim();
  if (normalizedStatus === FULFILLMENT_STATUS.ACTION_REQUIRED && !normalizedReason) {
    throw new AppError("FULFILLMENT_ACTION_REASON_REQUIRED", 400, "actionRequiredReason");
  }
  const existing = booking.fulfillment?.currentStep
    ? serializeFulfillment(booking.fulfillment)
    : buildInitialFulfillment(booking);
  const requested = {
    ...existing,
    status: normalizedStatus,
    currentStep: normalizedStep,
    actionRequiredReason: normalizedStatus === FULFILLMENT_STATUS.ACTION_REQUIRED
      ? normalizedReason
      : "",
  };
  if (isSameFulfillment(existing, requested)) {
    await ensureAccommodationVoucher({ booking, userId, req });
    return existing;
  }
  const { current, steps, nextIndex } = validateFulfillmentTransition({
    booking,
    nextStep: normalizedStep,
    status: normalizedStatus,
  });
  const now = new Date();
  const isLastStep = nextIndex === steps.length - 1;
  const finalStatus = isLastStep && !TERMINAL_STATUSES.has(normalizedStatus) &&
    normalizedStatus !== FULFILLMENT_STATUS.ACTION_REQUIRED
    ? FULFILLMENT_STATUS.COMPLETED
    : normalizedStatus;
  const before = serializeFulfillment(current);

  booking.fulfillment = {
    ...before,
    status: finalStatus,
    currentStep: normalizedStep,
    startedAt: before.startedAt || now,
    completedAt: finalStatus === FULFILLMENT_STATUS.COMPLETED ? now : null,
    lastUpdatedAt: now,
    actionRequiredReason: finalStatus === FULFILLMENT_STATUS.ACTION_REQUIRED
      ? normalizedReason
      : "",
    customerAction: finalStatus === FULFILLMENT_STATUS.ACTION_REQUIRED
      ? {
        status: "requested",
        requestedAt: now,
        submittedAt: null,
        note: "",
        documents: [],
      }
      : before.customerAction,
  };
  const update = {
    $set: {
      fulfillment: booking.fulfillment,
      updatedBy: userId || null,
      ...(finalStatus === FULFILLMENT_STATUS.COMPLETED
        ? { bookingStatus: BOOKING_STATUS.COMPLETED }
        : {}),
    },
    $inc: { __v: 1 },
  };
  const updatedBooking = await deps.compareAndSetBooking(
    { _id: booking._id, isDeleted: false, __v: booking.__v },
    update,
  );
  if (!updatedBooking) {
    const latest = await deps.findBooking({ _id: booking._id, isDeleted: false });
    if (!latest) throw new AppError("BOOKING_NOT_FOUND", 404, "bookingId");
    const latestFulfillment = serializeFulfillment(latest.fulfillment);
    const target = serializeFulfillment(booking.fulfillment);
    if (isSameFulfillment(latestFulfillment, target)) return latestFulfillment;
    throw new AppError("FULFILLMENT_CONCURRENT_CHANGE", 409, "fulfillment");
  }

  const after = serializeFulfillment(updatedBooking.fulfillment);
  await ensureAccommodationVoucher({ booking: updatedBooking, userId, req });
  await Promise.all([
    deps.createBookingLog({
      booking: updatedBooking._id,
      action: "fulfillment_status_change",
      messageAr: `تم تحديث تنفيذ الخدمة إلى ${normalizedStep}`,
      messageEn: `Service fulfillment updated to ${normalizedStep}`,
      oldValue: before,
      newValue: after,
      performedBy: userId || null,
      role: req?.user?.role || "",
      ipAddress: req?.ip || "",
      userAgent: req?.get?.("user-agent") || "",
    }),
    deps.createAudit({
      req,
      action: AUDIT_ACTIONS.STATUS_CHANGE,
      entity: AUDIT_ENTITIES.BOOKING,
      entityId: updatedBooking._id,
      before: { fulfillment: before },
      after: { fulfillment: after, bookingStatus: updatedBooking.bookingStatus },
      metadata: { module: "booking_fulfillment" },
    }),
  ]);

  const shouldNotify = finalStatus === FULFILLMENT_STATUS.ACTION_REQUIRED ||
    finalStatus === FULFILLMENT_STATUS.COMPLETED ||
    ["PROVIDER_CONFIRMED", "TICKET_ISSUED", "DOCUMENTS_READY", "VISA_ISSUED", "VOUCHER_READY"].includes(normalizedStep);
  try {
    if (!shouldNotify) return after;
    await deps.notify({
      payload: {
        user: updatedBooking.user,
        booking: updatedBooking._id,
        titleAr: "تحديث تنفيذ الخدمة",
        titleEn: "Service fulfillment update",
        messageAr: finalStatus === FULFILLMENT_STATUS.ACTION_REQUIRED
          ? `الحجز ${updatedBooking.bookingNumber}: ${normalizedReason}`
          : `تم تحديث حالة تنفيذ الحجز ${updatedBooking.bookingNumber}.`,
        messageEn: finalStatus === FULFILLMENT_STATUS.ACTION_REQUIRED
          ? `Booking ${updatedBooking.bookingNumber}: ${normalizedReason}`
          : `Fulfillment for booking ${updatedBooking.bookingNumber} was updated.`,
        type: NOTIFICATION_TYPES.GENERAL,
        metadata: { bookingNumber: updatedBooking.bookingNumber, ...after },
        createdBy: userId || null,
      },
      email: updatedBooking.customer?.email || "",
      deduplicationBase: `booking:${updatedBooking._id}:fulfillment:${updatedBooking.__v}`,
      req,
    });
  } catch (error) {
    console.error("Fulfillment notification failed:", error?.message || error);
  }

  return after;
};

export const submitCustomerFulfillmentActionService = async ({
  bookingId,
  userId,
  note = "",
  files = [],
  req,
  dependencies = {},
}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new AppError("INVALID_BOOKING_ID", 400, "bookingId");
  }
  const deps = {
    findBooking: (filter) => Booking.findOne(filter),
    compareAndSetBooking: (filter, update) => Booking.findOneAndUpdate(
      filter,
      update,
      { new: true, runValidators: true },
    ),
    createBookingLog: (payload) => BookingLog.create(payload),
    createAudit: createAuditLog,
    ...dependencies,
  };
  const booking = await deps.findBooking({
    _id: bookingId,
    user: userId,
    isDeleted: false,
  });
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", 404, "bookingId");
  const before = serializeFulfillment(booking.fulfillment);
  if (before.status !== FULFILLMENT_STATUS.ACTION_REQUIRED) {
    if (before.customerAction?.status === "submitted") return before;
    throw new AppError("FULFILLMENT_ACTION_NOT_REQUIRED", 409, "fulfillment");
  }
  const normalizedNote = String(note || "").trim();
  if (!normalizedNote && !files.length) {
    throw new AppError("FULFILLMENT_ACTION_RESPONSE_REQUIRED", 400, "documents");
  }
  const now = new Date();
  const documents = files.map((file) => ({
    name: file.originalname || file.filename,
    url: `/api/private-files/booking-actions/${booking._id}/${file.filename}`,
    mimeType: file.mimetype || "",
    size: Number(file.size || 0),
    uploadedAt: now,
  }));
  const fulfillment = {
    ...before,
    status: FULFILLMENT_STATUS.IN_PROGRESS,
    actionRequiredReason: "",
    lastUpdatedAt: now,
    customerAction: {
      status: "submitted",
      requestedAt: before.customerAction?.requestedAt || now,
      submittedAt: now,
      note: normalizedNote,
      documents,
    },
  };
  const updatedBooking = await deps.compareAndSetBooking(
    {
      _id: booking._id,
      user: userId,
      isDeleted: false,
      __v: booking.__v,
      "fulfillment.status": FULFILLMENT_STATUS.ACTION_REQUIRED,
    },
    {
      $set: { fulfillment },
      $inc: { __v: 1 },
    },
  );
  if (!updatedBooking) {
    const latest = await deps.findBooking({ _id: booking._id, user: userId, isDeleted: false });
    if (latest?.fulfillment?.customerAction?.status === "submitted") {
      return serializeFulfillment(latest.fulfillment);
    }
    throw new AppError("FULFILLMENT_CONCURRENT_CHANGE", 409, "fulfillment");
  }
  const after = serializeFulfillment(updatedBooking.fulfillment);
  await Promise.all([
    deps.createBookingLog({
      booking: updatedBooking._id,
      action: "fulfillment_customer_action_submitted",
      messageAr: "استجاب العميل للإجراء المطلوب",
      messageEn: "Customer submitted the required action",
      oldValue: before,
      newValue: after,
      performedBy: userId,
      role: req?.user?.role || "user",
      ipAddress: req?.ip || "",
      userAgent: req?.get?.("user-agent") || "",
    }),
    deps.createAudit({
      req,
      action: AUDIT_ACTIONS.STATUS_CHANGE,
      entity: AUDIT_ENTITIES.BOOKING,
      entityId: updatedBooking._id,
      before: { fulfillment: before },
      after: { fulfillment: after },
      metadata: { module: "booking_fulfillment", source: "customer_action" },
    }),
  ]);
  return after;
};
