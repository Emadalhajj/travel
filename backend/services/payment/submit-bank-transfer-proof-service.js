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
) =>
  files.map((file) => ({
    name:
      file.originalname ||
      file.name ||
      "",

    url:
      file.path ||
      file.url ||
      "",

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
  }) => {
    const proofAttachments =
      normalizeUploadedFiles(
        uploadedFiles,
      );

    const transaction =
      await attachBankTransferProofService({
        transactionId,
        transferReference,
        proofAttachments,
        submittedBy: userId,
      });

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
