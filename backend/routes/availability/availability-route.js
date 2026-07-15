/*
=====================================================
Availability Routes
=====================================================

مسارات عرض المنتجات المتاحة حسب فترة برنامج العمرة.

تستخدم في:
- إنشاء برنامج عمرة من لوحة الإدارة
- عرض المنتجات المتاحة حسب startDate و endDate

=====================================================
*/

import express from "express";

import {
  protect,
  authorize,
} from "../../middleware/authMiddleware.js";

import {
  getAvailablePackageProducts,
} from "../../controllers/availability/availability-controller.js";

const AvailabilityRoute = express.Router();

/*
=====================================================
GET /api/availability/products
=====================================================

Query Params:
- startDate
- endDate
- pilgrimsCount

مثال:
GET /api/availability/products?startDate=2026-05-01&endDate=2026-05-10&pilgrimsCount=2

يرجع:
- التأشيرات المتاحة
- أنواع الغرف المتاحة
- الرحلات المتاحة
- النقل المتاح
- الفنادق المرتبطة بالغرف المتاحة
=====================================================
*/

AvailabilityRoute.get(
  "/availability/products",
  protect,
  authorize("admin", "superAdmin"),
  getAvailablePackageProducts,
);

export default AvailabilityRoute;