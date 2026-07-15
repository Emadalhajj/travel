// controllers/audit/audit-log-controller.js

/*
=====================================================
Audit Log Controller
=====================================================

يستقبل طلبات عرض سجلات التدقيق.

ملاحظة:
-----------------------------------------------------
إنشاء Audit Log لا يكون غالبًا من route مباشر.
بل يتم من services عند حدوث عملية حساسة.
=====================================================
*/

import {
  getAuditLogs,
  getEntityAuditLogs,
} from "../../services/audit/audit-log-service.js";

/*
=====================================================
listAuditLogs
=====================================================

عرض كل سجلات التدقيق للإدارة.
=====================================================
*/

export const listAuditLogs = async (req, res, next) => {
  try {
    const result = await getAuditLogs({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      action: req.query.action,
      entity: req.query.entity,
      user: req.query.user,
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
listEntityAuditLogs
=====================================================

عرض سجل التدقيق الخاص بكيان معين.
=====================================================
*/

export const listEntityAuditLogs = async (req, res, next) => {
  try {
    const logs = await getEntityAuditLogs({
      entity: req.params.entity,
      entityId: req.params.entityId,
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};