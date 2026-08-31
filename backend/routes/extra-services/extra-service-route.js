import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";
import { validate } from "../../middleware/validate.js";
import {
    createExtraServiceSchema ,
    updateExtraServiceSchema
} from "../../services/validators/extraService-validation.js"
import {
  getAllExtraServices,
  getOneExtraService,
  createExtraService,
  updateExtraService,
  deleteExtraService,
  toggleExtraServiceStatus,
} from "../../controllers/extra-services/extra-service-controller.js";

import { uploadExtraService } from "../../middleware/upload/uploadPresets.js";
import asyncHandler from "../../middleware/asyncHandler.js";
import parseFormData from "../../middleware/parseFormData.js";

const ExtraService = express.Router();

const extraServiceUploadMiddleware = [
  uploadExtraService.fields([{ name: "images", maxCount: 10 }]),
  parseFormData({
    imagesField: "images",
    uploadPath: "/uploads/extra-service",
  }),
];

// Public routes
ExtraService.get("/" , getAllExtraServices)
ExtraService.get("/:id" , getOneExtraService)

// protected routes
ExtraService.post(
    "/" ,
    protect ,
    authorize("admin", "superAdmin") ,
    ...extraServiceUploadMiddleware,
    validate(createExtraServiceSchema),
    createExtraService
)

ExtraService.put(
    "/:id",
    protect,
    authorize("admin", "superAdmin"),
    ...extraServiceUploadMiddleware,
    validate(updateExtraServiceSchema),
    updateExtraService
)

ExtraService.delete(
    "/:id",
    protect,
    authorize("admin", "superAdmin"),
    deleteExtraService
)

ExtraService.patch(
    "/toggle/:id",
    protect ,
    authorize("admin", "superAdmin"),
    toggleExtraServiceStatus
)

export default ExtraService
