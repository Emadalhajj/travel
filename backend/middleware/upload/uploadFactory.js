/*
هذا الملف مسؤول فقط عن إنشاء uploader ديناميكي:
- يمكنك إنشاء uploader لكل نوع من الملفات (صور الفنادق، صور أنواع الغرف، إلخ) باستخدام هذا المصنع.
- كل uploader يتم تكوينه بناءً على المتطلبات المحددة (المجلد، أنواع الملفات المسموح بها، الحد الأقصى لحجم الملف).
- هذا يجعل الكود أكثر نظافة وقابلية لإعادة الاستخدام في جميع أنحاء التطبيق.
*/

import multer from "multer";
import path from "path";
import fs from "fs";
import { isArabicRequest } from "../../utils/getRequestLanguage.js";

export const createUploader = ({
  folder,
  fieldRules = {},
  maxSizeMB = 10,
  storageRoot = "uploads",
}) => {
  const uploadDir = `${storageRoot}/${folder}`;
  

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
      recursive: true,
    });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();

      cb(
        null,
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}${ext}`
      );
    },
  });

  const fileFilter = (req, file, cb) => {
    const isArabic = isArabicRequest(req);
    const rules = fieldRules[file.fieldname];

    // لو الحقل غير معرف
    if (!rules) {
      return cb(
        new Error(isArabic ? "نوع الحقل غير معروف" : "Unknown upload field"),
      );
    }

    if (rules.extensions && !rules.extensions.test(file.originalname)) {
      return cb(
        new Error(
          isArabic ? "صيغة الملف غير مدعومة" : "Unsupported file format",
        ),
      );
    }

    if (Array.isArray(rules.mimeTypes) && !rules.mimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(isArabic ? "نوع الملف غير مسموح" : "Unsupported file type"),
      );
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};
