import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";
import { USER_ROLES } from "../../constants/auth/roles.js";
import {
  getBookingsReport,
  getPaymentsReport,
  getProgramsReport,
  getReportsOverview,
} from "../../controllers/reports/report-controller.js";

const reportRoute = express.Router();
export const REPORT_READ_ROLES = Object.freeze([
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
]);

reportRoute.get("/reports/overview", protect, authorize(REPORT_READ_ROLES), getReportsOverview);
reportRoute.get("/reports/bookings", protect, authorize(REPORT_READ_ROLES), getBookingsReport);
reportRoute.get("/reports/payments", protect, authorize(REPORT_READ_ROLES), getPaymentsReport);
reportRoute.get("/reports/programs", protect, authorize(REPORT_READ_ROLES), getProgramsReport);

export default reportRoute;
