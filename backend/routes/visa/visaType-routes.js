import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import { validate } from "../../middleware/validate.js";
import {
  createVisaTypeSchema,
  updateVisaTypeSchema,
} from "../../services/validators/visaType-validation.js";

import {
  getAllVisaTypes,
  createVisaType,
  updateVisaType,
  deleteVisaType,
} from "../../controllers/visaType-controller.js";
const router = express.Router();

router.get("/visa-types", getAllVisaTypes);

router.post(
  "/visa-types",
  protect,
  authorize("admin"),
  validate(createVisaTypeSchema),
  createVisaType,
);

router.put(
  "/visa-types/:id",
  protect,
  authorize("admin"),
  validate(updateVisaTypeSchema),
  updateVisaType,
);

router.delete("/visa-types/:id", protect, authorize("admin"), deleteVisaType);

export default router;
