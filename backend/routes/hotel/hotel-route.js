import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import { validate } from "../../middleware/validate.js";

import {
  createHotelSchema,
  updateHotelSchema,
} from "../../services/validators/hotel-validation.js";

import {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  toggleHotelStatus,
} from "../../controllers/hotels/hotel-controller.js";
// import { uploadHotel } from "../../middleware/upload.js";
import { uploadHotel } from "../../middleware/upload/index.js";

import parseFormData from "../../middleware/parseFormData.js";

const uploadAndParse = [
  uploadHotel.fields([
    { name: "images", maxCount: 4 }, // ← صور متعددة، اسم الحقل "images"
    { name: "attachments", maxCount: 5 }, // ← ملفات أخرى متعددة، اسم الحقل "attachments"
  ]),

  parseFormData({
    imagesField: "images",
    attachmentsField: "attachments",
    uploadPath: "/uploads/hotels", // نفس الدالة المعدّلة التي أرسلتها لك سابقًا
  }),
];

const HotelsRoute = express.Router();

//public routes
HotelsRoute.get("/hotels", getAllHotels);
HotelsRoute.get("/hotel/:id", getHotelById);

// Protected routes التوجه المحمي
HotelsRoute.post(
  "/hotel",
  protect,
  authorize("admin"),
  ...uploadAndParse,
  validate(({ lang }) => createHotelSchema(lang)),
  createHotel,
);

HotelsRoute.put(
  "/hotel/:id",
  protect,
  authorize("admin"),
  ...uploadAndParse,
  validate(({ lang }) => updateHotelSchema(lang)),
  updateHotel,
);

HotelsRoute.delete("/hotel/:id", protect, authorize("admin"), deleteHotel);

HotelsRoute.patch(
  "/hotel/toggle/:id",
  protect,
  authorize("admin"),
  toggleHotelStatus,
);

export default HotelsRoute;
