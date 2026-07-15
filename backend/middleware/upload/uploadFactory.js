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

export const createUploader = ({ folder, fieldRules = {} }) => {
  const uploadDir = `uploads/${folder}`;
  

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
      const ext = path.extname(
        file.originalname
      );

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

    // لو الامتداد غير مسموح
    if (!rules.test(file.originalname)) {
      return cb(
        new Error(
          file.fieldname === "images"
            ? isArabic
              ? "صيغة الصورة غير مدعومة"
              : "Unsupported image format"
            : isArabic
              ? "صيغة الملف غير مدعومة"
              : "Unsupported file format",
        ),
      );
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
  });
};
