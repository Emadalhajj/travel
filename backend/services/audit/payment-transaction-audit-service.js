/*
=====================================================
Payment Transaction Audit Service
=====================================================

يسجل بيانات تشغيلية منقحة فقط، ولا يسجل credentials
أو metadata الداخلية أو raw provider payload.
=====================================================
*/

import { createAuditLog } from "./audit-log-service.js";
import { AUDIT_ACTIONS } from "../../constants/audit/audit-actions.js";
import { AUDIT_ENTITIES } from "../../constants/audit/audit-entities.js";

const sanitizeTransaction = (transaction) => {
  const source =
    typeof transaction?.toObject === "function"
      ? transaction.toObject()
      : { ...(transaction || {}) };

  return {
    _id: source._id,
    draftBooking: source.draftBooking || null,
    booking: source.booking || null,
    paymentConfigurationId:
      source.paymentConfigurationId || null,
    methodCode: source.methodCode || "",
    providerCode: source.providerCode || "",
    bankAccount: source.bankAccount || null,
    amount: source.amount,
    currency: source.currency,
    status: source.status,
    paymentReference:
      source.paymentReference || "",
    providerReference:
      source.providerReference || "",
    checkoutId: source.checkoutId || "",
    failureReason: source.failureReason || "",
    rejectionReason:
      source.rejectionReason || "",
    verifiedBy: source.verifiedBy || null,
    verifiedAt: source.verifiedAt || null,
    updatedAt: source.updatedAt,
  };
};

const sanitizeProviderResult = (result) => {
  if (!result) return null;

  return {
    operationStatus:
      result.operationStatus ||
      result.verificationStatus ||
      "",
    resultCode: result.resultCode || "",
    resultDescription:
      result.resultDescription || "",
    providerReference:
      result.providerReference || "",
    referencedPaymentId:
      result.referencedPaymentId || "",
    paymentType: result.paymentType || "",
    amount: result.amount || "",
    currency: result.currency || "",
    timestamp: result.timestamp || null,
  };
};

export const recordPaymentTransactionAuditService =
  async ({
    req,
    action,
    transaction,
    before = null,
    providerResult = null,
    metadata = {},
  }) => {
    if (!transaction?._id) return null;

    return createAuditLog({
      req,
      action:
        action || AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.PAYMENT_TRANSACTION,
      entityId: transaction._id,
      before:
        before
          ? sanitizeTransaction(before)
          : null,
      after:
        sanitizeTransaction(transaction),
      // لا نمرر metadata عامة إلى Audit حتى لا تتسرب
      // بيانات داخلية أضافها أحد المستدعين مستقبلًا.
      metadata: {
        context:
          typeof metadata?.context === "string"
            ? metadata.context
            : "",
        providerResult:
          sanitizeProviderResult(providerResult),
      },
    });
  };
