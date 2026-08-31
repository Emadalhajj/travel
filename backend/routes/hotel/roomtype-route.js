import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";

import { validate } from "../../middleware/validate.js";
import {
  createRoomTypeSchema,
  updateRoomTypeSchema,
} from "../../services/validators/roomType-validation.js";

import {
  createRoomType,
  updateRoomType,
  getAllRoomType,
  getRoomTypeById,
  deleteRoomType,
  getRoomTypesByHotelId,
  toggleRoomTypeStatus,
  previewBookingPrice

} from "../../controllers/hotels/roomType-controller.js";
// import { uploadRoomType } from "../../middleware/upload.js";
import {
  uploadRoomType,
  // uploadHotelAttachments,
} from "../../middleware/upload/index.js";

import asyncHandler from "../../middleware/asyncHandler.js";
import parseFormData  from "../../middleware/parseFormData.js";

const RoomTypeRoute = express.Router();


const roomTypeUploadMiddleware  = [
  uploadRoomType.fields([
    { name: "images", maxCount: 10 }, // ← صور متعددة، اسم الحقل "images"
  ]),
  parseFormData({
    imagesField: "images",
    uploadPath: "/uploads/room-types"
  }) // نفس الدالة المعدّلة التي أرسلتها لك سابقًا
];

// Public routes
RoomTypeRoute.get("/room-types", getAllRoomType);
RoomTypeRoute.get("/room-types/:id", getRoomTypeById);
RoomTypeRoute.get("/hotel/:hotelId/room-types", getRoomTypesByHotelId);

// Protected routes التوجه المحمي
RoomTypeRoute.post(
  "/room-types",
  protect,
  authorize("admin", "superAdmin"),
  ...roomTypeUploadMiddleware ,
  validate(createRoomTypeSchema), 
  createRoomType
);

RoomTypeRoute.post('/preview-price',
  previewBookingPrice
)

RoomTypeRoute.put(
  "/room-types/:id",
  protect,
  authorize("admin", "superAdmin"),
  ...roomTypeUploadMiddleware ,
  // parseRoomTypeData,
  validate(updateRoomTypeSchema),
  updateRoomType
);

RoomTypeRoute.delete(
  "/room-types/:id",
  protect,
  authorize("admin", "superAdmin"),
  deleteRoomType
);
RoomTypeRoute.patch(
  "/room-types/toggle/:id" ,
  protect,
  authorize("admin", "superAdmin"),
  toggleRoomTypeStatus
)



export default RoomTypeRoute;
