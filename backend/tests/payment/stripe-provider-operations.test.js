import assert from "node:assert/strict";
import test from "node:test";

import {
  cancelStripePayment,
  captureStripePayment,
  createStripeCheckoutSession,
  refundStripePayment,
  verifyStripePayment,
} from "../../services/payment/stripe-service.js";

test("Stripe Checkout uses manual capture", async () => {
  let receivedPayload;
  const stripeClient = {
    checkout: {
      sessions: {
        create: async (payload) => {
          receivedPayload = payload;
          return {
            id: "cs_test_1",
            url: "https://checkout.stripe.com/test",
            expires_at: 1_800_000_000,
          };
        },
      },
    },
  };

  const result = await createStripeCheckoutSession({
    amount: 100.5,
    currency: "SAR",
    paymentMethodCode: "MASTERCARD",
    merchantTransactionId: "PAY-1",
    draftId: "draft-1",
    paymentConfigurationId: "config-1",
    returnUrl: "https://example.com/result?transactionId=tx-1",
    providerConfig: { stripeClient },
  });

  assert.equal(receivedPayload.payment_intent_data.capture_method, "manual");
  assert.equal(receivedPayload.line_items[0].price_data.unit_amount, 10050);
  assert.equal(result.checkoutId, "cs_test_1");
  assert.equal(result.redirectUrl, "https://checkout.stripe.com/test");
});

test("Stripe requires_capture normalizes to PA authorization", async () => {
  const stripeClient = {
    checkout: {
      sessions: {
        retrieve: async () => ({
          id: "cs_test_1",
          currency: "sar",
          amount_total: 10050,
          metadata: { paymentReference: "PAY-1" },
          payment_intent: {
            id: "pi_test_1",
            status: "requires_capture",
            amount: 10050,
            currency: "sar",
            metadata: { paymentReference: "PAY-1" },
            payment_method_types: ["card"],
          },
        }),
      },
    },
  };

  const result = await verifyStripePayment({
    checkoutId: "cs_test_1",
    providerConfig: { stripeClient },
  });

  assert.equal(result.verificationStatus, "SUCCESS");
  assert.equal(result.paymentType, "PA");
  assert.equal(result.providerReference, "pi_test_1");
  assert.equal(result.amount, 100.5);
});

test("Stripe capture, refund and smart cancel use PaymentIntent APIs", async () => {
  const calls = [];
  const stripeClient = {
    paymentIntents: {
      retrieve: async (id) => {
        calls.push(["retrieve", id]);
        return {
          id,
          status: id === "pi_refund" ? "succeeded" : "requires_capture",
        };
      },
      capture: async (id, payload) => {
        calls.push(["capture", id, payload]);
        return { id, status: "succeeded" };
      },
      cancel: async (id) => {
        calls.push(["cancel", id]);
        return { id, status: "canceled" };
      },
    },
    refunds: {
      create: async (payload) => {
        calls.push(["refund", payload]);
        return { id: "re_test_1", status: "succeeded" };
      },
    },
  };

  await captureStripePayment({
    referencedPaymentId: "pi_capture",
    amount: 10,
    currency: "SAR",
    providerConfig: { stripeClient },
  });
  await refundStripePayment({
    referencedPaymentId: "pi_refund",
    amount: 10,
    currency: "SAR",
    providerConfig: { stripeClient },
  });
  await cancelStripePayment({
    referencedPaymentId: "pi_cancel",
    providerConfig: { stripeClient },
  });

  assert.deepEqual(calls[1], ["capture", "pi_capture", { amount_to_capture: 1000 }]);
  assert.deepEqual(calls[3], ["refund", { payment_intent: "pi_refund", amount: 1000 }]);
  assert.deepEqual(calls.at(-1), ["cancel", "pi_cancel"]);
});

test("Stripe refund rejects an uncaptured PaymentIntent", async () => {
  let refundCalled = false;
  const stripeClient = {
    paymentIntents: {
      retrieve: async () => ({
        id: "pi_authorized",
        status: "requires_capture",
      }),
    },
    refunds: {
      create: async () => {
        refundCalled = true;
      },
    },
  };

  await assert.rejects(
    refundStripePayment({
      referencedPaymentId: "pi_authorized",
      amount: 10,
      currency: "SAR",
      providerConfig: { stripeClient },
    }),
    /requires_capture/,
  );

  assert.equal(refundCalled, false);
});
