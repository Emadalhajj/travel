import asyncHandler from "../../middleware/asyncHandler.js";
import {
  getBookingOperationsDetailsService,
  listBookingOperationsService,
} from "../../services/operations/booking-operations-service.js";

export const getBookingOperationsDetails = asyncHandler(async (req, res) => {
  const data = await getBookingOperationsDetailsService({
    bookingId: req.params.bookingId,
    req,
  });
  res.status(200).json({ success: true, data });
});

export const listBookingOperations = asyncHandler(async (req, res) => {
  const data = await listBookingOperationsService(req.query);
  res.status(200).json({ success: true, ...data });
});
