import test from "node:test";
import assert from "node:assert/strict";

import {
  cancelHyperPayPayment,
  captureHyperPayPayment,
  classifyHyperPayResultCode,
  createHyperPayCheckout,
  refundHyperPayPayment,
} from "../../services/payment/hyperpay-service.js";

const providerConfig = {
  baseUrl: "https://test.oppwa.com",
  credentials: {
    entityId: "entity-test",
    accessToken: "token-test",
  },
};

const withFetchMock = async (responseData, callback) => {
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => responseData,
    };
  };

  try {
    await callback(() => request);
  } finally {
    global.fetch = originalFetch;
  }
};

test("classifies successful, pending and failed HyperPay codes", () => {
  assert.equal(classifyHyperPayResultCode("000.000.000"), "SUCCESS");
  assert.equal(classifyHyperPayResultCode("000.200.000"), "PENDING");
  assert.equal(classifyHyperPayResultCode("800.100.100"), "FAILED");
});

test("checkout requests PA authorization", async () => {
  await withFetchMock(
    { id: "checkout-1", result: { code: "000.200.000" } },
    async (getRequest) => {
      await createHyperPayCheckout({
        amount: 10,
        currency: "SAR",
        paymentMethodCode: "MADA",
        merchantTransactionId: "merchant-123",
        returnUrl: "https://example.com/result",
        providerConfig,
      });
      assert.ok(getRequest().options.signal instanceof AbortSignal);
      const body = new URLSearchParams(getRequest().options.body);
      assert.equal(body.get("paymentType"), "PA");
    },
  );
});

for (const [name, operation, paymentType] of [
  ["capture", captureHyperPayPayment, "CP"],
  ["refund", refundHyperPayPayment, "RF"],
  ["cancel", cancelHyperPayPayment, "RV"],
]) {
  test(`${name} sends ${paymentType} before local state changes`, async () => {
    await withFetchMock(
      {
        id: `${name}-id`,
        paymentType,
        amount: "10.00",
        currency: "SAR",
        result: { code: "000.000.000", description: "ok" },
      },
      async (getRequest) => {
        const result = await operation({
          referencedPaymentId: "original-payment-id",
          amount: 10,
          currency: "SAR",
          providerConfig,
        });
        const request = getRequest();
        const body = new URLSearchParams(request.options.body);
        assert.match(request.url, /\/v1\/payments\/original-payment-id$/);
        assert.equal(body.get("paymentType"), paymentType);
        assert.equal(result.operationStatus, "SUCCESS");
      },
    );
  });
}

test("provider failure rejects the operation", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      result: { code: "800.100.100", description: "declined" },
    }),
  });
  try {
    await assert.rejects(
      captureHyperPayPayment({
        referencedPaymentId: "payment-id",
        amount: 10,
        currency: "SAR",
        providerConfig,
      }),
      /declined/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});
