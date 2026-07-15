// import express from "express";
// import mongoose from "mongoose";
// import { createVisaBooking, getBookingsForUser, listAllBookings, updateBookingStatus } from "../controllers/booking-controller.js";

// import { protect, authorize } from "../middleware/authMiddleware.js";
// import { validate } from "../middleware/validate.js";
// // import { createVisaBookingSchema } from "../services/booking-validation.js";
// import { upload } from "../middleware/upload.js";

// const bookingRouter = express.Router();

// bookingRouter.post(
//   "/visa",
//   protect,
//   upload.fields([
//       { name: "passportImage", maxCount: 1 },
//       { name: "personalImage", maxCount: 1 },
//     ]),
//     // validate(createVisaBookingSchema),
//     createVisaBooking
// );
// // العميل يحصل على طلباته
// bookingRouter.get("/mybooking" , protect , getBookingsForUser)

// // الأدمن يطلع على كل الطلبات
// bookingRouter.get("/listallbookings" , protect , authorize("admin") , listAllBookings)
// // الأدمن يحدث حالة طلب

// bookingRouter.patch("/:id/status" , protect , authorize("admin") , updateBookingStatus)



// export default bookingRouter 