// routes/umrah-programs/umrah-program-route.js

/*
=====================================================
Umrah Program Routes
=====================================================

مسارات برامج العمرة.

العميل:
-----------------------------------------------------
- عرض البرامج المتاحة
- عرض تفاصيل برنامج

الإدارة:
-----------------------------------------------------
- إنشاء برنامج
- تحديث برنامج
- تغيير حالة برنامج
- حجز أو إرجاع مقاعد
- حذف ناعم
- استرجاع محذوف

ملاحظة:
-----------------------------------------------------
البرامج هي الأساس الذي ستُبنى عليه الحجوزات لاحقًا.
=====================================================
*/

import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";
import parseFormData from "../../middleware/parseFormData.js";
import { uploadUmrahProgram } from "../../middleware/upload/index.js";

import {
  createProgram,
  getPrograms,
  getPublicProgramDetails,
  getPublicPrograms,
  getProgramById,
  updateProgram,
  updateProgramStatus,
  reserveSeats,
  releaseSeats,
  deleteProgram,
  restoreProgram,
} from "../../controllers/umrah-programs/umrah-program-controller.js";

const UmrahProgramRoute = express.Router();

const umrahProgramUploadMiddleware = [
  uploadUmrahProgram.fields([
    { name: "images", maxCount: 10 },
  ]),
  parseFormData({
    imagesField: "images",
    uploadPath: "/uploads/umrah-programs",
  }),
];

/*
=====================================================
Public Programs
=====================================================

عرض البرامج المتاحة للعملاء.
=====================================================
*/

UmrahProgramRoute.get(
  "/umrah-programs/public",
  getPublicPrograms,
);

UmrahProgramRoute.get(
  "/umrah-programs/public/:id",
  getPublicProgramDetails,
);

/*
=====================================================
Get Program By ID
=====================================================

عرض تفاصيل برنامج واحد.
=====================================================
*/

UmrahProgramRoute.get(
  "/umrah-programs/:id",
  getProgramById,
);

/*
=====================================================
Admin Get All Programs
=====================================================

عرض جميع البرامج للإدارة.
=====================================================
*/

UmrahProgramRoute.get(
  "/umrah-programs",
  protect,
  authorize("admin", "superAdmin"),
  getPrograms,
);

/*
=====================================================
Create Program
=====================================================

إنشاء برنامج جديد.
=====================================================
*/

UmrahProgramRoute.post(
  "/umrah-programs",
  protect,
  authorize("admin", "superAdmin"),
  ...umrahProgramUploadMiddleware,
  createProgram,
);

/*
=====================================================
Update Program
=====================================================

تحديث بيانات البرنامج.
=====================================================
*/

UmrahProgramRoute.patch(
  "/umrah-programs/:id",
  protect,
  authorize("admin", "superAdmin"),
  ...umrahProgramUploadMiddleware,
  updateProgram,
);

/*
=====================================================
Update Program Status
=====================================================

تغيير حالة البرنامج.
=====================================================
*/

UmrahProgramRoute.patch(
  "/umrah-programs/:id/status",
  protect,
  authorize("admin", "superAdmin"),
  updateProgramStatus,
);

/*
=====================================================
Reserve Seats
=====================================================

حجز مقاعد من البرنامج.
=====================================================
*/

UmrahProgramRoute.patch(
  "/umrah-programs/:id/reserve-seats",
  protect,
  authorize("admin", "superAdmin"),
  reserveSeats,
);

/*
=====================================================
Release Seats
=====================================================

إرجاع مقاعد للبرنامج.
=====================================================
*/

UmrahProgramRoute.patch(
  "/umrah-programs/:id/release-seats",
  protect,
  authorize("admin", "superAdmin"),
  releaseSeats,
);

/*
=====================================================
Soft Delete Program
=====================================================

حذف البرنامج حذفًا ناعمًا.
=====================================================
*/

UmrahProgramRoute.delete(
  "/umrah-programs/:id",
  protect,
  authorize("admin", "superAdmin"),
  deleteProgram,
);

/*
=====================================================
Restore Program
=====================================================

استرجاع البرنامج المحذوف.
=====================================================
*/

UmrahProgramRoute.patch(
  "/umrah-programs/:id/restore",
  protect,
  authorize("admin", "superAdmin"),
  restoreProgram,
);

export default UmrahProgramRoute;
