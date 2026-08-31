import asyncHandler from "express-async-handler";
import Hotel from "../models/hotels/hotel-model.js";

import fs from "fs"; // للتعامل مع نظام الملفات
import path from "path"; // للتعامل مع مسارات الملفات
import { ROOT_PATH } from "./path.js"; // المسار الجذر للمشروع

/**
 * استخراج الصور المرفوعة من req.files
 * @returns Array<string>
 */
export const extractUploadedImages = (req, folder) => {
  if (!req.files || !req.files.images || !req.files.images.length) {
    return [];
  }

  return req.files.images.map((file) => `/uploads/${folder}/${file.filename}`);
};

/**
 * توحيد مسار الصورة
 * يدعم:
 *  - /uploads/...
 *  - http://domain/uploads/...
 */
export const normalizeImagePath = (imgPath) => {
  if (!imgPath || typeof imgPath !== "string") return null;

  const idx = imgPath.indexOf("/uploads/"); // البحث عن الجزء الذي يبدأ بمسار التحميلات
  return idx !== -1 ? imgPath.substring(idx) : null;
};

/**
 * حذف صورة واحدة من السيرفر
 */
export const deleteImageFromDisk = async (imgPath) => {
  const normalized = normalizeImagePath(imgPath);
  if (!normalized) return;

  const fullPath = path.join(ROOT_PATH, normalized); // بناء المسار الكامل للملف على السيرفر
  // التحقق من وجود الملف قبل محاولة حذفه
  if (!fs.existsSync(fullPath)) {
    return;
  }

  try {
    // fs.unlinkSync(fullPath);
    await fs.promises.unlink(fullPath); // حذف الملف بشكل غير متزامن
  } catch {
    return;
  }
};
/**
 * حذف عدة صور
 */
export const deleteImagesFromDisk = async (images = []) => {
  if (!Array.isArray(images)) return;
  await Promise.all(
    images.map((img) => deleteImageFromDisk(img)), //
  );
};

export const deleteAttachmentsFromDisk = async (attachments = []) => {
  if (!Array.isArray(attachments)) return;

  await Promise.all(
    attachments.map(
      (attachent) =>
        attachent?.url
          ? deleteImageFromDisk(attachent.url)
          : typeof attachent === "string"
            ? deleteImageFromDisk(attachent)
          : null // إذا لم يكن هناك URL، نتجاهل هذا المرفق
    ),
  );
};



/**
 * تحديث Array الصور (String-based)
 */
export const updateImageArray = ({
  currentImages = [],
  imagesToDelete = [],
  newImages = [],
}) => {
  if (!Array.isArray(currentImages)) currentImages = [];

  const normalizedDelete = imagesToDelete
    .map(normalizeImagePath)
    .filter(Boolean);

  const filteredImages = currentImages.filter(
    (img) => !normalizedDelete.includes(normalizeImagePath(img)),
  );

  return [...filteredImages, ...newImages];
};
