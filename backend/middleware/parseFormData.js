// backend/middleware/parseFormData.js
import asyncHandler from "express-async-handler";

const parseFormData = (options = {}) =>
  asyncHandler(async (req, res, next) => {
    try {
      const {
        imagesField = "images",
        attachmentsField = "attachments",
        uploadPath = "",
        allowImages = true,
      } = options;

      // 1️⃣ Parse JSON الموجود في data
      if (req.body?.data) {
        try {
          const parsed = JSON.parse(req.body.data);
          req.body = { ...req.body, ...parsed };
        } catch (e) {
          return res.status(400).json({ message: "JSON غير صالح" });
        }
      }

      // 2️⃣ معالجة الصور (بأمان)
      if (allowImages && req.files?.[imagesField]) {
        req.body.newImages = req.files[imagesField].map((file) => ({
          url: `/uploads/hotels/${file.filename}`,
          alt: "",
          isMain: false,
        }));
      } else {
        req.body.newImages = [];
      }
      // 3️⃣ معالجة الملفات المرفقة
      if (req.files?.[attachmentsField]) {
        req.body.newAttachments = req.files[attachmentsField].map((file) => ({
          fileName: file.filename,
          url: `/uploads/hotels/${file.filename}`,
          originalName: file.originalname,
        }));
      }

      // 3️⃣ الصور المحذوفة
      const deleted = req.body["deleteImages[]"] || req.body.deleteImages || [];

      req.body.deleteImages = Array.isArray(deleted) ? deleted : [deleted];

      // 4️⃣ تحويل الحقول المركبة المرسلة كنص JSON إلى كائنات
      const complexFields = ["capacity", "pricing", "amenities"];
      complexFields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch (e) {
            // إذا فشل التحويل نترك القيمة كما هي (ستتعامل Joi معه لاحقًا)
          }
        }
      });

      // 5️⃣ ضمان أن pricing.pricingPeriods مصفوفة (تجنّب خطأ Joi عندما يكون نصًا فارغًا)
      if (req.body.pricing) {
        try {
          if (typeof req.body.pricing === "string") {
            req.body.pricing = JSON.parse(req.body.pricing);
          }
        } catch (e) {
          // ignore
        }

        if (!Array.isArray(req.body.pricing.pricingPeriods)) {
          if (
            !req.body.pricing.pricingPeriods ||
            req.body.pricing.pricingPeriods === ""
          ) {
            req.body.pricing.pricingPeriods = [];
          } else if (typeof req.body.pricing.pricingPeriods === "string") {
            try {
              req.body.pricing.pricingPeriods = JSON.parse(
                req.body.pricing.pricingPeriods,
              );
            } catch (e) {
              req.body.pricing.pricingPeriods = [];
            }
          } else {
            req.body.pricing.pricingPeriods = [];
          }
        }
      }

      next();
    } catch (err) {
      console.error("Parse Error:", err);
      res.status(400).json({ message: "بيانات غير صالحة" });
    }
  });

export default parseFormData;

// // middleware/parseFormData.js
// import asyncHandler from "express-async-handler";

// /**
//  * معالج عام لـ FormData مع الصور
//  * @param {String} folder - اسم المجلد (room-types, visa, hotels)
//  */
// export const createFormDataParser = (folder) => {
//   return asyncHandler(async (req, res, next) => {
//     try {
//       // 1. تحليل الـ JSON من حقل "data" إن وجد
//       if (req.body.data) {
//         try {
//           const parsed = JSON.parse(req.body.data);
//           req.body = { ...req.body, ...parsed };
//           delete req.body.data; // حذف الحقل الأصلي
//         } catch (e) {
//           console.error("Invalid JSON in req.body.data:", e);
//           return res.status(400).json({
//             success: false,
//             message: "بيانات JSON غير صالحة",
//           });
//         }
//       }

//       // 2. معالجة الصور الجديدة (متعددة)
//       // multer يمكن أن يعيد req.files كمصفوفة (upload.array)
//       // أو كائن حقول { images: [...] } عند استخدام upload.fields
//       console.log("parseFormData: incoming req.files:", req.files);
//       const filesArray = Array.isArray(req.files)
//         ? req.files
//         : req.files && Array.isArray(req.files.images)
//         ? req.files.images
//         : [];

//       if (filesArray.length > 0) {
//         req.body.newImages = filesArray.map((file) => ({
//           url: `/uploads/${folder}/${file.filename}`,
//           alt: file.originalname.replace(/\.[^/.]+$/, ""),
//         }));
//       } else {
//         req.body.newImages = []; // مهم: لو مفيش صور
//       }
//       console.log("parseFormData: newImages count=", req.body.newImages.length);

//       // 3. معالجة الصور المحذوفة
//       if (req.body.deletedOldImages) {
//         try {
//           req.body.deletedOldImages =
//             typeof req.body.deletedOldImages === "string"
//               ? JSON.parse(req.body.deletedOldImages)
//               : req.body.deletedOldImages;
//         } catch (e) {
//           req.body.deletedOldImages = [];
//         }
//       } else if (req.body["deleteImages[]"]) {
//         // دعم الصيغة القديمة
//         const deleted = Array.isArray(req.body["deleteImages[]"])
//           ? req.body["deleteImages[]"]
//           : req.body["deleteImages[]"]
//           ? [req.body["deleteImages[]"]]
//           : [];
//         req.body.deletedOldImages = deleted;
//         delete req.body["deleteImages[]"];
//       }

//       // 4. تحليل الحقول المعقدة (capacity, pricing, amenities)
//       const complexFields = ["capacity", "pricing", "amenities"];
//       complexFields.forEach((field) => {
//         if (req.body[field] && typeof req.body[field] === "string") {
//           try {
//             req.body[field] = JSON.parse(req.body[field]);
//           } catch (e) {
//             console.warn(`Failed to parse ${field}:`, e);
//           }
//         }
//       });

//       // 5. تحويل الأرقام
//       const numberFields = ["size", "totalRooms"];
//       numberFields.forEach((field) => {
//         if (req.body[field]) {
//           req.body[field] = Number(req.body[field]);
//         }
//       });

//       // 6. تحويل القيم المنطقية
//       if (req.body.isActive !== undefined) {
//         req.body.isActive =
//           req.body.isActive === "true" ||
//           req.body.isActive === true ||
//           req.body.isActive === 1;
//       }

//       next();
//     } catch (err) {
//       console.error("Parse FormData Error:", err);
//       return res.status(400).json({
//         success: false,
//         message: "خطأ في معالجة البيانات",
//         error: err.message,
//       });
//     }
//   });
// };

// // معالجات جاهزة لكل نوع
// export const parseRoomTypeData = createFormDataParser("room-types");
// export const parseVisaData = createFormDataParser("visa");
// export const parseHotelData = createFormDataParser("hotels");
// export const parseTourData = createFormDataParser("tours");
