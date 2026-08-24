import assert from "node:assert/strict";
import test from "node:test";

import Notification from "../../models/notification-model.js";
import { NOTIFICATION_TYPES } from "../../constants/notifications/notification-constants.js";
import { sendInitialBookingNotification } from "../../services/notifications/booking-notification-service.js";
import {
  sendBankTransferApprovedNotification,
  sendBankTransferRejectedNotification,
  sendBankTransferSubmittedNotification,
  sendPaidPendingBookingNotification,
  sendPaymentFailedNotification,
  sendPaymentReceivedNotification,
} from "../../services/notifications/payment-notification-service.js";

const installNotificationStore = () => {
  const rows = [];
  const originals = { create: Notification.create, findOne: Notification.findOne };
  Notification.create = async (payload) => {
    if (rows.some((row) => row.deduplicationKey === payload.deduplicationKey)) {
      const error = new Error("duplicate key");
      error.code = 11000;
      throw error;
    }
    const document = {
      _id: `notification-${rows.length + 1}`,
      ...payload,
      async save() { return this; },
    };
    rows.push(document);
    return document;
  };
  Notification.findOne = async ({ deduplicationKey }) =>
    rows.find((row) => row.deduplicationKey === deduplicationKey) || null;

  return {
    rows,
    restore: () => {
      Notification.create = originals.create;
      Notification.findOne = originals.findOne;
    },
  };
};

const transaction = () => ({
  _id: "payment-1",
  user: { _id: "user-1", email: "customer@example.com" },
  booking: "booking-1",
  amount: 500,
  currency: "SAR",
  paymentReference: "PAY-1",
});

const booking = (status = "confirmed") => ({
  _id: "booking-1",
  user: "user-1",
  bookingNumber: "BK-1",
  bookingStatus: status,
  customer: { email: "customer@example.com" },
  pricing: { totalPrice: 500, currency: "SAR" },
});

test("provider success requested repeatedly creates one received notification", async () => {
  const store = installNotificationStore();
  try {
    await sendPaymentReceivedNotification({ transaction: transaction(), booking: booking() });
    await sendPaymentReceivedNotification({ transaction: transaction(), booking: booking() });
    assert.equal(store.rows.length, 2);
    assert.ok(store.rows.every(({ type }) => type === NOTIFICATION_TYPES.PAYMENT_RECEIVED));
  } finally { store.restore(); }
});

test("payment failure creates one failed notification", async () => {
  const store = installNotificationStore();
  try {
    await sendPaymentFailedNotification({ transaction: transaction() });
    await sendPaymentFailedNotification({ transaction: transaction() });
    assert.equal(store.rows.length, 2);
    assert.ok(store.rows.every(({ type }) => type === NOTIFICATION_TYPES.PAYMENT_FAILED));
  } finally { store.restore(); }
});

test("paid pending is deduplicated and later success creates only its distinct event", async () => {
  const store = installNotificationStore();
  try {
    await sendPaidPendingBookingNotification({ transaction: transaction() });
    await sendPaidPendingBookingNotification({ transaction: transaction() });
    await sendPaymentReceivedNotification({ transaction: transaction(), booking: booking() });
    assert.equal(store.rows.length, 4);
    assert.equal(store.rows.filter(({ type }) => type === NOTIFICATION_TYPES.PAID_PENDING_BOOKING).length, 2);
    assert.equal(store.rows.filter(({ type }) => type === NOTIFICATION_TYPES.PAYMENT_RECEIVED).length, 2);
  } finally { store.restore(); }
});

test("bank transfer submitted, approved and rejected use distinct event records", async () => {
  const store = installNotificationStore();
  try {
    await sendBankTransferSubmittedNotification({ transaction: transaction() });
    await sendBankTransferApprovedNotification({ transaction: transaction(), booking: booking() });
    await sendBankTransferRejectedNotification({
      transaction: { ...transaction(), rejectionReason: "reference mismatch" },
    });
    assert.equal(store.rows.length, 6);
    for (const type of [
      NOTIFICATION_TYPES.BANK_TRANSFER_SUBMITTED,
      NOTIFICATION_TYPES.BANK_TRANSFER_APPROVED,
      NOTIFICATION_TYPES.BANK_TRANSFER_REJECTED,
    ]) {
      assert.equal(store.rows.filter((row) => row.type === type).length, 2);
    }
  } finally { store.restore(); }
});

test("confirmed booking creation emits confirmed only", async () => {
  const store = installNotificationStore();
  try {
    await sendInitialBookingNotification({ booking: booking("confirmed") });
    assert.equal(store.rows.length, 2);
    assert.ok(store.rows.every(({ type }) => type === NOTIFICATION_TYPES.BOOKING_CONFIRMED));
    assert.equal(
      store.rows.some(({ type }) => type === NOTIFICATION_TYPES.BOOKING_CREATED),
      false,
    );
  } finally { store.restore(); }
});

test("missing customer email keeps database sent and records email failure", async () => {
  const store = installNotificationStore();
  try {
    const bookingWithoutEmail = booking("confirmed");
    bookingWithoutEmail.customer = {};
    await sendInitialBookingNotification({ booking: bookingWithoutEmail });

    const databaseRecord = store.rows.find(({ channel }) => channel === "database");
    const emailRecord = store.rows.find(({ channel }) => channel === "email");
    assert.equal(databaseRecord.status, "sent");
    assert.equal(emailRecord.status, "failed");
    assert.equal(emailRecord.failedReason, "Email recipient is missing");
  } finally { store.restore(); }
});
