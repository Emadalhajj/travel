import path from "path";
import mongoose from "mongoose";

import Booking from "../../models/booking/booking-model.js";
import BookingLog from "../../models/bookingLog-model.js";
import AppError from "../../utils/AppError.js";
import { sendEmail } from "../notifications/email-service.js";
import { sendWhatsApp } from "../notifications/whatsapp-service.js";
import { createNotification } from "../notifications/notification-service.js";
import { createAuditLog } from "../audit/audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";
import { NOTIFICATION_TYPES } from "../../constants/notifications/notification-constants.js";

const DOCUMENT_TYPES = new Set(["ticket", "visa", "voucher", "confirmation", "other"]);
const DELIVERY_CHANNELS = new Set(["email", "whatsapp"]);

const asBoolean = (value) => value === true || String(value).toLowerCase() === "true";
export const serializeServiceDocument = (document) => ({
  id: document._id,
  documentType: document.documentType,
  titleAr: document.titleAr || "",
  titleEn: document.titleEn || "",
  note: document.note || "",
  originalName: document.originalName,
  url: document.url,
  mimeType: document.mimeType || "",
  size: document.size || 0,
  uploadedAt: document.uploadedAt,
  delivery: document.delivery,
});

export const registerGeneratedServiceDocumentService = async ({
  booking,
  documentType,
  originalName,
  storageName,
  mimeType = "application/pdf",
  size = 0,
  titleAr = "",
  titleEn = "",
  note = "",
  userId = null,
}) => {
  const existing = booking.serviceDocuments?.find(
    (document) => document.documentType === documentType,
  );
  if (existing) return existing;

  const documentId = new mongoose.Types.ObjectId();
  const generatedDocument = {
    _id: documentId,
    documentType,
    titleAr,
    titleEn,
    note,
    originalName,
    storageName,
    url: `/api/private-files/service-documents/${booking._id}/${documentId}`,
    mimeType,
    size,
    uploadedAt: new Date(),
    uploadedBy: userId,
  };
  const updated = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      isDeleted: false,
      serviceDocuments: { $not: { $elemMatch: { documentType } } },
    },
    { $push: { serviceDocuments: generatedDocument } },
    { new: true, runValidators: true },
  );
  const stored = updated?.serviceDocuments?.find(
    (document) => String(document._id) === String(documentId),
  );
  if (stored) return stored;

  const latest = await Booking.findOne({
    _id: booking._id,
    isDeleted: false,
    "serviceDocuments.documentType": documentType,
  }).select("serviceDocuments");
  return latest?.serviceDocuments?.find(
    (document) => document.documentType === documentType,
  ) || null;
};

const resolveWhatsAppRecipient = (booking) =>
  booking.customer?.whatsapp ||
  booking.pilgrims?.find((traveler) => traveler.whatsapp)?.whatsapp ||
  booking.customer?.phone ||
  "";

const documentAttachment = (document) => ({
  filename: document.originalName,
  path: path.resolve("private-uploads", "service-documents", document.storageName),
  contentType: document.mimeType || undefined,
});

export const deliverServiceDocuments = async ({
  booking,
  documents,
  channels,
  emailAdapter = sendEmail,
  whatsappAdapter = sendWhatsApp,
}) => {
  const results = {};
  const attachments = documents.map(documentAttachment);
  const titleAr = `مستندات الحجز ${booking.bookingNumber}`;
  const titleEn = `Documents for booking ${booking.bookingNumber}`;
  const messageAr = `تم إنجاز مستندات الحجز ${booking.bookingNumber} وإرفاقها لك.`;
  const messageEn = `The completed documents for booking ${booking.bookingNumber} are attached.`;

  if (channels.includes("email")) {
    try {
      const recipient = booking.customer?.email;
      if (!recipient) throw new Error("Customer email is missing");
      await emailAdapter({ to: recipient, subject: titleAr, text: `${messageAr}\n${messageEn}`, attachments });
      results.email = { status: "sent", sentAt: new Date(), error: "" };
    } catch (error) {
      results.email = { status: "failed", sentAt: null, error: String(error?.message || error) };
    }
  }
  if (channels.includes("whatsapp")) {
    try {
      const recipient = resolveWhatsAppRecipient(booking);
      if (!recipient) throw new Error("Customer WhatsApp number is missing");
      await whatsappAdapter({ to: recipient, message: messageAr, documents: attachments });
      results.whatsapp = { status: "sent", sentAt: new Date(), error: "" };
    } catch (error) {
      results.whatsapp = { status: "failed", sentAt: null, error: String(error?.message || error) };
    }
  }
  return results;
};

