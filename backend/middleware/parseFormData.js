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
    } catch {
      res.status(400).json({ message: "بيانات غير صالحة" });
    }
  });

export default parseFormData;
