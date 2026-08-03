/*
=====================================================
Payment Transaction Status Transitions
=====================================================

الخريطة المركزية للانتقالات المسموحة.
لا يجب كتابة قواعد انتقال داخل Controller أو Provider.
=====================================================
*/

import {
  LEGACY_PAYMENT_TRANSACTION_STATUSES,
  PAYMENT_TRANSACTION_STATUSES,
} from "./payment-transaction-statuses.js";

const S = PAYMENT_TRANSACTION_STATUSES;

export const PAYMENT_TRANSACTION_STATUS_TRANSITIONS = Object.freeze({
  [S.INITIATED]: Object.freeze([
    S.PENDING,
    S.PENDING_PROOF,
    S.PENDING_APPROVAL,
    S.PENDING_REVIEW,
    S.PROCESSING,
    S.AUTHORIZED,
    S.FAILED,
    S.CANCELED,
    S.EXPIRED,
  ]),

  [S.PENDING]: Object.freeze([
    S.PENDING_PROOF,
    S.PENDING_APPROVAL,
    S.PENDING_VERIFICATION,
    S.PENDING_REVIEW,
    S.PROCESSING,
    S.AUTHORIZED,
    S.SUCCESS,
    S.PAID_PENDING_BOOKING,
    S.FAILED,
    S.CANCELED,
    S.EXPIRED,
  ]),

  [S.PENDING_PROOF]: Object.freeze([
    S.PENDING_VERIFICATION,
    S.PENDING_REVIEW,
    S.FAILED,
    S.REJECTED,
    S.CANCELED,
    S.EXPIRED,
  ]),

  [S.PENDING_APPROVAL]: Object.freeze([
    S.PENDING_REVIEW,
    S.CAPTURED,
    S.SUCCESS,
    S.FAILED,
    S.REJECTED,
    S.CANCELED,
    S.EXPIRED,
  ]),

  [S.PENDING_VERIFICATION]: Object.freeze([
    S.PENDING_REVIEW,
    S.CAPTURED,
    S.SUCCESS,
    S.FAILED,
    S.REJECTED,
    S.CANCELED,
    S.EXPIRED,
  ]),

  [S.PENDING_REVIEW]: Object.freeze([
    S.PROCESSING,
    S.CAPTURED,
    S.SUCCESS,
    S.FAILED,
    S.REJECTED,
    S.CANCELED,
    S.EXPIRED,
  ]),

  [S.PROCESSING]: Object.freeze([
    S.AUTHORIZED,
    S.CAPTURED,
    S.SUCCESS,
    S.PAID_PENDING_BOOKING,
    S.FAILED,
    S.CANCELED,
    S.EXPIRED,
  ]),

  [S.AUTHORIZED]: Object.freeze([
    S.CAPTURED,
    S.SUCCESS,
    S.FAILED,
    S.CANCELED,
    S.EXPIRED,
  ]),

  [S.CAPTURED]: Object.freeze([
    S.SUCCESS,
    S.PAID_PENDING_BOOKING,
    S.REFUNDED,
    S.PARTIALLY_REFUNDED,
  ]),

  [S.SUCCESS]: Object.freeze([
    S.REFUNDED,
    S.PARTIALLY_REFUNDED,
  ]),

  [S.PARTIALLY_REFUNDED]: Object.freeze([
    S.REFUNDED,
  ]),

  [S.PAID_PENDING_BOOKING]: Object.freeze([
    S.SUCCESS,
    S.REFUNDED,
    S.PARTIALLY_REFUNDED,
  ]),

  [LEGACY_PAYMENT_TRANSACTION_STATUSES.PAID]: Object.freeze([
    S.SUCCESS,
    S.REFUNDED,
    S.PARTIALLY_REFUNDED,
  ]),

  [S.FAILED]: Object.freeze([]),
  [S.REJECTED]: Object.freeze([]),
  [S.CANCELED]: Object.freeze([]),
  [S.EXPIRED]: Object.freeze([]),
  [S.REFUNDED]: Object.freeze([]),
});
