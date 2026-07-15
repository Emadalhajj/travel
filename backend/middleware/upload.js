// backend/middleware/upload.js

import multer from "multer";
import path from "path";
import fs from "fs";

const getUploadConfig = (
  folder,
  allowedExtensions = /\.(jpe?g|png|gif|webp)$/i
) => {
  const uploadDir = `uploads/${folder}`;

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);

      const fileName =
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 9) +
        ext;

      cb(null, fileName);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!allowedExtensions.test(file.originalname)) {
      return cb(new Error("نوع الملف غير مدعوم"));
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });
};

export const uploadHotel = getUploadConfig(
  "hotels",
  /\.(jpe?g|png|gif|webp|pdf|doc|docx)$/i
);


// مرفقات الفندق
export const uploadHotelAttachments = getUploadConfig(
  "hotel-attachments",
  /\.(jpe?g|png|gif|webp|pdf|doc|docx)$/i
);

// باقي الأنواع
export const uploadVisa = getUploadConfig("visa");
export const uploadRoomType = getUploadConfig("room-types");
export const uploadTransport = getUploadConfig("transport");
export const uploadTour = getUploadConfig("tours");
export const uploadUserProfile = getUploadConfig("users");

