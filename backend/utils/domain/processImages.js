import { normalizeArray } from "../generic/normalizeArray.js";

import {
  extractUploadedImages,
  deleteImagesFromDisk,
  updateImageArray,
} from "../imageManager.js";

export const processImages = async ({
  req,
  currentImages = [],
  folder = "uploads",
}) => {

  // الصور الجديدة المرفوعة
  const newImages = extractUploadedImages(
    req,
    folder
  );

  // الصور المطلوب حذفها
  const imagesToDelete =
    normalizeArray(
      req.body["deleteImages[]"]
    );

  // حذف فعلي من السيرفر
  if (imagesToDelete.length > 0) {
    await deleteImagesFromDisk(
      imagesToDelete
    );
  }

  // دمج القديم + الجديد - المحذوف
  const finalImages =
    updateImageArray({
      currentImages,

      imagesToDelete,

      newImages,
    });

  return finalImages;
};