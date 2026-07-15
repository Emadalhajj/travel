// routes/soft-delete-route.js

/*
=====================================================
Soft Delete Routes
=====================================================

مسارات الحذف الناعم العامة.

الإدارة:
-----------------------------------------------------
- حذف أي resource حذفًا ناعمًا
- استرجاع أي resource محذوف
- عرض العناصر المحذوفة

Resources المدعومة:
-----------------------------------------------------
- bookings
- draft-bookings
- vouchers
- notifications
- inventories
- payment-transactions

ملاحظة:
-----------------------------------------------------
هذه المسارات للإدارة فقط لأنها تتحكم بالحذف والاسترجاع.
=====================================================
*/

import express from "express";

import { protect, authorize } from "../middleware/authMiddleware.js";

import {
  deleteResource,
  restoreResourceController,
  getDeletedResourcesController,
} from "../controllers/soft-delete-controller.js";

const SoftDeleteRoute = express.Router();

/*
=====================================================
Get Deleted Resources
=====================================================

جلب العناصر المحذوفة من resource معين.

Example:
-----------------------------------------------------
GET /api/soft-delete/bookings/deleted
=====================================================
*/

SoftDeleteRoute.get(
  "/soft-delete/:resource/deleted",
  protect,
  authorize("admin", "superAdmin"),
  getDeletedResourcesController,
);

/*
=====================================================
Soft Delete Resource
=====================================================

حذف resource حذفًا ناعمًا.

Example:
-----------------------------------------------------
DELETE /api/soft-delete/bookings/BOOKING_ID
=====================================================
*/

SoftDeleteRoute.delete(
  "/soft-delete/:resource/:id",
  protect,
  authorize("admin", "superAdmin"),
  deleteResource,
);

/*
=====================================================
Restore Deleted Resource
=====================================================

استرجاع resource محذوف.

Example:
-----------------------------------------------------
PATCH /api/soft-delete/bookings/BOOKING_ID/restore
=====================================================
*/

SoftDeleteRoute.patch(
  "/soft-delete/:resource/:id/restore",
  protect,
  authorize("admin", "superAdmin"),
  restoreResourceController,
);

export default SoftDeleteRoute;