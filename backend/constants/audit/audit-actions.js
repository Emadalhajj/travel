// constants/audit/audit-actions.js

/*
=====================================================
Audit Actions Constants
=====================================================

هذا الملف يحتوي على أنواع العمليات التي يتم تسجيلها
داخل سجل التدقيق Audit Log.

الهدف:
-----------------------------------------------------
توحيد أسماء العمليات بدل كتابتها يدويًا في أكثر من ملف.
=====================================================
*/

export const AUDIT_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  RESTORE: "restore",
  STATUS_CHANGE: "status_change",
  PAYMENT_STATUS_CHANGE: "payment_status_change",
  LOGIN: "login",
  LOGOUT: "logout",
  GENERATE_PDF: "generate_pdf",
};

export const AUDIT_ACTIONS_LIST = Object.values(AUDIT_ACTIONS);