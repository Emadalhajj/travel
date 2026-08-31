import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import { USER_ROLES } from "../../constants/auth/roles.js";
import {
  getAdminLookup,
  getHotelLookupById,
} from "../../controllers/lookups/admin-lookup-controller.js";

const router = express.Router();
const adminOnly = authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);

router.get("/lookups/hotels/:hotelId", protect, adminOnly, getHotelLookupById);
router.get("/lookups/:type", protect, adminOnly, getAdminLookup);

export default router;
