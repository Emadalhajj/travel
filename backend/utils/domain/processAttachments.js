/*
هذه الدالة تساعد في معالجة المرفقات (الملفات) التي يتم رفعها من خلال الطلب. تقوم بتحديد الملفات التي يجب الاحتفاظ بها، والملفات الجديدة التي تم رفعها، والملفات التي يجب حذفها من القرص.
تأخذ الدالة ثلاثة معطيات:
- req: كائن الطلب الذي يحتوي على البيانات والملفات المرفقة.
- currentAttachments: قائمة بالملفات الحالية المرتبطة بالكيان (مثل فندق أو منتج).
- folder: اسم المجلد الذي سيتم حفظ الملفات الجديدة فيه (افتراضيًا "uploads").
*/
import { normalizeArray } from "../generic/normalizeArray.js";

import { deleteAttachmentsFromDisk } from "../imageManager.js";

export const processAttachments = async (
  req,
  currentAttachments = [],
  folder = "uploads"
) => {

  // الملفات المطلوب حذفها
  const attachmentsToDelete =
    normalizeArray(
      req.body[
        "deleteAttachments[]"
      ]
    );

  // الملفات المطلوب الاحتفاظ بها من الفرونت
  const keptAttachmentsIds =
    normalizeArray(
      req.body.attachments
    ).map((item) =>
      typeof item === "string"
        ? item
        : item?.url
    ).filter(Boolean);

  // الاحتفاظ فقط بالمطلوب من الموجود
  const keptAttachments =
    keptAttachmentsIds.length > 0
      ? currentAttachments.filter(
          (item) =>
            keptAttachmentsIds.includes(
              item.url
            )
        )
      : currentAttachments;

  const filteredKeptAttachments =
    keptAttachments.filter(
      (item) =>
        !attachmentsToDelete.includes(
          item?.url || item
        )
    );

  // الملفات الجديدة
  let newAttachments = [];

  if (
    req.files?.attachments
  ) {
    newAttachments =
      req.files.attachments.map(
        (file) => ({
          fileName:
            file.filename,

          url:
            `/uploads/${folder}/${file.filename}`,

          originalName:
            file.originalname,

          uploadedAt:
            new Date(),
        })
      );
  }

  if (
    attachmentsToDelete.length > 0
  ) {
    await deleteAttachmentsFromDisk(
      attachmentsToDelete
    );
  }

  return [
    ...filteredKeptAttachments,

    ...newAttachments,
  ];
};
