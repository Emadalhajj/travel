import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";
import { USER_ROLES } from "../../constants/auth/roles.js";
import {
  getBookingOperationsDetails,
  listBookingOperations,
  updateBookingFulfillment,
  uploadBookingServiceDocuments,
  redeliverBookingServiceDocuments,
} from "../../controllers/operations/booking-operations-controller.js";
import { uploadBookingServiceDocuments as uploadServiceDocumentsMiddleware } from "../../middleware/upload/index.js";
import { uploadRateLimiter } from "../../middleware/security/rate-limiters.js";

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

bookingOperationsRoute.patch(
  "/operations/bookings/:bookingId/fulfillment",
  protect,
  authorize(OPERATIONS_READ_ROLES),
  updateBookingFulfillment,
);

bookingOperationsRoute.post(
  "/operations/bookings/:bookingId/service-documents",
  protect,
  authorize(OPERATIONS_READ_ROLES),
  uploadRateLimiter,
  uploadServiceDocumentsMiddleware.array("documents", 5),
  uploadBookingServiceDocuments,
);

bookingOperationsRoute.post(
  "/operations/bookings/:bookingId/service-documents/deliver",
  protect,
  authorize(OPERATIONS_READ_ROLES),
  redeliverBookingServiceDocuments,
);

bookingOperationsRoute.get(
  "/operations/bookings/:bookingId",
  protect,
  authorize(OPERATIONS_READ_ROLES),
  getBookingOperationsDetails,
);

export default bookingOperationsRoute;
