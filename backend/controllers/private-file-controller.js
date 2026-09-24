import path from "path";
import fs from "fs";

import DraftBooking from "../models/draft-bookings/draft-booking-model.js";
import PaymentTransaction from "../models/payments/paymentTransaction-model.js";
import Booking from "../models/booking/booking-model.js";
import Voucher from "../models/voucher-model.js";
import Hotel from "../models/hotels/hotel-model.js";
import AppError from "../utils/AppError.js";

const ADMIN_ROLES = new Set(["admin", "superAdmin"]);

const safeFilename = (value) => {
  const filename = path.basename(String(value || ""));
  if (!filename || filename !== value) throw new AppError("INVALID_FILENAME", 400);
  return filename;
};

const sendPrivateFile = ({ res, folder, filename, downloadName }) => {
  const candidates = [
    path.resolve("private-uploads", folder, filename),
    path.resolve("uploads", folder, filename),
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) throw new AppError("DOCUMENT_NOT_FOUND", 404);

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  return res.download(filePath, downloadName || filename);
};

export const downloadDraftDocument = async (req, res, next) => {
  try {
    const filename = safeFilename(req.params.filename);
    const accessFilter = ADMIN_ROLES.has(req.user.role) ? {} : { user: req.user._id };
    const draft = await DraftBooking.findOne({
      _id: req.params.draftId,
      isDeleted: { $ne: true },
      ...accessFilter,
    }).lean();
    if (!draft) throw new AppError("DOCUMENT_NOT_FOUND", 404);

    const associated = JSON.stringify(draft).includes(filename);
    if (!associated) throw new AppError("DOCUMENT_NOT_FOUND", 404);
    return sendPrivateFile({ res, folder: "draft-bookings", filename });
  } catch (error) {
    return next(error);
  }
};

export const downloadPaymentProof = async (req, res, next) => {
  try {
    const filename = safeFilename(req.params.filename);
    const accessFilter = ADMIN_ROLES.has(req.user.role) ? {} : { user: req.user._id };
    const transaction = await PaymentTransaction.findOne({
      _id: req.params.transactionId,
      isDeleted: { $ne: true },
      ...accessFilter,
      $or: [
        { "proofAttachments.publicId": filename },
        { "proofAttachments.url": { $regex: `${filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$` } },
      ],
    }).select("proofAttachments").lean();
    if (!transaction) throw new AppError("DOCUMENT_NOT_FOUND", 404);
    const attachment = transaction.proofAttachments?.find((item) =>
      item.publicId === filename || String(item.url || "").endsWith(`/${filename}`),
    );
    return sendPrivateFile({
      res,
      folder: "payment-proofs",
      filename,
      downloadName: attachment?.name,
    });
  } catch (error) {
    return next(error);
  }
};

export const downloadHotelAttachment = async (req, res, next) => {
  try {
    const hotel = await Hotel.findOne({
      _id: req.params.hotelId,
      isDeleted: false,
      "attachments._id": req.params.attachmentId,
    }).select("attachments").lean();
    if (!hotel) throw new AppError("DOCUMENT_NOT_FOUND", 404);

    const attachment = hotel.attachments?.find(
      (item) => String(item._id) === String(req.params.attachmentId),
    );
    if (!attachment) throw new AppError("DOCUMENT_NOT_FOUND", 404);

    return sendPrivateFile({
      res,
      folder: "hotel-attachments",
      filename: safeFilename(attachment.fileName),
      downloadName: attachment.originalName,
    });
  } catch (error) {
    return next(error);
  }
};

export const downloadBookingActionDocument = async (req, res, next) => {
  try {
    const filename = safeFilename(req.params.filename);
    const accessFilter = ADMIN_ROLES.has(req.user.role) ? {} : { user: req.user._id };
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      isDeleted: false,
      ...accessFilter,
      "fulfillment.customerAction.documents.url": {
        $regex: `${filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      },
    }).select("fulfillment.customerAction.documents").lean();
    if (!booking) throw new AppError("DOCUMENT_NOT_FOUND", 404);
    const document = booking.fulfillment?.customerAction?.documents?.find((item) =>
      String(item.url || "").endsWith(`/${filename}`),
    );
    return sendPrivateFile({
      res,
      folder: "booking-actions",
      filename,
      downloadName: document?.name,
    });
  } catch (error) {
    return next(error);
  }
};

export const downloadServiceDocument = async (req, res, next) => {
  try {
    const accessFilter = ADMIN_ROLES.has(req.user.role) ? {} : { user: req.user._id };
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      isDeleted: false,
      ...accessFilter,
      "serviceDocuments._id": req.params.documentId,
    }).select("serviceDocuments").lean();
    if (!booking) throw new AppError("DOCUMENT_NOT_FOUND", 404);
    const document = booking.serviceDocuments?.find((item) =>
      String(item._id) === String(req.params.documentId),
    );
    if (!document) throw new AppError("DOCUMENT_NOT_FOUND", 404);
    const filename = safeFilename(document.storageName);
    return sendPrivateFile({
      res,
      folder: "service-documents",
      filename,
      downloadName: document.originalName,
    });
  } catch (error) {
    return next(error);
  }
};

export const downloadLegacyVoucher = async (req, res, next) => {
  try {
    const accessFilter = ADMIN_ROLES.has(req.user.role) ? {} : { user: req.user._id };
    const voucher = await Voucher.findOne({
      _id: req.params.voucherId,
      isDeleted: false,
    }).lean();
    if (!voucher) throw new AppError("DOCUMENT_NOT_FOUND", 404);
    const booking = await Booking.findOne({
      _id: voucher.booking,
      isDeleted: false,
      ...accessFilter,
    }).select("_id").lean();
    if (!booking) throw new AppError("DOCUMENT_NOT_FOUND", 404);
    const filename = safeFilename(path.basename(String(voucher.pdfUrl || "")));
    return sendPrivateFile({
      res,
      folder: "vouchers",
      filename,
      downloadName: `${voucher.voucherNumber}.pdf`,
    });
  } catch (error) {
    return next(error);
  }
};

export const downloadLegacyPrivateFile = async (req, res, next) => {
  try {
    const filename = safeFilename(req.params.filename);
    const folder = String(req.params.folder || "");
    if (!new Set(["draft-bookings", "payment-proofs"]).has(folder)) {
      throw new AppError("DOCUMENT_NOT_FOUND", 404);
    }
    const accessFilter = ADMIN_ROLES.has(req.user.role) ? {} : { user: req.user._id };
    const legacyUrl = `/uploads/${folder}/${filename}`;

    if (folder === "payment-proofs") {
      const transaction = await PaymentTransaction.findOne({
        isDeleted: { $ne: true },
        ...accessFilter,
        $or: [
          { "proofAttachments.publicId": filename },
          { "proofAttachments.url": legacyUrl },
        ],
      }).select("proofAttachments").lean();
      if (!transaction) throw new AppError("DOCUMENT_NOT_FOUND", 404);
    } else {
      const drafts = await DraftBooking.find({
        isDeleted: { $ne: true },
        ...accessFilter,
      }).select("travelers hosts data").lean();
      if (!drafts.some((draft) => JSON.stringify(draft).includes(legacyUrl))) {
        throw new AppError("DOCUMENT_NOT_FOUND", 404);
      }
    }

    return sendPrivateFile({ res, folder, filename });
  } catch (error) {
    return next(error);
  }
};
