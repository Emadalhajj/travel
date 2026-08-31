// routes/draft-bookings/draft-booking-route.js

/*
=====================================================
Draft Booking Routes
=====================================================

مسارات مسودات الحجز.

المستخدم:
-----------------------------------------------------
- إنشاء مسودة
- تحديث مسودة
- عرض مسوداته
- عرض مسودة واحدة
- إلغاء مسودة
- تحويل المسودة إلى حجز

الإدارة:
-----------------------------------------------------
- عرض كل المسودات
- تحديث المسودات المنتهية
- حذف مسودة حذفًا ناعمًا

ملاحظة:
-----------------------------------------------------
Draft Booking لا يعني حجز مؤكد.
هو مجرد بيانات مؤقتة قبل إنشاء Booking فعلي.
=====================================================
*/

import express from "express";

import { protect, authorize } from "../../middleware/authMiddleware.js";

import {
  createDraft,
  updateDraft,
  getDraft,
  getMyDrafts,
  getAllDrafts,
  cancelDraft,
  completeDraft,
  expireDrafts,
  deleteDraft,
  uploadDraftDocument,
} from "../../controllers/draft-bookings/draft-booking-controller.js";
import {
  uploadDraftDocument as uploadDraftDocumentMiddleware,
} from "../../middleware/upload/index.js";
import {
  draftCreationRateLimiter,
  uploadRateLimiter,
} from "../../middleware/security/rate-limiters.js";

const DraftBookingRoute = express.Router();

/*
=====================================================
Create Draft Booking
=====================================================

إنشاء مسودة حجز جديدة.
=====================================================
*/

DraftBookingRoute.post(
  "/draft-bookings",
  protect,
  draftCreationRateLimiter,
  createDraft,
);

/*
=====================================================
Get My Draft Bookings
=====================================================

جلب مسودات المستخدم الحالي.
=====================================================
*/

DraftBookingRoute.get(
  "/draft-bookings/my",
  protect,
  getMyDrafts,
);

DraftBookingRoute.post(
  "/draft-bookings/:id/documents",
  protect,
  uploadRateLimiter,
  uploadDraftDocumentMiddleware.single("document"),
  uploadDraftDocument,
);

/*
=====================================================
Get All Draft Bookings
=====================================================

جلب كل المسودات للإدارة.
=====================================================
*/

DraftBookingRoute.get(
  "/draft-bookings",
  protect,
  authorize("admin", "superAdmin"),
  getAllDrafts,
);

/*
=====================================================
Get Draft Booking By ID
=====================================================

جلب مسودة واحدة.
=====================================================
*/

DraftBookingRoute.get(
  "/draft-bookings/:id",
  protect,
  getDraft,
);
/*
=====================================================
Expire Old Draft Bookings
=====================================================

تحديث المسودات القديمة إلى expired.
=====================================================
*/

DraftBookingRoute.patch(
  "/draft-bookings/expire/old",
  protect,
  authorize("admin", "superAdmin"),
  expireDrafts,
);


/*
=====================================================
Update Draft Booking
=====================================================

تحديث مسودة موجودة.
=====================================================
*/

DraftBookingRoute.patch(
  "/draft-bookings/:id",
  protect,
  updateDraft,
);

/*
=====================================================
Cancel Draft Booking
=====================================================

إلغاء المسودة.
=====================================================
*/

DraftBookingRoute.patch(
  "/draft-bookings/:id/cancel",
  protect,
  cancelDraft,
);

/*
=====================================================
Complete Draft Booking
=====================================================

تحويل المسودة إلى Booking حقيقي.
=====================================================
*/

DraftBookingRoute.post(
  "/draft-bookings/:id/complete",
  protect,
  completeDraft,
);


/*
=====================================================
Soft Delete Draft Booking
=====================================================

حذف ناعم للمسودة.
=====================================================
*/

DraftBookingRoute.delete(
  "/draft-bookings/:id",
  protect,
  authorize("admin", "superAdmin"),
  deleteDraft,
);

export default DraftBookingRoute;
