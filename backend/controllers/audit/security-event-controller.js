// controllers/audit/security-event-controller.js

/*
=====================================================
Security Event Controller
=====================================================

يعرض الأحداث الأمنية للإدارة.

إنشاء الأحداث الأمنية يتم غالبًا من:
-----------------------------------------------------
- auth middleware
- login controller
- authorize middleware
=====================================================
*/

import {
  getSecurityEvents,
} from "../../services/audit/security-event-service.js";

/*
=====================================================
listSecurityEvents
=====================================================

عرض الأحداث الأمنية.
=====================================================
*/

export const listSecurityEvents = async (req, res, next) => {
  try {
    const result = await getSecurityEvents({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      type: req.query.type,
      user: req.query.user,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
