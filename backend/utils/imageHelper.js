// utils/imageHelper.js
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

/**
 * تحويل ملفات multer (diskStorage) إلى كائنات صور
 * @param {Array} files - ملفات من multer.diskStorage
 * @param {String} folder - اسم المجلد
 * @param {Object} options - خيارات إضافية
 * @returns {Array} - مصفوفة من كائنات الصور
 */
export const formatUploadedImages = (files, folder, options = {}) => {
  if (!files || files.length === 0) return [];

  const {
    includeAlt = true,
    includeIsMain = true,
    setFirstAsMain = true,
  } = options;

  return files.map((file, index) => {
    const imageObj = {
      url: `/uploads/${folder}/${file.filename}`,
    };

    if (includeAlt) {
      imageObj.alt = file.originalname.replace(path.extname(file.originalname), "");
    }

    if (includeIsMain) {
      imageObj.isMain = setFirstAsMain && index === 0;
    }

    return imageObj;
  });
};

/**
 * حذف الصور من النظام
 * @param {Array|String} imagePaths - مسارات الصور للحذف
 * @returns {Promise<void>}
 */
export const deleteImages = async (imagePaths) => {
  if (!imagePaths) return;

  const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];

  for (const imgPath of paths) {
    try {
      const cleanPath = imgPath.startsWith("/") ? imgPath.substring(1) : imgPath;
      const fullPath = path.join(process.cwd(), cleanPath);

      if (fsSync.existsSync(fullPath)) {
        await fs.unlink(fullPath);
      }
    } catch {}
  }
};

/**
 * حذف صورة واحدة
 * @param {String} imagePath - مسار الصورة
 * @returns {Promise<Boolean>}
 */
export const deleteImage = async (imagePath) => {
  if (!imagePath) return false;

  try {
    const cleanPath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
    const fullPath = path.join(process.cwd(), cleanPath);

    if (fsSync.existsSync(fullPath)) {
      await fs.unlink(fullPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * تحديث الصور (دمج القديمة والجديدة)
 * @param {Array} oldImages - الصور القديمة
 * @param {Array} deletedPaths - مسارات الصور المحذوفة
 * @param {Array} newFiles - ملفات جديدة من multer
 * @param {String} folder - مجلد الحفظ
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<Array>} - الصور النهائية
 */
export const updateImages = async (
  oldImages = [],
  deletedPaths = [],
  newFiles = [],
  folder = "general",
  options = {}
) => {
  // 1. حذف الصور المحددة
  if (deletedPaths && deletedPaths.length > 0) {
    await deleteImages(deletedPaths);
  }

  // 2. تصفية الصور القديمة (إزالة المحذوفة)
  const remainingImages = oldImages.filter(
    (img) => !deletedPaths.includes(img.url)
  );

  // 3. تنسيق الصور الجديدة
  const newFormattedImages = formatUploadedImages(newFiles, folder, {
    ...options,
    setFirstAsMain: remainingImages.length === 0,
  });

  // 4. دمج الصور
  const allImages = [...remainingImages, ...newFormattedImages];

  // 5. التأكد من وجود صورة رئيسية
  if (allImages.length > 0 && !allImages.some((img) => img.isMain)) {
    allImages[0].isMain = true;
  }

  return allImages;
};

/**
 * استخراج مسارات الصور من كائنات الصور
 * @param {Array} images - مصفوفة من كائنات الصور
 * @returns {Array} - مصفوفة من المسارات فقط
 */
export const extractImagePaths = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map((img) => (typeof img === "string" ? img : img.url)).filter(Boolean);
};

/**
 * التحقق من وجود صورة رئيسية وتعيينها إذا لزم الأمر
 * @param {Array} images - مصفوفة الصور
 * @returns {Array} - الصور مع التأكد من وجود صورة رئيسية
 */
export const ensureMainImage = (images) => {
  if (!images || images.length === 0) return [];

  const hasMain = images.some((img) => img.isMain === true);

  if (!hasMain) {
    images[0].isMain = true;
  }

  return images;
};

/**
 * حذف جميع الصور في مجلد معين
 * @param {String} folder - اسم المجلد
 * @param {Number} olderThanDays - حذف الملفات الأقدم من عدد الأيام
 * @returns {Promise<Number>} - عدد الملفات المحذوفة
 */
export const cleanupFolder = async (folder, olderThanDays = null) => {
  try {
    const folderPath = path.join(process.cwd(), "uploads", folder);

    if (!fsSync.existsSync(folderPath)) {
      return 0;
    }

    const files = await fs.readdir(folderPath);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);

      if (olderThanDays) {
        const fileAge = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        if (fileAge > olderThanDays) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      } else {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch {
    return 0;
  }
};
