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

const RoomTypeRout = express.Router();


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
RoomTypeRout.get("/room-types", getAllRoomType);
RoomTypeRout.get("/room-types/:id", getRoomTypeById);
RoomTypeRout.get("/hotel/:hotelId/room-types", getRoomTypesByHotelId);

// Protected routes التوجه المحمي
RoomTypeRout.post(
  "/room-types",
  protect,
  authorize("admin"),
  ...roomTypeUploadMiddleware ,
  validate(createRoomTypeSchema), 
  createRoomType
);

RoomTypeRout.post('/preview-price',
  previewBookingPrice
)

RoomTypeRout.put(
  "/room-types/:id",
  protect,
  authorize("admin"),
  ...roomTypeUploadMiddleware ,
  // parseRoomTypeData,
  validate(updateRoomTypeSchema),
  updateRoomType
);

RoomTypeRout.delete(
  "/room-types/:id",
  protect,
  authorize("admin"),
  deleteRoomType
);
RoomTypeRout.patch(
  "/room-types/toggle/:id" ,
  protect,
  authorize("admin"),
  toggleRoomTypeStatus
)



export default RoomTypeRout;