const recordDelivery = async ({ booking, documents, channels, req, results }) => {
  for (const document of documents) {
    for (const channel of channels) document.delivery[channel] = results[channel];
  }
  booking.markModified("serviceDocuments");
  await booking.save();

  await Promise.all([
    BookingLog.create({
      booking: booking._id,
      action: "service_documents_delivered",
      messageAr: "تم رفع أو إرسال مستندات الخدمة النهائية",
      messageEn: "Final service documents were uploaded or delivered",
      newValue: {
        documentIds: documents.map((document) => document._id),
        channels,
        results,
      },
      performedBy: req?.user?._id || null,
      role: req?.user?.role || "",
    }),
    createAuditLog({
      req,
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.BOOKING,
      entityId: booking._id,
      after: {
        serviceDocuments: documents.map(serializeServiceDocument),
        deliveryResults: results,
      },
      metadata: { module: "service_document_delivery" },
    }),
    createNotification({
      user: booking.user,
      booking: booking._id,
      titleAr: "مستندات الحجز جاهزة",
      titleEn: "Booking documents are ready",
      messageAr: `تمت إضافة مستندات جديدة للحجز ${booking.bookingNumber}.`,
      messageEn: `New documents were added to booking ${booking.bookingNumber}.`,
      type: NOTIFICATION_TYPES.DOCUMENTS_READY,
      metadata: { bookingNumber: booking.bookingNumber, documentIds: documents.map((item) => item._id) },
      createdBy: req?.user?._id || null,
      deduplicationKey: `booking:${booking._id}:service-documents:${documents.map((item) => item._id).join("-")}`,
    }),
  ]);
  return results;
};

export const uploadBookingServiceDocumentsService = async ({
  bookingId,
  files = [],
  data = {},
  userId,
  req,
}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) throw new AppError("INVALID_BOOKING_ID", 400, "bookingId");
  if (!files.length) throw new AppError("FILE_REQUIRED", 400, "documents");
  const documentType = String(data.documentType || "other").trim().toLowerCase();
  if (!DOCUMENT_TYPES.has(documentType)) throw new AppError("INVALID_SERVICE_DOCUMENT_TYPE", 400, "documentType");
  const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", 404, "bookingId");

  const created = files.map((file) => ({
    documentType,
    titleAr: String(data.titleAr || "").trim(),
    titleEn: String(data.titleEn || "").trim(),
    note: String(data.note || "").trim(),
    originalName: file.originalname || file.filename,
    storageName: file.filename,
    url: "",
    mimeType: file.mimetype || "",
    size: Number(file.size || 0),
    uploadedAt: new Date(),
    uploadedBy: userId || null,
  }));
  booking.serviceDocuments.push(...created);
  const stored = booking.serviceDocuments.slice(-created.length);
  stored.forEach((document) => {
    document.url = `/api/private-files/service-documents/${booking._id}/${document._id}`;
  });
  await booking.save();

  const channels = [
    ...(asBoolean(data.sendEmail) ? ["email"] : []),
    ...(asBoolean(data.sendWhatsapp) ? ["whatsapp"] : []),
  ];
  const results = channels.length ? await deliverServiceDocuments({ booking, documents: stored, channels }) : {};
  await recordDelivery({ booking, documents: stored, channels, req, results });
  return { documents: stored.map(serializeServiceDocument), delivery: results };
};

export const redeliverBookingServiceDocumentsService = async ({
  bookingId,
  documentIds = [],
  channels = [],
  req,
}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) throw new AppError("INVALID_BOOKING_ID", 400, "bookingId");
  const normalizedChannels = [...new Set(channels.map((item) => String(item).toLowerCase()))];
  if (!normalizedChannels.length || normalizedChannels.some((item) => !DELIVERY_CHANNELS.has(item))) {
    throw new AppError("INVALID_DOCUMENT_DELIVERY_CHANNEL", 400, "channels");
  }
  const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
  if (!booking) throw new AppError("BOOKING_NOT_FOUND", 404, "bookingId");
  const requested = new Set(documentIds.map(String));
  const documents = booking.serviceDocuments.filter((item) => requested.has(String(item._id)));
  if (!documents.length) throw new AppError("SERVICE_DOCUMENT_NOT_FOUND", 404, "documentIds");
  const results = await deliverServiceDocuments({ booking, documents, channels: normalizedChannels });
  await recordDelivery({ booking, documents, channels: normalizedChannels, req, results });
  return { documents: documents.map(serializeServiceDocument), delivery: results };
};
