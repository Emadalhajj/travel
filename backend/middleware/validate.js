// backend/middleware/validate.js
import asyncHandler from "./asyncHandler.js"; // تأكد من وجود هذا الملف
import { isArabicRequest } from "../utils/getRequestLanguage.js";
import { translateJoiError } from "../utils/validation/translateJoiError.js";

export const validate = (schemaFactory) =>
  asyncHandler(async (req, res, next) => {
    const isArabic = isArabicRequest(req);

    const joiSchema =
      typeof schemaFactory === "function"
        ? schemaFactory({
            req,
            lang: isArabic ? "ar" : "en",
            isArabic,
          })
        : schemaFactory;

    if (!joiSchema?.validate) {
      return res.status(500).json({
        message: "Invalid validation schema",
      });
    }

    const { error, value } = joiSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const translatedErrors = error.details.map((detail) =>
        translateJoiError(detail, isArabic ? "ar" : "en"),
      );

      return res.status(400).json({
        success: false,
        message: translatedErrors[0].message,
        errors: translatedErrors.reduce((acc, item) => {
          acc[item.field] = item.message;
          return acc;
        }, {}),
      });
    }

    req.body = value;

    next();
  });

// export const validate = (schemaOrFactory) =>
//   asyncHandler(async (req, res, next) => {
//     console.log("validate middleware triggered");

//      const joiSchema =
//       typeof schemaOrFactory === "function"
//         ? schemaOrFactory(req)
//         : schemaOrFactory;

//    if (!joiSchema || typeof joiSchema.validate !== "function") {
//       return res.status(500).json({ message: "Invalid validation schema" });
//     }

//     try {
//       const { error, value } = await joiSchema.validate(req.body, {
//         abortEarly: false,
//         stripUnknown: true,
//       });

//       if (error) {
//         const message = error.details.map((d) => d.message).join(", ");
//         const errors = error.details.reduce((acc, item) => {
//           acc[item.path.join(".")] = item.message;
//           return acc;
//         }, {});

//         return res.status(400).json({
//           message,
//           errors,
//         });
//       }

//       // if (error) {
//       //   const message = error.details.map((d) => d.message).join(", ");
//       //   return res.status(400).json({ message });
//       // }

//       // مهم جدًا: تحديث req.body بالقيم النظيفة
//       req.body = value;

//       next();
//     } catch (err) {
//       console.error("Validation error:", err);
//       return res.status(500).json({ message: "خطأ في التحقق من البيانات" });
//     }
//   });
