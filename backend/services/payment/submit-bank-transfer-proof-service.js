/*
=============================================================================
Submit Bank Transfer Proof Service
=============================================================================

مسؤول عن تجهيز الملفات المرفوعة فقط، ثم تفويض حفظ
الإثبات وتحديث الحالة إلى PaymentTransaction Layer.

مهم:
-----------------------------------------------------------------------------
لا يتعامل هذا الملف مباشرة مع MongoDB.
=============================================================================
*/

import {
  attachBankTransferProofService,
} from "./paymentTransaction-service.js";

import {
  markDraftPendingPaymentReviewService,
} from "../draft-bookings/draft-booking-service.js";
import { sendBankTransferSubmittedNotification } from "../notifications/payment-notification-service.js";

/*
=============================================================================
Normalize Uploaded Attachments
=============================================================================

يتم الحفاظ على شكل المرفقات المستخدم داخل
PaymentTransaction Model الحالي.
=============================================================================
*/

const normalizeUploadedFiles = (
  files = [],
  transactionId,
) =>
  files.map((file) => ({
    name:
      file.originalname ||
      file.name ||
      "",

    url: `/api/private-files/payment-proofs/${transactionId}/${file.filename}`,

    publicId:
      file.filename ||
      file.publicId ||
      "",

    mimeType:
      file.mimetype ||
      file.mimeType ||
      "",

    size:
      Number(file.size) || 0,
  }));

export const submitBankTransferProofService =
  async ({
    transactionId,
    transferReference,
    uploadedFiles = [],
    userId = null,
    req = null,
  }) => {
    const proofAttachments =
      normalizeUploadedFiles(
        uploadedFiles,
        transactionId,
      );

    const transaction =
      await attachBankTransferProofService({
        transactionId,
        transferReference,
        proofAttachments,
        submittedBy: userId,
      });

    if (transaction.draftBooking) {
      await markDraftPendingPaymentReviewService({
        draftId: transaction.draftBooking,
      });
    }

    await sendBankTransferSubmittedNotification({ transaction, req });

    return {
      transactionId:
        transaction._id,

      status: String(
        transaction.status || "",
      ).toUpperCase(),

      submittedAt:
        transaction.transferDate,

      message:
        "تم إرسال إثبات التحويل للمراجعة",
    };
  };
