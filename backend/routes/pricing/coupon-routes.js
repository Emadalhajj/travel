import express from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { destroy, index, show, store, update } from "../../controllers/pricing/coupon-controller.js";

const router = express.Router();
router.use(protect, authorize("admin", "superAdmin"));
router.route("/").get(index).post(store);
router.route("/:id").get(show).patch(update).delete(destroy);
export default router;

