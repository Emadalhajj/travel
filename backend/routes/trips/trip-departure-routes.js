import express from "express";

import {
  cancelTripDeparture,
  completeTripDeparture,
  createTripDeparture,
  deleteTripDeparture,
  getAllTripDepartures,
  getTripDepartureById,
  restoreTripDeparture,
  scheduleTripDeparture,
  toggleTripDepartureActive,
  updateTripDeparture,
} from "../../controllers/trips/trip-departure-controller.js";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { validate } from "../../middleware/validate.js";
import {
  createTripDepartureSchema,
  updateTripDepartureSchema,
} from "../../validations/trips/trip-departure-validation.js";

const tripDepartureRoutes = express.Router();
const adminOnly = authorize("admin", "superAdmin");

tripDepartureRoutes.get("/", getAllTripDepartures);
tripDepartureRoutes.get("/:id", getTripDepartureById);

tripDepartureRoutes.post(
  "/",
  protect,
  adminOnly,
  validate(createTripDepartureSchema),
  createTripDeparture,
);

tripDepartureRoutes.patch(
  "/:id",
  protect,
  adminOnly,
  validate(updateTripDepartureSchema),
  updateTripDeparture,
);

tripDepartureRoutes.post("/:id/schedule", protect, adminOnly, scheduleTripDeparture);
tripDepartureRoutes.post("/:id/cancel", protect, adminOnly, cancelTripDeparture);
tripDepartureRoutes.post("/:id/complete", protect, adminOnly, completeTripDeparture);

tripDepartureRoutes.patch(
  "/:id/toggle-active",
  protect,
  adminOnly,
  toggleTripDepartureActive,
);

tripDepartureRoutes.patch(
  "/:id/restore",
  protect,
  adminOnly,
  restoreTripDeparture,
);

tripDepartureRoutes.delete(
  "/:id",
  protect,
  adminOnly,
  deleteTripDeparture,
);

export default tripDepartureRoutes;
