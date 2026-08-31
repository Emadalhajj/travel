import assert from "node:assert/strict";
import test from "node:test";

import PaymentTransaction from "../../models/payments/paymentTransaction-model.js";
import {
  calculateBookingPaymentSummary,
  findBlockingPublicPaymentForDraftService,
} from "../../services/payment/paymentTransaction-service.js";

const originalFind = PaymentTransaction.find;
const originalFindOne = PaymentTransaction.findOne;

test.afterEach(() => {
  PaymentTransaction.find = originalFind;
  PaymentTransaction.findOne = originalFindOne;
});

test("payment summary selects amount only and preserves its numeric result", async () => {
  let selectedFields = "";
  PaymentTransaction.find = () => ({
    select(fields) {
      selectedFields = fields;
      return this;
    },
    lean: async () => [{ amount: 30 }, { amount: 20 }],
  });

  const summary = await calculateBookingPaymentSummary({
    booking: { _id: "507f1f77bcf86cd799439011", pricing: { totalPrice: 100 } },
  });

  assert.equal(selectedFields, "amount");
  assert.deepEqual(summary, {
    paidAmount: 50,
    remainingAmount: 50,
    paymentStatus: "partial",
  });
});

test("public payment blocking lookup is projected and lean", async () => {
  let selectedFields = "";
  let sortedBy;
  let leanCalled = false;
  const row = { status: "pending", amount: 999 };
  PaymentTransaction.findOne = () => ({
    select(fields) {
      selectedFields = fields;
      return this;
    },
    sort(value) {
      sortedBy = value;
      return this;
    },
    lean: async () => {
      leanCalled = true;
      return row;
    },
  });

  const result = await findBlockingPublicPaymentForDraftService({
    draftBookingId: "507f1f77bcf86cd799439011",
  });

  assert.equal(selectedFields, "status methodCode providerCode booking updatedAt");
  assert.deepEqual(sortedBy, { updatedAt: -1 });
  assert.equal(leanCalled, true);
  assert.equal(result, row);
});
