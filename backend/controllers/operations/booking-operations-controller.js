import asyncHandler from "../../middleware/asyncHandler.js";
import {
  getBookingOperationsDetailsService,
  listBookingOperationsService,
} from "../../services/operations/booking-operations-service.js";
import { updateBookingFulfillmentService } from "../../services/operations/booking-fulfillment-service.js";
import {
  redeliverBookingServiceDocumentsService,
  uploadBookingServiceDocumentsService,
} from "../../services/operations/booking-service-document-service.js";
import { deleteLocalUpload } from "../../utils/deleteLocalUpload.js";

export const getBookingOperationsDetails = asyncHandler(async (req, res) => {
  const data = await getBookingOperationsDetailsService({
    bookingId: req.params.bookingId,
    req,
  });
  res.status(200).json({ success: true, data });
});

export const listBookingOperations = asyncHandler(async (req, res) => {
  const data = await listBookingOperationsService(req.query);
  res.status(200).json({ success: true, ...data });
});

export const updateBookingFulfillment = asyncHandler(async (req, res) => {
  const fulfillment = await updateBookingFulfillmentService({
    bookingId: req.params.bookingId,
    nextStep: req.body?.currentStep,
    status: req.body?.status,
    actionRequiredReason: req.body?.actionRequiredReason,
    userId: req.user?._id,
    req,
  });
  res.status(200).json({ success: true, data: { fulfillment } });
});

export const uploadBookingServiceDocuments = asyncHandler(async (req, res) => {
  try {
    const data = await uploadBookingServiceDocumentsService({
      bookingId: req.params.bookingId,
      files: req.files || [],
      data: req.body || {},
      userId: req.user?._id,
      req,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    await Promise.all((req.files || []).map((file) => deleteLocalUpload({
      filePath: String(file.path || "").replace(/\\/g, "/"),
      allowedFolder: "private-uploads/service-documents",
    })));
    throw error;
  }
});

export const redeliverBookingServiceDocuments = asyncHandler(async (req, res) => {
  const data = await redeliverBookingServiceDocumentsService({
    bookingId: req.params.bookingId,
    documentIds: Array.isArray(req.body?.documentIds) ? req.body.documentIds : [],
    channels: Array.isArray(req.body?.channels) ? req.body.channels : [],
    req,
  });
  res.status(200).json({ success: true, data });
});
