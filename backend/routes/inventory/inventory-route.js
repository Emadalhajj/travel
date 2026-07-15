import express from "express";

import {
  protect,
  authorize,
} from "../../middleware/authMiddleware.js";

import {
  getAllInventory,
  getInventoryPeriods,
  createInventory,
  upsertInventoryPeriod,
  updateInventory,
  deleteInventory,
  createRoomTypeInventory,
} from "../../controllers/inventory/inventory-controller.js";

const InventoryRoute = express.Router();

InventoryRoute.route("/inventory")
  .get(protect, authorize("admin", "superAdmin"), getAllInventory)
  .post(protect, authorize("admin", "superAdmin"), createInventory);

InventoryRoute.get(
  "/inventory/periods",
  protect,
  authorize("admin", "superAdmin"),
  getInventoryPeriods,
);

InventoryRoute.post(
  "/inventory/period",
  protect,
  authorize("admin", "superAdmin"),
  upsertInventoryPeriod,
);

InventoryRoute.post(
  "/inventory/room-types",
  protect,
  authorize("admin", "superAdmin"),
  createRoomTypeInventory,
);

InventoryRoute.route("/inventory/:id")
  .patch(protect, authorize("admin", "superAdmin"), updateInventory)
  .delete(protect, authorize("admin", "superAdmin"), deleteInventory);

export default InventoryRoute;