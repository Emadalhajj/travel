import express from 'express'
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
    createTripSchema , 
    updateTripSchema
} from '../services/validators/trip-validation.js'

import {
    getAllTrips ,
    getTripById ,
    createTrip ,
    updateTrip ,
    deleteTrip ,
    toggleTripStatus
} from '../controllers/trip-controller.js'

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
const tripRoutes = express.Router()
// public reoutes

tripRoutes.get("/" , getAllTrips)
tripRoutes.get("/:id" , getTripById)

//proteced routes
tripRoutes.post(
    "/",
    protect,
    authorize("admin") ,
    ...uploadAndParse,
    validate(createTripSchema),
    createTrip
)

tripRoutes.patch(
    "/:id",
    protect,
     authorize("admin") ,
    ...uploadAndParse,
    validate(updateTripSchema),
    updateTrip
)

tripRoutes.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteTrip
)

tripRoutes.patch(
    "/toggle/:id" ,
    protect ,
    authorize("admin"),
    toggleTripStatus

)

export default tripRoutes