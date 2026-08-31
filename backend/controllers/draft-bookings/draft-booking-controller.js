// controllers/draft-bookings/draft-booking-controller.js

/*
=====================================================
Draft Booking Controller
=====================================================

هذا الملف يستقبل طلبات Draft Booking من route.

مسؤول عن:
-----------------------------------------------------
- قراءة req.body
- قراءة req.params
- قراءة req.query
- قراءة req.user
- استدعاء service المناسب
- إرجاع response للواجهة

ملاحظة:
-----------------------------------------------------
لا نضع business logic داخل controller.
=====================================================
*/

import {
  createDraftBooking,
  updateDraftBooking,
  getDraftBookingById,
  getMyDraftBookings,
  getAllDraftBookings,
  cancelDraftBooking,
  convertDraftToBooking,
  expireOldDraftBookings,
  softDeleteDraftBooking,
} from "../../services/draft-bookings/draft-booking-service.js";
import AppError from "../../utils/AppError.js";

/*
=====================================================
createDraft
=====================================================

إنشاء مسودة جديدة.
=====================================================
*/

export const createDraft = async (req, res, next) => {
  try {
    const draft = await createDraftBooking({
      data: req.body,
      userId: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Draft booking created successfully",
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadDraftDocument = async (req, res, next) => {
  try {
    const draft = await getDraftBookingById({
      draftId: req.params.id,
      userId: req.user?._id,
    });

    if (
      String(draft.user?._id || draft.user || "") !==
      String(req.user?._id || "")
    ) {
      throw new AppError("غير مصرح برفع مرفقات لهذه المسودة", 403);
    }

    if (!req.file) {
      throw new AppError("لم يتم إرفاق ملف", 400);
    }

    res.status(201).json({
      success: true,
      data: {
        name: req.file.originalname,
        url: `/api/private-files/drafts/${draft._id}/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
updateDraft
=====================================================

تحديث مسودة موجودة.
=====================================================
*/

export const updateDraft = async (req, res, next) => {
  try {
    const draft = await updateDraftBooking({
      draftId: req.params.id,
      data: req.body,
      userId: req.user?._id,
    });

    res.status(200).json({
      success: true,
      message: "Draft booking updated successfully",
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
getDraft
=====================================================

جلب مسودة واحدة.
=====================================================
*/

export const getDraft = async (req, res, next) => {
  try {
    const draft = await getDraftBookingById({
      draftId: req.params.id,
      userId: req.user?._id,
    });

    res.status(200).json({
      success: true,
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
getMyDrafts
=====================================================

جلب مسودات المستخدم الحالي.
=====================================================
*/

export const getMyDrafts = async (req, res, next) => {
  try {
    const result = await getMyDraftBookings({
      userId: req.user?._id,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      status: req.query.status,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
getAllDrafts
=====================================================

جلب كل المسودات للإدارة.
=====================================================
*/

export const getAllDrafts = async (req, res, next) => {
  try {
    const result = await getAllDraftBookings({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      status: req.query.status,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
cancelDraft
=====================================================

إلغاء مسودة.
=====================================================
*/

export const cancelDraft = async (req, res, next) => {
  try {
  const draft = await cancelDraftBooking({
  draftId: req.params.id,
  userId: req.user?._id,
});

    res.status(200).json({
      success: true,
      message: "Draft booking cancelled successfully",
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
completeDraft
=====================================================

تحويل المسودة إلى حجز فعلي.
=====================================================
*/

export const completeDraft = async (req, res, next) => {
  try {
    const result = await convertDraftToBooking({
  draftId: req.params.id,
  userId: req.user?._id,
  req,
});

    res.status(201).json({
      success: true,
      message: "Draft booking converted to booking successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
expireDrafts
=====================================================

تحديث المسودات القديمة إلى expired.

غالبًا يستخدم للإدارة أو cron job.
=====================================================
*/

export const expireDrafts = async (req, res, next) => {
  try {
    const result = await expireOldDraftBookings();

    res.status(200).json({
      success: true,
      message: "Old draft bookings expired successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
deleteDraft
=====================================================

حذف ناعم لمسودة.
=====================================================
*/

export const deleteDraft = async (req, res, next) => {
  try {
    const draft = await softDeleteDraftBooking({
      draftId: req.params.id,
      userId: req.user?._id,
    });

    res.status(200).json({
      success: true,
      message: "Draft booking deleted successfully",
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};
