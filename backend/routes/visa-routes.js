// backend/routes/visa-routes.js
import express from "express";
import { createVisaSchema, updateVisaSchema } from "../services/validators/newVisa-Validation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  getAllVisas,
  createVisa,
  updateVisa,
  deleteVisa,
  getVisaById,
  toggleVisaStatus,
} from "../controllers/visa-controller.js";
import { uploadVisa } from "../middleware/upload.js";

import asyncHandler from "../middleware/asyncHandler.js";
import parseFormData from "../middleware/parseFormData.js"





const uploadAndParse = [
  uploadVisa.fields([
    { name: "images", maxCount: 10 },   // ← صور متعددة، اسم الحقل "images"
  ]),
  parseFormData({
    imagesField: "images",
    uploadPath: "/uploads/visa"
  })
];

// const uploadAndParse = [uploadVisas, parseFormData];

const visaRouter = express.Router();

// إنشاء
visaRouter.post(
  "/",
  protect,
  authorize("admin", "superAdmin"),
 ...uploadAndParse,
  validate(createVisaSchema),
  createVisa
);

// تحديث
visaRouter.put(
  "/:id",
  protect,
  authorize("admin", "superAdmin"),
 ...uploadAndParse,
  validate(updateVisaSchema),
  updateVisa
);





// تبديل حالة التأشيرة
visaRouter.patch(
  "/:id/toggle",
  protect,
  authorize("admin", "superAdmin"),
  toggleVisaStatus

)

// باقي المسارات
visaRouter.get("/", getAllVisas);
visaRouter.get("/admin", protect, authorize("admin", "superAdmin"), getAllVisas);
visaRouter.get("/:id", getVisaById);
visaRouter.delete("/:id", protect, authorize("admin", "superAdmin"), deleteVisa);



export default visaRouter;
