// controllers/soft-delete-controller.js

/*
=====================================================
Soft Delete Controller
=====================================================

هذا الملف يستقبل طلبات الحذف الناعم والاسترجاع.

مسؤول عن:
-----------------------------------------------------
- قراءة resource من params
- قراءة id من params
- قراءة user من req.user
- استدعاء service المناسب
- إرجاع response

ملاحظة:
-----------------------------------------------------
لا يحتوي business logic.
المنطق الأساسي داخل soft-delete-service.js.
=====================================================
*/

import {
  softDeleteResource,
  restoreResource,
  getDeletedResources,
} from "../services/soft-delete-service.js";

/*
=====================================================
deleteResource
=====================================================

حذف ناعم لأي resource مدعوم.
=====================================================
*/

export const deleteResource = async (req, res, next) => {
  try {
    const item = await softDeleteResource({
      resource: req.params.resource,
      id: req.params.id,
      userId: req.user?._id,
    });

    res.status(200).json({
      success: true,
      message: "Resource soft deleted successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
restoreResourceController
=====================================================

استرجاع resource محذوف.
=====================================================
*/

export const restoreResourceController = async (req, res, next) => {
  try {
    const item = await restoreResource({
      resource: req.params.resource,
      id: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: "Resource restored successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/*
=====================================================
getDeletedResourcesController
=====================================================

جلب العناصر المحذوفة من resource معين.
=====================================================
*/

export const getDeletedResourcesController = async (req, res, next) => {
  try {
    const result = await getDeletedResources({
      resource: req.params.resource,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};