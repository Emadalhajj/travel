import express from "express";

import {
  protect,
  authorize,
} from "../../middleware/authMiddleware.js";

import {
  getAllVehicleRentals,
  getOneVehicleRental,
  createVehicleRental,
  updateVehicleRental,
  deleteVehicleRental,
  toggleVehicleRentalActive,
} from "../../controllers/transports/vehicle-rental-controller.js";

const VehicleRentalRoute = express.Router();

VehicleRentalRoute.get(
  "/vehicle-rentals",
  protect,
  authorize("admin", "superAdmin"),
  getAllVehicleRentals,
);

VehicleRentalRoute.get(
  "/vehicle-rentals/:id",
  protect,
  authorize("admin", "superAdmin"),
  getOneVehicleRental,
);

VehicleRentalRoute.post(
  "/vehicle-rentals",
  protect,
  authorize("admin", "superAdmin"),
  createVehicleRental,
);

VehicleRentalRoute.put(
  "/vehicle-rentals/:id",
  protect,
  authorize("admin", "superAdmin"),
  updateVehicleRental,
);

VehicleRentalRoute.delete(
  "/vehicle-rentals/:id",
  protect,
  authorize("admin", "superAdmin"),
  deleteVehicleRental,
);

VehicleRentalRoute.patch(
  "/vehicle-rentals/:id/toggle-active",
  protect,
  authorize("admin", "superAdmin"),
  toggleVehicleRentalActive,
);


export default VehicleRentalRoute;