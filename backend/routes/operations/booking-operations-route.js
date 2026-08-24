import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";
import { USER_ROLES } from "../../constants/auth/roles.js";
import {
  getBookingOperationsDetails,
  listBookingOperations,
} from "../../controllers/operations/booking-operations-controller.js";

const bookingOperationsRoute = express.Router();
export const OPERATIONS_READ_ROLES = Object.freeze([
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
]);

bookingOperationsRoute.get(
  "/operations/bookings",
  protect,
  authorize(OPERATIONS_READ_ROLES),
  listBookingOperations,
);

bookingOperationsRoute.get(
  "/operations/bookings/:bookingId",
  protect,
  authorize(OPERATIONS_READ_ROLES),
  getBookingOperationsDetails,
);

export default bookingOperationsRoute;
