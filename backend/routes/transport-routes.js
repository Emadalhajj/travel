import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  createTransportSchema,
  updateTransportSchema,
} from "../services/validators/transport-validation.js";
import {
  getAllTransports,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport,
  toggleTransportStatus,
} from "../controllers/transport-controller.js";
  
import parseFormData from "../middleware/parseFormData.js";
import { uploadTransport } from "../middleware/upload.js";

const uploadAndParse = [
  uploadTransport.fields([
    { name: "images", maxCount: 10 }, // ← صور متعددة، اسم الحقل "images"
  ]),
  parseFormData({
    imagesField: "images",
    uploadPath: "/uploads/transport", // نفس الدالة المعدّلة التي أرسلتها لك سابقًا
  }),
];

const TransportRoutes = express.Router()
// public routes

TransportRoutes.get("/" , getAllTransports)

TransportRoutes.get("/:id" , getTransportById)

// protected routes
TransportRoutes.post(
    "/",
    protect,
    authorize("admin", "superAdmin"),
    ...uploadAndParse,
    validate(createTransportSchema),
    createTransport

)
TransportRoutes.put(
    "/:id",
    protect,
    authorize("admin", "superAdmin"),
    ...uploadAndParse,
    validate(updateTransportSchema),
    updateTransport
)

TransportRoutes.delete(
    "/:id",
    protect,
    authorize("admin", "superAdmin"),
    deleteTransport
)
TransportRoutes.patch(
    "/toggle/:id",
    protect,
    authorize("admin", "superAdmin"),
    toggleTransportStatus
)
export default TransportRoutes
